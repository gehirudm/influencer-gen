"use client";

import {
    Badge,
    Group,
    Text,
    TextInput,
    Title,
    Stack,
    Loader,
    Modal,
    Image,
    Box,
    Tooltip,
    ActionIcon,
    CopyButton,
    Pagination,
    Select,
    SimpleGrid,
    Card,
    Paper,
} from '@mantine/core';
import {
    IconCheck,
    IconCopy,
    IconSearch,
    IconExternalLink,
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { useDisclosure, useMediaQuery, useDebouncedValue } from '@mantine/hooks';
import { fetchAllImages } from '@/app/actions/admin/jobs';

interface ImageData {
    id: string;
    userId: string;
    publicUrl: string;
    privateUrl: string;
    thumbnailUrl: string | null;
    metadata: {
        prompt: string;
        neg_prompt: string;
        width: number;
        height: number;
    };
    contentModerationStatus: string | null;
    createdAt: string | null;
    jobId: string | null;
}

const PAGE_SIZE_OPTIONS = ['24', '48', '96'];

export default function AdminImagesPage() {
    const [images, setImages] = useState<ImageData[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(48);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebouncedValue(search, 400);
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    const [detailModalOpen, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const loadImages = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchAllImages({
                page,
                pageSize,
                search: debouncedSearch,
            });

            if (result.success) {
                setImages(result.images as ImageData[]);
                setTotal(result.total);
            } else {
                notifications.show({
                    title: 'Error',
                    message: result.error || 'Failed to load images',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedSearch]);

    useEffect(() => {
        loadImages();
    }, [loadImages]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, pageSize]);

    const handleViewDetails = (image: ImageData) => {
        setSelectedImage(image);
        openDetailModal();
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleString();
        } catch {
            return 'N/A';
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <Stack gap="lg" p="md">
            <Group justify="space-between" wrap="wrap">
                <Title order={isMobile ? 3 : 2}>Generated Images</Title>
                <Badge size="lg" color="blue" variant="light">
                    {total} images
                </Badge>
            </Group>

            {/* Search */}
            <TextInput
                placeholder="Search by User ID, Image ID, or prompt..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                style={{ maxWidth: 500 }}
            />

            {/* Grid */}
            {loading ? (
                <Stack align="center" justify="center" h="40vh">
                    <Loader size="lg" />
                    <Text c="dimmed">Loading images...</Text>
                </Stack>
            ) : images.length === 0 ? (
                <Paper p="xl" withBorder>
                    <Text ta="center" c="dimmed" py="xl">
                        No images found.
                    </Text>
                </Paper>
            ) : (
                <>
                    <SimpleGrid
                        cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }}
                        spacing="sm"
                    >
                        {images.map((image) => (
                            <Card
                                key={image.id}
                                p={0}
                                withBorder
                                style={{ cursor: 'pointer', overflow: 'hidden' }}
                                onClick={() => handleViewDetails(image)}
                            >
                                <Box style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                                    <Image
                                        src={image.thumbnailUrl || image.privateUrl || image.publicUrl}
                                        alt={image.metadata.prompt?.substring(0, 50) || 'Generated image'}
                                        fit="cover"
                                        h="100%"
                                        w="100%"
                                        style={{ position: 'absolute', top: 0, left: 0 }}
                                        fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%231a1a2e' width='200' height='200'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E"
                                    />
                                    {/* Thumbnail indicator */}
                                    {image.thumbnailUrl && (
                                        <Badge
                                            size="xs"
                                            color="green"
                                            variant="filled"
                                            style={{
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                                opacity: 0.8,
                                            }}
                                        >
                                            thumb
                                        </Badge>
                                    )}
                                    {/* Moderation badge */}
                                    {image.contentModerationStatus && image.contentModerationStatus !== 'approved' && (
                                        <Badge
                                            size="xs"
                                            color={image.contentModerationStatus === 'pending' ? 'yellow' : 'red'}
                                            variant="filled"
                                            style={{
                                                position: 'absolute',
                                                bottom: 4,
                                                left: 4,
                                                opacity: 0.9,
                                            }}
                                        >
                                            {image.contentModerationStatus}
                                        </Badge>
                                    )}
                                </Box>
                                <Box p={6}>
                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                        {image.metadata.prompt || 'No prompt'}
                                    </Text>
                                </Box>
                            </Card>
                        ))}
                    </SimpleGrid>

                    {/* Pagination Controls */}
                    <Group justify="space-between" align="center">
                        <Group gap="xs" align="center">
                            <Text size="sm" c="dimmed">Per page:</Text>
                            <Select
                                data={PAGE_SIZE_OPTIONS}
                                value={String(pageSize)}
                                onChange={(val) => setPageSize(Number(val) || 48)}
                                w={80}
                                size="xs"
                            />
                        </Group>
                        <Pagination
                            value={page}
                            onChange={setPage}
                            total={totalPages}
                            size="sm"
                        />
                        <Text size="sm" c="dimmed">
                            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                        </Text>
                    </Group>
                </>
            )}

            {/* Detail Modal */}
            <Modal
                opened={detailModalOpen}
                onClose={closeDetailModal}
                title="Image Details"
                size="lg"
                centered
                fullScreen={isMobile}
            >
                {selectedImage && (
                    <Stack gap="md">
                        {/* Full-size image */}
                        <Box style={{ borderRadius: 8, overflow: 'hidden' }}>
                            <Image
                                src={selectedImage.privateUrl || selectedImage.publicUrl}
                                alt={selectedImage.metadata.prompt || 'Generated image'}
                                fit="contain"
                                mah={500}
                                radius="sm"
                                style={{ cursor: 'pointer' }}
                                onClick={() => window.open(selectedImage.privateUrl || selectedImage.publicUrl, '_blank')}
                            />
                        </Box>

                        {/* Open full size */}
                        <Group justify="center">
                            <ActionIcon
                                variant="light"
                                color="blue"
                                size="lg"
                                onClick={() => window.open(selectedImage.privateUrl || selectedImage.publicUrl, '_blank')}
                            >
                                <IconExternalLink size={18} />
                            </ActionIcon>
                        </Group>

                        {/* Metadata */}
                        <SimpleGrid cols={2} spacing="xs">
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Image ID</Text>
                                <Group gap={4}>
                                    <Text size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                        {selectedImage.id}
                                    </Text>
                                    <CopyButton value={selectedImage.id}>
                                        {({ copied, copy }) => (
                                            <ActionIcon size="xs" variant="subtle" onClick={copy} color={copied ? 'green' : 'gray'}>
                                                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                            </ActionIcon>
                                        )}
                                    </CopyButton>
                                </Group>
                            </Box>
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>User ID</Text>
                                <Group gap={4}>
                                    <Text size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                        {selectedImage.userId}
                                    </Text>
                                    <CopyButton value={selectedImage.userId}>
                                        {({ copied, copy }) => (
                                            <ActionIcon size="xs" variant="subtle" onClick={copy} color={copied ? 'green' : 'gray'}>
                                                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                            </ActionIcon>
                                        )}
                                    </CopyButton>
                                </Group>
                            </Box>
                        </SimpleGrid>

                        <SimpleGrid cols={2} spacing="xs">
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Dimensions</Text>
                                <Text size="sm">{selectedImage.metadata.width}×{selectedImage.metadata.height}</Text>
                            </Box>
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Created</Text>
                                <Text size="sm">{formatDate(selectedImage.createdAt)}</Text>
                            </Box>
                        </SimpleGrid>

                        {selectedImage.contentModerationStatus && (
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Content Moderation</Text>
                                <Badge color={selectedImage.contentModerationStatus === 'approved' ? 'green' : selectedImage.contentModerationStatus === 'pending' ? 'yellow' : 'red'}>
                                    {selectedImage.contentModerationStatus}
                                </Badge>
                            </Box>
                        )}

                        {selectedImage.jobId && (
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Job ID</Text>
                                <Group gap={4}>
                                    <Text size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                        {selectedImage.jobId}
                                    </Text>
                                    <CopyButton value={selectedImage.jobId}>
                                        {({ copied, copy }) => (
                                            <ActionIcon size="xs" variant="subtle" onClick={copy} color={copied ? 'green' : 'gray'}>
                                                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                            </ActionIcon>
                                        )}
                                    </CopyButton>
                                </Group>
                            </Box>
                        )}

                        {/* Prompt */}
                        <Box>
                            <Text size="xs" c="dimmed" mb={2}>Prompt</Text>
                            <Paper p="sm" withBorder style={{ backgroundColor: '#1a1a2e' }}>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedImage.metadata.prompt || 'N/A'}
                                </Text>
                            </Paper>
                        </Box>

                        {selectedImage.metadata.neg_prompt && (
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Negative Prompt</Text>
                                <Paper p="sm" withBorder style={{ backgroundColor: '#1a1a2e' }}>
                                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                        {selectedImage.metadata.neg_prompt}
                                    </Text>
                                </Paper>
                            </Box>
                        )}

                        {/* Thumbnail URL info */}
                        {selectedImage.thumbnailUrl ? (
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Thumbnail</Text>
                                <Badge color="green" variant="light" size="sm">Available</Badge>
                            </Box>
                        ) : (
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Thumbnail</Text>
                                <Badge color="gray" variant="light" size="sm">Not yet generated</Badge>
                            </Box>
                        )}
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}
