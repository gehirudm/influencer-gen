"use client";

import {
    Badge,
    Button,
    Group,
    Paper,
    Table,
    Text,
    TextInput,
    Title,
    Stack,
    Loader,
    Modal,
    Image,
    Box,
    Tabs,
    Tooltip,
    ActionIcon,
    CopyButton,
    Pagination,
    Select,
    SimpleGrid,
    Card,
    Alert,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconCheck,
    IconX,
    IconClock,
    IconPhoto,
    IconCopy,
    IconEye,
    IconSearch,
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { useDisclosure, useMediaQuery, useDebouncedValue } from '@mantine/hooks';
import { fetchAllJobs } from '@/app/actions/admin/jobs';

interface JobMetadata {
    prompt: string;
    neg_prompt: string;
    width: number;
    height: number;
    cfg: number;
    seed: string;
    base_img: boolean;
    generation_type: string;
}

interface ImageURL {
    publicUrl: string;
    privateUrl: string;
}

interface Job {
    id: string;
    userId: string;
    status: string;
    metadata: JobMetadata;
    createdAt: string | null;
    imageUrls: ImageURL[];
    executionTime: number | null;
    error: string | null;
    errorDetails: { message: string; code?: string; timestamp?: string } | null;
    contentModerationStatus: string | null;
}

const PAGE_SIZE_OPTIONS = ['10', '25', '50'];

export default function GenerationRequestsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [activeTab, setActiveTab] = useState<string | null>('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebouncedValue(search, 400);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [detailModalOpen, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const loadJobs = useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchAllJobs({
                page,
                pageSize,
                status: activeTab || 'all',
                search: debouncedSearch,
            });

            if (result.success) {
                setJobs(result.jobs as Job[]);
                setTotal(result.total);
            } else {
                notifications.show({
                    title: 'Error',
                    message: result.error || 'Failed to load generation requests',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, activeTab, debouncedSearch]);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [activeTab, debouncedSearch, pageSize]);

    const handleViewDetails = (job: Job) => {
        setSelectedJob(job);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'IN_QUEUE':
                return <Badge color="yellow" leftSection={<IconClock size={12} />}>In Queue</Badge>;
            case 'IN_PROGRESS':
                return <Badge color="blue" leftSection={<IconClock size={12} />}>In Progress</Badge>;
            case 'COMPLETED':
                return <Badge color="green" leftSection={<IconCheck size={12} />}>Completed</Badge>;
            case 'FAILED':
                return <Badge color="red" leftSection={<IconX size={12} />}>Failed</Badge>;
            case 'CANCELLED':
                return <Badge color="orange" leftSection={<IconX size={12} />}>Cancelled</Badge>;
            default:
                return <Badge color="gray">{status}</Badge>;
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <Stack gap="lg" p="md">
            <Group justify="space-between" wrap="wrap">
                <Title order={isMobile ? 3 : 2}>Image Generation Requests</Title>
                <Badge size="lg" color="blue" variant="light">
                    {total} total
                </Badge>
            </Group>

            {/* Search */}
            <TextInput
                placeholder="Search by Job ID, User ID, or prompt..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                style={{ maxWidth: 500 }}
            />

            {/* Status Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">All</Tabs.Tab>
                    <Tabs.Tab value="IN_QUEUE" leftSection={<IconClock size={14} />}>Queue</Tabs.Tab>
                    <Tabs.Tab value="IN_PROGRESS" leftSection={<IconClock size={14} />}>In Progress</Tabs.Tab>
                    <Tabs.Tab value="COMPLETED" leftSection={<IconCheck size={14} />}>Completed</Tabs.Tab>
                    <Tabs.Tab value="FAILED" leftSection={<IconX size={14} />}>Failed</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Table */}
            {loading ? (
                <Stack align="center" justify="center" h="40vh">
                    <Loader size="lg" />
                    <Text c="dimmed">Loading generation requests...</Text>
                </Stack>
            ) : jobs.length === 0 ? (
                <Paper p="xl" withBorder>
                    <Text ta="center" c="dimmed" py="xl">
                        No generation requests found.
                    </Text>
                </Paper>
            ) : (
                <>
                    <Paper withBorder>
                        <Table.ScrollContainer minWidth={800}>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Job ID</Table.Th>
                                        <Table.Th>User ID</Table.Th>
                                        <Table.Th>Prompt</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Dimensions</Table.Th>
                                        <Table.Th>Created</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {jobs.map((job) => (
                                        <Table.Tr key={job.id}>
                                            <Table.Td>
                                                <Group gap={4}>
                                                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                                                        {job.id.substring(0, 12)}...
                                                    </Text>
                                                    <CopyButton value={job.id}>
                                                        {({ copied, copy }) => (
                                                            <Tooltip label={copied ? 'Copied!' : 'Copy Job ID'} withArrow>
                                                                <ActionIcon size="xs" variant="subtle" onClick={copy}>
                                                                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </CopyButton>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4}>
                                                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                                                        {job.userId.substring(0, 12)}...
                                                    </Text>
                                                    <CopyButton value={job.userId}>
                                                        {({ copied, copy }) => (
                                                            <Tooltip label={copied ? 'Copied!' : 'Copy User ID'} withArrow>
                                                                <ActionIcon size="xs" variant="subtle" onClick={copy}>
                                                                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </CopyButton>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td style={{ maxWidth: 250 }}>
                                                <Text size="xs" c="dimmed" lineClamp={2}>
                                                    {job.metadata.prompt || 'No prompt'}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>{getStatusBadge(job.status)}</Table.Td>
                                            <Table.Td>
                                                <Text size="xs" c="dimmed">
                                                    {job.metadata.width}×{job.metadata.height}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs" c="dimmed">{formatDate(job.createdAt)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Tooltip label="View Details" withArrow>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="blue"
                                                        onClick={() => handleViewDetails(job)}
                                                    >
                                                        <IconEye size={18} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Paper>

                    {/* Pagination Controls */}
                    <Group justify="space-between" align="center">
                        <Group gap="xs" align="center">
                            <Text size="sm" c="dimmed">Rows per page:</Text>
                            <Select
                                data={PAGE_SIZE_OPTIONS}
                                value={String(pageSize)}
                                onChange={(val) => setPageSize(Number(val) || 25)}
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
                title={`Job: ${selectedJob?.id}`}
                size="lg"
                centered
                fullScreen={isMobile}
            >
                {selectedJob && (
                    <Stack gap="md">
                        {/* Status & Meta Row */}
                        <Group gap="md" wrap="wrap">
                            <div>
                                <Text size="xs" c="dimmed" mb={2}>Status</Text>
                                {getStatusBadge(selectedJob.status)}
                            </div>
                            {selectedJob.executionTime && (
                                <div>
                                    <Text size="xs" c="dimmed" mb={2}>Execution Time</Text>
                                    <Text size="sm">{(selectedJob.executionTime / 1000).toFixed(2)}s</Text>
                                </div>
                            )}
                            <div>
                                <Text size="xs" c="dimmed" mb={2}>Dimensions</Text>
                                <Text size="sm">{selectedJob.metadata.width}×{selectedJob.metadata.height}</Text>
                            </div>
                            {selectedJob.metadata.cfg > 0 && (
                                <div>
                                    <Text size="xs" c="dimmed" mb={2}>CFG</Text>
                                    <Text size="sm">{selectedJob.metadata.cfg}</Text>
                                </div>
                            )}
                            {selectedJob.metadata.seed && (
                                <div>
                                    <Text size="xs" c="dimmed" mb={2}>Seed</Text>
                                    <Text size="sm" style={{ fontFamily: 'monospace' }}>{selectedJob.metadata.seed}</Text>
                                </div>
                            )}
                            {selectedJob.metadata.generation_type && (
                                <div>
                                    <Text size="xs" c="dimmed" mb={2}>Type</Text>
                                    <Badge variant="outline">{selectedJob.metadata.generation_type}</Badge>
                                </div>
                            )}
                            {selectedJob.contentModerationStatus && (
                                <div>
                                    <Text size="xs" c="dimmed" mb={2}>Content Moderation</Text>
                                    <Badge color={selectedJob.contentModerationStatus === 'approved' ? 'green' : 'red'}>
                                        {selectedJob.contentModerationStatus}
                                    </Badge>
                                </div>
                            )}
                        </Group>

                        {/* IDs */}
                        <SimpleGrid cols={2} spacing="xs">
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Job ID</Text>
                                <Group gap={4}>
                                    <Text size="xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                        {selectedJob.id}
                                    </Text>
                                    <CopyButton value={selectedJob.id}>
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
                                        {selectedJob.userId}
                                    </Text>
                                    <CopyButton value={selectedJob.userId}>
                                        {({ copied, copy }) => (
                                            <ActionIcon size="xs" variant="subtle" onClick={copy} color={copied ? 'green' : 'gray'}>
                                                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                            </ActionIcon>
                                        )}
                                    </CopyButton>
                                </Group>
                            </Box>
                        </SimpleGrid>

                        {/* Created At */}
                        <Box>
                            <Text size="xs" c="dimmed" mb={2}>Created At</Text>
                            <Text size="sm">{formatDate(selectedJob.createdAt)}</Text>
                        </Box>

                        {/* Prompt */}
                        <Box>
                            <Text size="xs" c="dimmed" mb={2}>Prompt</Text>
                            <Paper p="sm" withBorder style={{ backgroundColor: '#1a1a2e' }}>
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedJob.metadata.prompt || 'N/A'}
                                </Text>
                            </Paper>
                        </Box>

                        {/* Negative Prompt */}
                        {selectedJob.metadata.neg_prompt && (
                            <Box>
                                <Text size="xs" c="dimmed" mb={2}>Negative Prompt</Text>
                                <Paper p="sm" withBorder style={{ backgroundColor: '#1a1a2e' }}>
                                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                        {selectedJob.metadata.neg_prompt}
                                    </Text>
                                </Paper>
                            </Box>
                        )}

                        {/* Error */}
                        {(selectedJob.error || selectedJob.errorDetails) && (
                            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
                                <Text size="sm">{selectedJob.errorDetails?.message || selectedJob.error}</Text>
                                {selectedJob.errorDetails?.code && (
                                    <Text size="xs" c="dimmed" mt={4}>Code: {selectedJob.errorDetails.code}</Text>
                                )}
                            </Alert>
                        )}

                        {/* Generated Images */}
                        {selectedJob.imageUrls && selectedJob.imageUrls.length > 0 && (
                            <Box>
                                <Text size="xs" c="dimmed" mb={8}>Generated Images ({selectedJob.imageUrls.length})</Text>
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                    {selectedJob.imageUrls.map((img, idx) => (
                                        <Card key={idx} p="xs" withBorder>
                                            <Image
                                                src={img.privateUrl || img.publicUrl}
                                                alt={`Generated image ${idx + 1}`}
                                                fit="contain"
                                                h={250}
                                                radius="sm"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => window.open(img.privateUrl || img.publicUrl, '_blank')}
                                            />
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            </Box>
                        )}
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}
