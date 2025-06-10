import { useState } from 'react';
import { Card, Image, Group, ActionIcon, Modal, Stack, Switch, Button, Skeleton } from '@mantine/core';
import { IconPlus, IconDownload, IconTrash, IconChevronLeft, IconChevronRight, IconX, IconFolderPlus } from '@tabler/icons-react';
import classes from './GenJobCardWithPreview.module.css';

interface GenJobCardWithPreviewProps {
    imageUrls?: string[];
    thumbnailIndex?: number;
    onDownload?: (imageUrl: string) => void;
    onDelete?: () => void;
    onAddToProject?: () => void;
    onInpaint?: (imageUrl: string) => void;
    onImg2Img?: (imageUrl: string) => void;
    onSaveChar?: (imageUrl: string) => void;
    onRemake?: (imageUrl: string) => void;
}

export function GenJobCardWithPreview({
    imageUrls,
    thumbnailIndex = 0,
    onDownload,
    onDelete,
    onAddToProject,
    onInpaint,
    onImg2Img,
    onSaveChar,
    onRemake
}: GenJobCardWithPreviewProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [withSeed, setWithSeed] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(thumbnailIndex);

    // Check if we're in loading state
    const isLoading = !imageUrls || imageUrls.length == 0;
    
    // Use empty array for loading state or empty imageUrls
    const images = imageUrls || [];
    
    // Get the current image URL if available
    const currentImageUrl = images.length > 0 ? images[currentImageIndex] : '';

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
        if (isLoading) return;
        
        setCurrentImageIndex(thumbnailIndex);
        setPreviewOpen(true);
    };

    return (
        <>
            <Card radius="md" p={0} className={classes.card}>
                <Card.Section 
                    className={classes.imageSection} 
                    onClick={isLoading ? undefined : handleOpenPreview}
                    style={{ cursor: isLoading ? 'default' : 'pointer' }}
                >
                    {isLoading ? (
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
                            onClick={isLoading ? undefined : onAddToProject}
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.5 : 1 }}
                        >
                            <IconFolderPlus size={20} />
                        </ActionIcon>

                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="lg"
                            radius="md"
                            onClick={isLoading ? undefined : () => onDownload?.(images[thumbnailIndex])}
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.5 : 1 }}
                        >
                            <IconDownload size={20} />
                        </ActionIcon>
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
                opened={previewOpen && !isLoading}
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

                        <div className={classes.watermark}>GenInfluence.ai</div>

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
        </>
    );
}