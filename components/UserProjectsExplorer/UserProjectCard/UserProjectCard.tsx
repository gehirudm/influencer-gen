import { useState } from 'react';
import { Card, Image, Group, ActionIcon, Modal, Stack, Switch, Button, Skeleton, Anchor, Text, Center } from '@mantine/core';
import { IconPlus, IconDownload, IconTrash, IconChevronLeft, IconChevronRight, IconX, IconFolderPlus, IconPhoto } from '@tabler/icons-react';
import classes from './UserProjectCard.module.css';
import ShinyText from '@/components/blocks/TextAnimations/ShinyText/ShinyText';

interface UserProjectCardProps {
    projectName: string;
    projectDescription?: string;
    imageCount: number;
    imageUrls?: string[];
    thumbnailIndex?: number;
    onDownload?: (imageUrl: string) => void;
    onDelete?: () => void;
    onAddToProject?: () => void;
    onInpaint?: (imageUrl: string) => void;
    onImg2Img?: (imageUrl: string) => void;
    onSaveChar?: (imageUrl: string) => void;
    onRemake?: (imageUrl: string) => void;
    onEdit?: () => void;
}

export function UserProjectCard({
    projectName,
    projectDescription,
    imageCount,
    imageUrls,
    thumbnailIndex = 0,
    onDelete,
    onInpaint,
    onImg2Img,
    onSaveChar,
    onRemake,
    onEdit
}: UserProjectCardProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [withSeed, setWithSeed] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(thumbnailIndex);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Check if we're in loading state
    const isLoading = !imageUrls;
    const hasNoImages = imageUrls && imageUrls.length === 0;

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
        if (isLoading || hasNoImages) return;

        setCurrentImageIndex(thumbnailIndex);
        setPreviewOpen(true);
    };

    return (
        <>
            <Card radius="md" p="md" className={classes.card}>
                <Card.Section
                    className={classes.imageSection}
                    onClick={(isLoading || hasNoImages) ? undefined : handleOpenPreview}
                    style={{ cursor: (isLoading || hasNoImages) ? 'default' : 'pointer' }}
                >
                    {isLoading ? (
                        <Skeleton height={200} width="100%" animate={true} />
                    ) : hasNoImages ? (
                        <Center style={{ height: 200 }}>
                            <Stack align="center" gap="xs">
                                <IconPhoto size={48} opacity={0.3} />
                                <Text c="dimmed" size="sm" ta="center">No images yet</Text>
                            </Stack>
                        </Center>
                    ) : (
                        <Image
                            src={images[thumbnailIndex] || 'https://placehold.co/600x400?text=No+Image+Available'}
                            alt={`${projectName} thumbnail`}
                            height={200}
                            className={classes.image}
                        />
                    )}
                </Card.Section>

                <Stack gap="xs" mt="md">
                    <Text fw={500} size="lg" lineClamp={1}>{projectName}</Text>
                    {projectDescription && (
                        <Text size="sm" c="dimmed" lineClamp={2}>
                            {projectDescription}
                        </Text>
                    )}
                </Stack>

                <Group className={classes.controls} justify="space-between" mt="auto">
                    <Text size="sm" c="dimmed">
                        {imageCount} {imageCount === 1 ? 'image' : 'images'}
                    </Text>

                    <Group gap={10}>
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            size="md"
                            radius="md"
                            onClick={() => setDeleteModalOpen(true)}
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.5 : 1 }}
                        >
                            <IconTrash size={18} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Card>

            <Modal
                opened={previewOpen && !isLoading && !hasNoImages}
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
                title={projectName}
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
                            alt={`${projectName} image preview`}
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
                                Save Char
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

                            <Group>
                                {!(isLoading || hasNoImages) && (
                                    <Anchor href={currentImageUrl} download={currentImageUrl.split("/").pop() || "image.png"} target="_blank">
                                        <ActionIcon
                                            variant="subtle"
                                            color="blue"
                                            size="lg"
                                            radius="md"
                                        >
                                            <IconDownload size={20} />
                                        </ActionIcon>
                                    </Anchor>
                                )}

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
                        </Group>
                    </Stack>
                </div>
            </Modal>

            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={<Text fw={600}>Delete Project</Text>}
                centered
                size="md"
            >
                <Stack>
                    <Text>
                        Are you sure you want to delete <strong>{projectName}</strong>?
                        {imageCount > 0 && (
                            <Text span fw={500} c="red">
                                {' '}This project contains {imageCount} {imageCount === 1 ? 'image' : 'images'}.
                            </Text>
                        )}
                    </Text>
                    <Text size="sm" c="dimmed">
                        This action cannot be undone.
                    </Text>

                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            onClick={() => {
                                onDelete?.();
                                setDeleteModalOpen(false);
                            }}
                        >
                            Delete Project
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}