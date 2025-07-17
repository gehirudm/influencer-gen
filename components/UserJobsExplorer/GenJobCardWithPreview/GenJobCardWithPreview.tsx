import { useState } from 'react';
import { Card, Image, Group, ActionIcon, Modal, Stack, Switch, Button, Skeleton, Anchor, Text, Tooltip } from '@mantine/core';
import { IconPlus, IconDownload, IconTrash, IconChevronLeft, IconChevronRight, IconX, IconFolderPlus, IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import classes from './GenJobCardWithPreview.module.css';
import ShinyText from '@/components/blocks/TextAnimations/ShinyText/ShinyText';
import { AddToProjectModal } from '../AddToProjectModal/AddToProjectModal';

interface GenJobCardWithPreviewProps {
    isGenerating: boolean;
    imageUrls?: string[];
    imageIds?: string[];
    thumbnailIndex?: number;
    onDownload?: (imageUrl: string) => void;
    onDelete?: () => void;
    onAddToProject?: () => void;
    onInpaint?: (imageUrl: string) => void;
    onImg2Img?: (imageUrl: string) => void;
    onSaveChar?: (imageUrl: string) => void;
    onRemake?: (imageUrl: string) => void;
    isFailed?: boolean;
    errorMessage?: string;
    onRetry?: () => void;
}

export function GenJobCardWithPreview({
    isGenerating,
    imageUrls,
    imageIds,
    thumbnailIndex = 0,
    onDownload,
    onDelete,
    onAddToProject,
    onInpaint,
    onImg2Img,
    onSaveChar,
    onRemake,
    isFailed = false,
    errorMessage,
    onRetry
}: GenJobCardWithPreviewProps) {
    console.log(imageIds)
    const [previewOpen, setPreviewOpen] = useState(false);
    const [withSeed, setWithSeed] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(thumbnailIndex);
    const [addToProjectModalOpen, setAddToProjectModalOpen] = useState(false);
    const [showErrorDetails, setShowErrorDetails] = useState(false);

    // Check if we're in loading state
    const isLoading = !imageUrls || imageUrls.length == 0 && !isGenerating && !isFailed;

    // Use empty array for loading state or empty imageUrls
    const images = imageUrls || [];

    // Get the current image URL if available
    const currentImageUrl = images.length > 0 ? images[currentImageIndex] : '';
    const currentImageId = images.length > 0 ? (imageIds || [])[currentImageIndex] : '';

    // Handle navigation between images
    const goToNextImage = () => {
        if (isLoading || images.length <= 1) return;

        setCurrentImageIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToPreviousImage = () => {
        if (isLoading || images.length <= 1) return;

        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    // Reset to thumbnail index when opening preview
    const handleOpenPreview = () => {
        if (isLoading || isFailed) return;

        setCurrentImageIndex(thumbnailIndex);
        setPreviewOpen(true);
    };

    return (
        <>
            <Card radius="md" p={0} className={classes.card}>
                <Card.Section
                    className={classes.imageSection}
                    onClick={(isLoading || isGenerating || isFailed) ? undefined : handleOpenPreview}
                    style={{ cursor: (isLoading || isFailed) ? 'default' : 'pointer' }}
                >
                    {isGenerating ? (
                        <div className={classes.generatingContainer}>
                            <div className={classes.generatingOverlay}>
                                <ShinyText
                                    text="Generating..."
                                    speed={3}
                                    className={classes.generatingText}
                                />
                            </div>
                        </div>
                    ) : isFailed ? (
                        <div className={classes.failedContainer}>
                            <div className={classes.failedOverlay}>
                                <IconAlertTriangle size={40} color="var(--mantine-color-red-6)" />
                                <Text size="md" fw={600} c="red.6" mt={10}>Generation Failed</Text>
                                <Button 
                                    variant="light" 
                                    color="red" 
                                    size="xs" 
                                    mt={10}
                                    leftSection={<IconRefresh size={14} />}
                                    onClick={onRetry}
                                >
                                    Retry
                                </Button>
                                {errorMessage && (
                                    <Button 
                                        variant="subtle" 
                                        color="gray" 
                                        size="xs" 
                                        mt={5}
                                        onClick={() => setShowErrorDetails(true)}
                                    >
                                        View Error Details
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : isLoading ? (
                        <Skeleton height="250" width="200" animate={true} />
                    ) : (
                        <Image
                            src={images[thumbnailIndex] || 'https://placehold.co/600x400?text=No+Image+Available'}
                            alt="Generated image"
                            className={classes.image}
                        />
                    )}
                </Card.Section>

                <Group className={classes.controls} justify="space-between">
                    <Group gap={10}>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="lg"
                            radius="md"
                            onClick={() => setAddToProjectModalOpen(true)}
                            disabled={isLoading || isGenerating || isFailed}
                            style={{ opacity: (isLoading || isFailed) ? 0.5 : 1 }}
                        >
                            <IconFolderPlus size={20} />
                        </ActionIcon>

                        {!(isLoading || isGenerating || isFailed) && images.length > 0 && (
                            <Anchor href={images[thumbnailIndex]} download={images[thumbnailIndex].split("/").pop() || "image.png"} target="_blank">
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="lg"
                                    radius="md"
                                >
                                    <IconDownload size={20} />
                                </ActionIcon>
                            </Anchor>
                        )}
                        
                        {isFailed && (
                            <Tooltip label="Retry generation">
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    radius="md"
                                    onClick={onRetry}
                                >
                                    <IconRefresh size={20} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>

                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="lg"
                        radius="md"
                        onClick={isLoading ? undefined : onDelete}
                        disabled={isLoading}
                        style={{ opacity: isLoading ? 0.5 : 1 }}
                    >
                        <IconTrash size={20} />
                    </ActionIcon>
                </Group>
            </Card>

            <Modal
                opened={previewOpen && !isLoading && !isFailed}
                onClose={() => setPreviewOpen(false)}
                size="xl"
                padding={0}
                withCloseButton={false}
                classNames={{
                    content: classes.modalContent,
                    body: classes.modalBody,
                    inner: classes.modalInner
                }}
                centered
            >
                <div className={classes.previewContainer}>
                    <div className={classes.imagePreview}>
                        {images.length > 1 && (
                            <ActionIcon
                                className={classes.navButton}
                                variant="transparent"
                                color="white"
                                size="lg"
                                style={{ left: 10 }}
                                onClick={goToPreviousImage}
                            >
                                <IconChevronLeft size={30} />
                            </ActionIcon>
                        )}

                        <Image
                            src={currentImageUrl || 'https://placehold.co/600x400?text=No+Image+Available'}
                            alt="Generated image preview"
                            className={classes.previewImage}
                        />

                        {images.length > 1 && (
                            <ActionIcon
                                className={classes.navButton}
                                variant="transparent"
                                color="white"
                                size="lg"
                                style={{ right: 10 }}
                                onClick={goToNextImage}
                            >
                                <IconChevronRight size={30} />
                            </ActionIcon>
                        )}

                        {images.length > 1 && (
                            <div className={classes.pagination}>
                                {currentImageIndex + 1} / {images.length}
                            </div>
                        )}
                    </div>

                    <Stack className={classes.previewControls}>
                        <Group justify="center" gap="md">
                            <Button
                                variant="light"
                                color="indigo"
                                radius="xl"
                                className={classes.actionButton}
                                onClick={() => {
                                    // Pass the current image URL to the callback
                                    onInpaint?.(currentImageUrl);
                                    setPreviewOpen(false);
                                }}
                            >
                                Params
                            </Button>

                            <Button
                                variant="light"
                                color="indigo"
                                radius="xl"
                                className={classes.actionButton}
                                onClick={() => {
                                    onInpaint?.(currentImageUrl);
                                    setPreviewOpen(false);
                                }}
                            >
                                Inpaint
                            </Button>

                            <Button
                                variant="light"
                                color="indigo"
                                radius="xl"
                                className={classes.actionButton}
                                onClick={() => {
                                    onImg2Img?.(currentImageUrl);
                                    setPreviewOpen(false);
                                }}
                            >
                                Img2Img
                            </Button>

                            <Button
                                variant="light"
                                color="indigo"
                                radius="xl"
                                className={classes.actionButton}
                                onClick={() => {
                                    onSaveChar?.(currentImageUrl);
                                    setPreviewOpen(false);
                                }}
                            >
                                save Char
                            </Button>

                            <Button
                                variant="light"
                                color="indigo"
                                radius="xl"
                                className={classes.actionButton}
                                onClick={() => {
                                    onRemake?.(currentImageUrl);
                                    setPreviewOpen(false);
                                }}
                            >
                                ReMake
                            </Button>
                        </Group>

                        <Group justify="space-between" align="center" className={classes.seedControl}>
                            <Switch
                                checked={withSeed}
                                onChange={(event) => setWithSeed(event.currentTarget.checked)}
                                label="with seed"
                                labelPosition="right"
                                color="indigo"
                                classNames={{
                                    root: classes.switchRoot,
                                    track: classes.switchTrack,
                                    thumb: classes.switchThumb,
                                    label: classes.switchLabel
                                }}
                            />

                            <ActionIcon
                                variant="filled"
                                color="blue"
                                size="lg"
                                radius="md"
                                className={classes.closeButton}
                                onClick={() => setPreviewOpen(false)}
                            >
                                <IconX size={20} />
                            </ActionIcon>
                        </Group>
                    </Stack>
                </div>
            </Modal>

            <AddToProjectModal
                opened={addToProjectModalOpen}
                onClose={() => setAddToProjectModalOpen(false)}
                imageUrl={currentImageUrl}
                imageId={currentImageId}
            />

            {/* Error details modal */}
            <Modal
                opened={showErrorDetails}
                onClose={() => setShowErrorDetails(false)}
                title="Generation Error Details"
                size="lg"
            >
                <Text size="sm" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {errorMessage || "No detailed error information available."}
                </Text>
                <Button 
                    fullWidth 
                    mt="md" 
                    variant="light" 
                    color="red" 
                    leftSection={<IconRefresh size={16} />}
                    onClick={() => {
                        onRetry?.();
                        setShowErrorDetails(false);
                    }}
                >
                    Retry Generation
                </Button>
            </Modal>
        </>
    );
}