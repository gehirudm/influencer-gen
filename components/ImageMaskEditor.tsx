import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Button, ColorInput, Group, Slider, Stack, Text } from "@mantine/core";

interface ImageMaskEditorProps {
    imageUrl: string;
    width: number;
    height: number;
    onConfirm: (imageData: string) => void;
}

export default function ImageMaskEditor({ imageUrl, width = 512, height = 512, onConfirm }: ImageMaskEditorProps) {
    const canvasRef = useRef(null);
    const fabricCanvas = useRef<fabric.Canvas>(null);

    const [brushColor, setBrushColor] = useState("#ffffff"); // white for mask
    const [brushSize, setBrushSize] = useState(20);

    useEffect(() => {
        const initializeCanvas = async () => {
            if (!canvasRef.current) return;
            if (fabricCanvas.current !== null)
                await fabricCanvas.current.dispose();

            fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
                isDrawingMode: true,
                width,
                height
            });

            const img = await fabric.FabricImage.fromURL(imageUrl);
            img.set({
                selectable: false,
                evented: false,
                scaleX: width / img.width,
                scaleY: height / img.height,
            });

            const brush = new fabric.PencilBrush(fabricCanvas.current);
            brush.width = brushSize;
            // brush.color = brushColor;
            brush.color = "rgba(255, 255, 255, 0.5)";

            fabricCanvas.current.set({
                backgroundImage: img,
                freeDrawingBrush: brush
            });

            fabricCanvas.current.renderAll();

            // fabricCanvas.current.backgroundImage = img;
            // fabricCanvas.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas.current);

            // Set default brush
            // fabricCanvas.current.freeDrawingBrush.color = brushColor;
            // fabricCanvas.current.freeDrawingBrush.width = brushSize;
        }

        initializeCanvas();

        // Cleanup
        return () => {
            if (fabricCanvas.current)
                fabricCanvas.current.dispose();
        };
    }, [imageUrl, width, height]);

    // Update brush when props change
    useEffect(() => {
        if (fabricCanvas.current && fabricCanvas.current.freeDrawingBrush) {
            fabricCanvas.current.freeDrawingBrush.color = brushColor;
            fabricCanvas.current.freeDrawingBrush.width = brushSize;
        }
    }, [brushColor, brushSize]);

    const handleClear = () => {
        if (!fabricCanvas.current) return;

        fabricCanvas.current.getObjects().forEach((obj) => {
            if (obj !== fabricCanvas.current?.backgroundImage) {
                fabricCanvas.current?.remove(obj);
            }
        });
        fabricCanvas.current.renderAll();
    };

    const handleInvertMask = () => {
        if (!fabricCanvas.current) return;

        const ctx = fabricCanvas.current.getContext();
        const imageData = ctx.getImageData(0, 0, fabricCanvas.current.width, fabricCanvas.current.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Invert only the white areas
            if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
                data[i] = 0;     // Red
                data[i + 1] = 0; // Green
                data[i + 2] = 0; // Blue
            }
        }

        ctx.putImageData(imageData, 0, 0);
        fabricCanvas.current.renderAll();
    };

    const handleConfirm = () => {
        if (!fabricCanvas.current) return;
        // Temporarily remove background to extract mask only
        const bg = fabricCanvas.current.backgroundImage;
        fabricCanvas.current.backgroundImage = undefined;

        const maskDataURL = fabricCanvas.current.toDataURL({
            format: "png",
            quality: 1.0,
            multiplier: 1
        });
        // Restore background and notify parent
        fabricCanvas.current.backgroundImage = bg;
        onConfirm(maskDataURL);
    };

    return (
        <div>
            <Stack>
                {/* <ColorInput
                    placeholder="Brush Color"
                    label="Brush Color"
                    disallowInput
                    withPicker={false}
                    value={brushColor}
                    onChange={(e) => setBrushColor(e)}
                    swatches={["#ffffff", "#000000"]}
                /> */}
                <Text>Brush Size</Text>
                <Slider
                    title="Brush Size"
                    step={1}
                    min={1}
                    max={100}
                    value={brushSize}
                    onChange={(e) => setBrushSize(e)}
                />
                <Group gap={8}>
                    <Button onClick={handleClear}>Clear</Button>
                    <Button onClick={handleInvertMask}>Invert Mask</Button>
                    <Button onClick={handleConfirm}>Confirm</Button>
                </Group>
            </Stack>
            <canvas ref={canvasRef} width={width} height={height} style={{ border: "1px solid #ccc" }} />
        </div>
    );
}
