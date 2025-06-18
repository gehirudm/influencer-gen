import { useEffect, useRef, useState } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import {
    Button,
    Group,
    Modal,
    Slider,
    Stack,
    Text,
    ActionIcon,
    Tooltip,
    Divider,
    Paper,
    Alert
} from "@mantine/core";
import { IconBrush, IconEraser, IconTrash, IconArrowsExchange, IconCheck, IconInfoCircle } from '@tabler/icons-react';

interface ImageMaskEditorModalProps {
    imageUrl: string;
    width?: number;
    height?: number;
    opened: boolean;
    onClose: () => void;
    onConfirm: (imageData: string) => void;
    title?: string;
}

export default function ImageMaskEditorModal({
    imageUrl,
    width: _width = 512,
    height: _height = 512,
    opened,
    onClose,
    onConfirm,
    title = "Edit Image Mask"
}: ImageMaskEditorModalProps) {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [brushSize, setBrushSize] = useState(20);
    const [isEraser, setIsEraser] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState(imageUrl);

    const aspectRatio = _width / _height;
    const width = Math.min(_width, 512);
    const height = Math.round(width / aspectRatio);

    const handleClear = () => {
        canvasRef.current?.clearCanvas();
    };

    const handleInvertMask = async () => {
        if (!canvasRef.current) return;

        const paths = await canvasRef.current.exportPaths();
        const newPaths = paths.map((path) => ({
            ...path,
            strokeColor: path.strokeColor === "black" ? "white" : "black",
        }));
        canvasRef.current.loadPaths(newPaths);
    };

    useEffect(() => {
        if (backgroundImage !== "0") return;

        const exportMask = async () => {
            try {
                if (!canvasRef.current) return;

                // Get the PNG data from the canvas
                const pngData = await canvasRef.current.exportImage("png");

                // Create a new canvas to compose the final mask
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    console.error("Could not get canvas context");
                    return;
                }

                // Create a new image to load the PNG data
                const img = new Image();
                img.onload = () => {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    // Get the final mask data URL
                    const finalMaskDataURL = canvas.toDataURL('image/png');

                    // Pass the final mask to the parent component
                    onConfirm(finalMaskDataURL);
                    onClose();
                };

                img.src = pngData;
                canvasRef.current.clearCanvas();
                setBackgroundImage(imageUrl)
            } catch (error) {
                console.error("Error creating mask:", error);
            }
        }

        exportMask();
    }, [backgroundImage])

    const handleConfirm = async () => {
        setBackgroundImage("0");
    };

    const toggleBrushType = () => {
        setIsEraser(!isEraser);
        if (canvasRef.current) {
            if (!isEraser) {
                canvasRef.current.eraseMode(true);
            } else {
                canvasRef.current.eraseMode(false);
            }
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="xl"
            title={<Text fz={20} fw="bold">{title}</Text>}
            centered
        >
            <Stack gap="md">
                <Alert
                    icon={<IconInfoCircle size={16} />}
                    title="Mask Information"
                    color="blue"
                >
                    Black areas will be preserved in the final image. White areas will be changed according to your prompt.
                </Alert>

                <Paper p="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>Brush Settings</Text>
                        <Tooltip label={isEraser ? "Switch to Brush" : "Switch to Eraser"}>
                            <ActionIcon
                                color={isEraser ? "red" : "blue"}
                                variant="light"
                                onClick={toggleBrushType}
                            >
                                {isEraser ? <IconEraser size={18} /> : <IconBrush size={18} />}
                            </ActionIcon>
                        </Tooltip>
                    </Group>

                    <Slider
                        label={`Size: ${brushSize}px`}
                        labelAlwaysOn
                        step={25}
                        min={1}
                        max={100}
                        marks={[
                            { value: 1 },
                            { value: 25 },
                            { value: 50 },
                            { value: 75 },
                            { value: 100 },
                        ]}
                        value={brushSize}
                        onChange={(value) => setBrushSize(value)}
                        mb="md"
                    />

                    <Group grow>
                        <Tooltip label="Clear Mask">
                            <Button
                                leftSection={<IconTrash size={16} />}
                                color="red"
                                variant="light"
                                onClick={handleClear}
                            >
                                Clear
                            </Button>
                        </Tooltip>
                        <Tooltip label="Invert Mask">
                            <Button
                                leftSection={<IconArrowsExchange size={16} />}
                                color="orange"
                                variant="light"
                                onClick={handleInvertMask}
                            >
                                Invert
                            </Button>
                        </Tooltip>
                    </Group>
                </Paper>

                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    overflow: 'auto',
                    position: 'relative',
                }}>
                    <ReactSketchCanvas
                        width={width + "px"}
                        height={height + "px"}
                        ref={canvasRef}
                        strokeWidth={brushSize}
                        eraserWidth={brushSize}
                        strokeColor="white"
                        canvasColor="black"
                        backgroundImage={backgroundImage}
                        exportWithBackgroundImage={false}
                        preserveBackgroundImageAspectRatio="xMidYMax"
                    />
                </div>

                <Divider my="sm" />

                <Group align="right">
                    <Button variant="default" onClick={onClose}>Cancel</Button>
                    <Button
                        leftSection={<IconCheck size={16} />}
                        color="green"
                        onClick={handleConfirm}
                    >
                        Apply Mask
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}