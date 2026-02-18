"use client"

import { useState, useMemo } from 'react';
import {
    Container,
    Title,
    Text,
    SimpleGrid,
    Card,
    Group,
    Stack,
    Button,
    ActionIcon,
    Checkbox,
    Menu,
    Image,
    Badge,
    Box,
    Modal,
    Select,
    Loader,
    Center,
} from '@mantine/core';
import {
    IconPhoto,
    IconTrash,
    IconDownload,
    IconDots,
    IconSortAscending,
    IconSortDescending,
    IconFolderPlus,
    IconCheck,
    IconX,
} from '@tabler/icons-react';
import { useUserJobs } from '@/hooks/useUserJobs';
import { notifications } from '@mantine/notifications';

type SortOption = 'newest' | 'oldest';

export default function AssetsPage() {
    const { jobs, loading, error } = useUserJobs();
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOption>('newest');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<string | null>(null);

    // Filter completed jobs with images
    const completedJobs = useMemo(() => {
        const filtered = jobs.filter(
            job => job.status === 'completed' && job.imageUrls && job.imageUrls.length > 0
        );
        
        // Sort based on sortOrder
        return filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [jobs, sortOrder]);

    // Flatten jobs to individual images
    const allImages = useMemo(() => {
        return completedJobs.flatMap(job => 
            job.imageUrls.map((url, idx) => ({
                id: `${job.id}-${idx}`,
                jobId: job.id,
                url: url.privateUrl,
                prompt: job.metadata?.prompt || 'No prompt',
                createdAt: job.createdAt,
            }))
        );
    }, [completedJobs]);

    const handleSelectAll = () => {
        if (selectedImages.size === allImages.length) {
            setSelectedImages(new Set());
        } else {
            setSelectedImages(new Set(allImages.map(img => img.id)));
        }
    };

    const handleSelectImage = (imageId: string) => {
        const newSelected = new Set(selectedImages);
        if (newSelected.has(imageId)) {
            newSelected.delete(imageId);
        } else {
            newSelected.add(imageId);
        }
        setSelectedImages(newSelected);
    };

    const handleDeleteSelected = () => {
        if (selectedImages.size === 0) return;
        
        notifications.show({
            title: 'Deleting images',
            message: `Deleting ${selectedImages.size} image(s)...`,
            color: 'blue',
        });
        
        // TODO: Implement actual delete logic
        setTimeout(() => {
            setSelectedImages(new Set());
            setIsSelecting(false);
            notifications.show({
                title: 'Success',
                message: 'Images deleted successfully',
                color: 'green',
            });
        }, 1000);
    };

    const handleDownloadSelected = () => {
        if (selectedImages.size === 0) return;
        
        notifications.show({
            title: 'Downloading',
            message: `Downloading ${selectedImages.size} image(s)...`,
            color: 'blue',
        });
        
        // TODO: Implement actual download logic
    };

    const handleAddToCollection = () => {
        if (selectedImages.size === 0) return;
        
        notifications.show({
            title: 'Coming Soon',
            message: 'Add to collection feature is coming soon!',
            color: 'blue',
        });
    };

    const toggleSort = () => {
        setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
    };

    if (loading) {
        return (
            <Center style={{ height: '100vh' }}>
                <Stack align="center" gap="md">
                    <Loader size="xl" color="blue" />
                    <Text c="dimmed">Loading your assets...</Text>
                </Stack>
            </Center>
        );
    }

    if (error) {
        return (
            <Box style={{ padding: '0.75rem' }}>
                <Text c="red">Error loading assets: {error}</Text>
            </Box>
        );
    }

    return (
        <Box style={{ padding: '0.75rem', height: '100%' }}>
            <Stack gap="md">
                {/* Header */}
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title size={36} c="white" mb="xs">
                            My Assets
                        </Title>
                        <Text c="dimmed">
                            {allImages.length} image{allImages.length !== 1 ? 's' : ''} generated
                        </Text>
                    </div>
                </Group>

                {/* Toolbar */}
                <Card p="md" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                    <Group justify="space-between">
                        <Group gap="sm">
                            {!isSelecting ? (
                                <Button
                                    variant="light"
                                    leftSection={<IconCheck size={16} />}
                                    onClick={() => setIsSelecting(true)}
                                    disabled={allImages.length === 0}
                                >
                                    Select
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="light"
                                        color="red"
                                        leftSection={<IconX size={16} />}
                                        onClick={() => {
                                            setIsSelecting(false);
                                            setSelectedImages(new Set());
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="subtle"
                                        onClick={handleSelectAll}
                                    >
                                        {selectedImages.size === allImages.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                    {selectedImages.size > 0 && (
                                        <Badge size="lg" variant="filled">
                                            {selectedImages.size} selected
                                        </Badge>
                                    )}
                                </>
                            )}
                        </Group>

                        <Group gap="sm">
                            {isSelecting && selectedImages.size > 0 && (
                                <>
                                    <Button
                                        variant="light"
                                        color="blue"
                                        leftSection={<IconFolderPlus size={16} />}
                                        onClick={handleAddToCollection}
                                    >
                                        Add to Collection
                                    </Button>
                                    <Button
                                        variant="light"
                                        color="blue"
                                        leftSection={<IconDownload size={16} />}
                                        onClick={handleDownloadSelected}
                                    >
                                        Download
                                    </Button>
                                    <Button
                                        variant="light"
                                        color="red"
                                        leftSection={<IconTrash size={16} />}
                                        onClick={handleDeleteSelected}
                                    >
                                        Delete
                                    </Button>
                                </>
                            )}
                            
                            <Button
                                variant="light"
                                leftSection={sortOrder === 'newest' ? <IconSortDescending size={16} /> : <IconSortAscending size={16} />}
                                onClick={toggleSort}
                            >
                                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                            </Button>
                        </Group>
                    </Group>
                </Card>

                {/* Images Grid */}
                {allImages.length === 0 ? (
                    <Card p="xl" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                        <Stack align="center" gap="md" py="xl">
                            <IconPhoto size={64} color="#666" />
                            <Text c="dimmed" size="lg">No images yet</Text>
                            <Text c="dimmed" size="sm">
                                Images you generate from Create and Undress pages will appear here
                            </Text>
                        </Stack>
                    </Card>
                ) : (
                    <SimpleGrid
                        cols={{ base: 2, sm: 3, md: 4, lg: 5 }}
                        spacing="md"
                    >
                        {allImages.map((image) => (
                            <Card
                                key={image.id}
                                p={0}
                                style={{
                                    backgroundColor: '#2a2a2a',
                                    border: selectedImages.has(image.id) ? '3px solid #4a7aba' : '1px solid #333',
                                    cursor: isSelecting ? 'pointer' : 'default',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                onClick={() => isSelecting && handleSelectImage(image.id)}
                            >
                                {/* Selection Checkbox */}
                                {isSelecting && (
                                    <Box
                                        style={{
                                            position: 'absolute',
                                            top: 8,
                                            left: 8,
                                            zIndex: 10,
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedImages.has(image.id)}
                                            onChange={() => handleSelectImage(image.id)}
                                            size="md"
                                            styles={{
                                                input: {
                                                    cursor: 'pointer',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                    borderColor: '#fff',
                                                }
                                            }}
                                        />
                                    </Box>
                                )}

                                {/* Image */}
                                <Box
                                    style={{
                                        width: '100%',
                                        aspectRatio: '3/4',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Image
                                        src={image.url}
                                        alt={image.prompt}
                                        fit="cover"
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </Box>

                                {/* Info */}
                                {!isSelecting && (
                                    <Box p="xs">
                                        <Text size="xs" c="dimmed" lineClamp={2}>
                                            {image.prompt}
                                        </Text>
                                        <Text size="xs" c="dimmed" mt={4}>
                                            {new Date(image.createdAt).toLocaleDateString()}
                                        </Text>
                                    </Box>
                                )}
                            </Card>
                        ))}
                    </SimpleGrid>
                )}
            </Stack>
        </Box>
    );
}
