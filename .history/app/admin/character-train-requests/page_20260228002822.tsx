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
    Alert,
    Modal,
    Image,
    SimpleGrid,
    Box,
    Card,
    Textarea,
    Tabs,
    Avatar,
    Tooltip,
    ActionIcon,
    CopyButton,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconCheck,
    IconX,
    IconClock,
    IconPhoto,
    IconUser,
    IconLink,
    IconCopy,
    IconEye,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { completeTrainRequest, rejectTrainRequest, fetchTrainRequests } from '@/app/actions/character/train';

interface TrainRequest {
    id: string;
    characterId: string;
    userId: string;
    characterName: string;
    characterGender?: string;
    characterAge?: string;
    characterBodyType?: string;
    characterDescription: string;
    characterImageUrls: string[];
    characterBaseImageUrl?: string;
    characteristics?: { name: string; value: string }[];
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    loraUrl?: string;
    loraName?: string;
    loraKeyword?: string;
    adminNotes?: string;
    requestedAt: any;
    completedAt?: any;
    completedBy?: string;
}

export default function CharacterTrainRequestsPage() {
    const [requests, setRequests] = useState<TrainRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<TrainRequest | null>(null);
    const [detailModalOpen, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
    const [completeModalOpen, { open: openCompleteModal, close: closeCompleteModal }] = useDisclosure(false);
    const [rejectModalOpen, { open: openRejectModal, close: closeRejectModal }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState<string | null>('pending');
    const [rejectReason, setRejectReason] = useState('');

    const completeForm = useForm({
        initialValues: {
            loraUrl: '',
            loraName: '',
            loraKeyword: '',
        },
        validate: {
            loraUrl: (value) => !value.trim() ? 'LoRA URL is required' : null,
            loraName: (value) => !value.trim() ? 'LoRA name is required' : null,
            loraKeyword: (value) => !value.trim() ? 'LoRA keyword is required' : null,
        },
    });

    // Fetch training requests via server action
    const loadRequests = async () => {
        try {
            const result = await fetchTrainRequests();
            if (result.success) {
                setRequests(result.requests as TrainRequest[]);
            } else {
                console.error('Error fetching train requests:', result.error);
            }
        } catch (error) {
            console.error('Error fetching train requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
        // Poll every 15 seconds for updates
        const interval = setInterval(loadRequests, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleViewDetails = (request: TrainRequest) => {
        setSelectedRequest(request);
        openDetailModal();
    };

    const handleOpenComplete = (request: TrainRequest) => {
        setSelectedRequest(request);
        completeForm.reset();
        openCompleteModal();
    };

    const handleOpenReject = (request: TrainRequest) => {
        setSelectedRequest(request);
        setRejectReason('');
        openRejectModal();
    };

    const handleComplete = async (values: typeof completeForm.values) => {
        if (!selectedRequest) return;

        try {
            setSubmitting(true);
            const result = await completeTrainRequest(
                selectedRequest.id,
                values.loraUrl,
                values.loraName,
                values.loraKeyword,
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            notifications.show({
                title: 'Success',
                message: `Training completed for "${selectedRequest.characterName}". User has been notified.`,
                color: 'green',
            });

            closeCompleteModal();
            setSelectedRequest(null);
            loadRequests();
        } catch (err: any) {
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to complete training request',
                color: 'red',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        try {
            setSubmitting(true);
            const result = await rejectTrainRequest(selectedRequest.id, rejectReason);

            if (!result.success) {
                throw new Error(result.error);
            }

            notifications.show({
                title: 'Success',
                message: `Training request rejected. LoRA token refunded to user.`,
                color: 'green',
            });

            closeRejectModal();
            setSelectedRequest(null);
            loadRequests();
        } catch (err: any) {
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to reject training request',
                color: 'red',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        try {
            if (timestamp.seconds) {
                return new Date(timestamp.seconds * 1000).toLocaleString();
            }
            return new Date(timestamp).toLocaleString();
        } catch {
            return 'N/A';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge color="yellow" leftSection={<IconClock size={12} />}>Pending</Badge>;
            case 'in_progress':
                return <Badge color="blue" leftSection={<IconClock size={12} />}>In Progress</Badge>;
            case 'completed':
                return <Badge color="green" leftSection={<IconCheck size={12} />}>Completed</Badge>;
            case 'rejected':
                return <Badge color="red" leftSection={<IconX size={12} />}>Rejected</Badge>;
            default:
                return <Badge color="gray">{status}</Badge>;
        }
    };

    const filteredRequests = requests.filter((r) => {
        if (activeTab === 'pending') return r.status === 'pending' || r.status === 'in_progress';
        if (activeTab === 'completed') return r.status === 'completed';
        if (activeTab === 'rejected') return r.status === 'rejected';
        return true;
    });

    const pendingCount = requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

    if (loading) {
        return (
            <Stack align="center" justify="center" h="60vh">
                <Loader size="lg" />
                <Text c="dimmed">Loading training requests...</Text>
            </Stack>
        );
    }

    return (
        <Stack gap="lg" p="md">
            <Group justify="space-between">
                <Title order={2}>Character Training Requests</Title>
                {pendingCount > 0 && (
                    <Badge size="lg" color="yellow" variant="filled">
                        {pendingCount} pending
                    </Badge>
                )}
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="pending" leftSection={<IconClock size={16} />}>
                        Pending {pendingCount > 0 && `(${pendingCount})`}
                    </Tabs.Tab>
                    <Tabs.Tab value="completed" leftSection={<IconCheck size={16} />}>
                        Completed
                    </Tabs.Tab>
                    <Tabs.Tab value="rejected" leftSection={<IconX size={16} />}>
                        Rejected
                    </Tabs.Tab>
                    <Tabs.Tab value="all">All</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {filteredRequests.length === 0 ? (
                <Paper p="xl" withBorder>
                    <Text ta="center" c="dimmed" py="xl">
                        No {activeTab === 'all' ? '' : activeTab} training requests found.
                    </Text>
                </Paper>
            ) : (
                <Paper withBorder>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Character</Table.Th>
                                <Table.Th>User ID</Table.Th>
                                <Table.Th>Details</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Requested</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredRequests.map((request) => (
                                <Table.Tr key={request.id}>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar
                                                src={request.characterBaseImageUrl || request.characterImageUrls?.[0]}
                                                size="md"
                                                radius="sm"
                                            />
                                            <div>
                                                <Text size="sm" fw={600}>{request.characterName}</Text>
                                                <Text size="xs" c="dimmed">
                                                    {request.characterGender}{request.characterAge ? `, ${request.characterAge}` : ''}
                                                </Text>
                                            </div>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                                                {request.userId.substring(0, 12)}...
                                            </Text>
                                            <CopyButton value={request.userId}>
                                                {({ copied, copy }) => (
                                                    <Tooltip label={copied ? 'Copied!' : 'Copy User ID'} withArrow>
                                                        <ActionIcon size="xs" variant="subtle" onClick={copy}>
                                                            <IconCopy size={12} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                            </CopyButton>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed" lineClamp={2}>
                                            {request.characterDescription || 'No description'}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>{getStatusBadge(request.status)}</Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed">{formatDate(request.requestedAt)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Tooltip label="View Details" withArrow>
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="blue"
                                                    onClick={() => handleViewDetails(request)}
                                                >
                                                    <IconEye size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            {(request.status === 'pending' || request.status === 'in_progress') && (
                                                <>
                                                    <Button
                                                        size="xs"
                                                        color="green"
                                                        variant="light"
                                                        leftSection={<IconCheck size={14} />}
                                                        onClick={() => handleOpenComplete(request)}
                                                    >
                                                        Complete
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        color="red"
                                                        variant="light"
                                                        leftSection={<IconX size={14} />}
                                                        onClick={() => handleOpenReject(request)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Paper>
            )}

            {/* Detail Modal */}
            <Modal
                opened={detailModalOpen}
                onClose={closeDetailModal}
                title={`Character: ${selectedRequest?.characterName}`}
                size="lg"
                centered
            >
                {selectedRequest && (
                    <Stack gap="md">
                        <Group gap="md" align="flex-start">
                            <Box style={{ flex: '0 0 auto' }}>
                                {(selectedRequest.characterBaseImageUrl || selectedRequest.characterImageUrls?.[0]) ? (
                                    <Image
                                        src={selectedRequest.characterBaseImageUrl || selectedRequest.characterImageUrls[0]}
                                        alt={selectedRequest.characterName}
                                        w={150}
                                        h={200}
                                        radius="md"
                                        fit="cover"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => window.open(selectedRequest.characterBaseImageUrl || selectedRequest.characterImageUrls[0], '_blank')}
                                    />
                                ) : (
                                    <Box
                                        style={{
                                            width: 150,
                                            height: 200,
                                            backgroundColor: '#2a2a2a',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <IconPhoto size={40} color="gray" />
                                    </Box>
                                )}
                            </Box>
                            <Stack gap="xs" style={{ flex: 1 }}>
                                <Text size="sm"><Text component="span" fw={600}>Name:</Text> {selectedRequest.characterName}</Text>
                                <Text size="sm"><Text component="span" fw={600}>Gender:</Text> {selectedRequest.characterGender || 'N/A'}</Text>
                                <Text size="sm"><Text component="span" fw={600}>Age:</Text> {selectedRequest.characterAge || 'N/A'}</Text>
                                <Text size="sm"><Text component="span" fw={600}>Body Type:</Text> {selectedRequest.characterBodyType || 'N/A'}</Text>
                                <Text size="sm"><Text component="span" fw={600}>Status:</Text> {getStatusBadge(selectedRequest.status)}</Text>
                                <Text size="sm"><Text component="span" fw={600}>User ID:</Text> <Text component="span" size="xs" style={{ fontFamily: 'monospace' }}>{selectedRequest.userId}</Text></Text>
                                <Text size="sm"><Text component="span" fw={600}>Character ID:</Text> <Text component="span" size="xs" style={{ fontFamily: 'monospace' }}>{selectedRequest.characterId}</Text></Text>
                                <Text size="sm"><Text component="span" fw={600}>Requested:</Text> {formatDate(selectedRequest.requestedAt)}</Text>
                            </Stack>
                        </Group>

                        {/* Base Face Image - Direct Link */}
                        {selectedRequest.characterBaseImageUrl && (
                            <Box p="sm" style={{ backgroundColor: '#1a1a2e', borderRadius: 8, border: '1px solid #333' }}>
                                <Text size="sm" fw={700} mb={6} c="white">🎯 Base Face Image (Direct Link)</Text>
                                <Group gap="xs" align="center">
                                    <Text size="xs" c="dimmed" style={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                        {selectedRequest.characterBaseImageUrl}
                                    </Text>
                                    <CopyButton value={selectedRequest.characterBaseImageUrl}>
                                        {({ copied, copy }) => (
                                            <Tooltip label={copied ? 'Copied!' : 'Copy URL'} withArrow>
                                                <ActionIcon size="sm" variant="light" onClick={copy} color={copied ? 'green' : 'blue'}>
                                                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </CopyButton>
                                    <Tooltip label="Open in new tab" withArrow>
                                        <ActionIcon size="sm" variant="light" color="blue" onClick={() => window.open(selectedRequest.characterBaseImageUrl, '_blank')}>
                                            <IconLink size={14} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Box>
                        )}

                        {selectedRequest.characterDescription && (
                            <Box>
                                <Text size="sm" fw={600} mb={4}>Description:</Text>
                                <Text size="sm" c="dimmed">{selectedRequest.characterDescription}</Text>
                            </Box>
                        )}

                        {selectedRequest.characteristics && selectedRequest.characteristics.length > 0 && (
                            <Box>
                                <Text size="sm" fw={600} mb={4}>Characteristics:</Text>
                                <Group gap="xs">
                                    {selectedRequest.characteristics.map((char, i) => (
                                        char.value && (
                                            <Badge key={i} variant="outline" size="sm">
                                                {char.name}: {char.value}
                                            </Badge>
                                        )
                                    ))}
                                </Group>
                            </Box>
                        )}

                        {selectedRequest.characterImageUrls && selectedRequest.characterImageUrls.length > 0 && (
                            <Box>
                                <Text size="sm" fw={600} mb={4}>Reference Images ({selectedRequest.characterImageUrls.length}):</Text>
                                <Stack gap="sm">
                                    {selectedRequest.characterImageUrls.map((url, i) => (
                                        <Box key={i}>
                                            <Image
                                                src={url}
                                                alt={`Reference ${i + 1}`}
                                                radius="sm"
                                                h={120}
                                                w={100}
                                                fit="cover"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => window.open(url, '_blank')}
                                            />
                                            <Group gap={4} mt={4}>
                                                <Text size="xs" c="dimmed" lineClamp={1} style={{ flex: 1, wordBreak: 'break-all' }}>
                                                    {url}
                                                </Text>
                                                <CopyButton value={url}>
                                                    {({ copied, copy }) => (
                                                        <Tooltip label={copied ? 'Copied!' : 'Copy URL'} withArrow>
                                                            <ActionIcon size="xs" variant="subtle" onClick={copy} color={copied ? 'green' : 'gray'}>
                                                                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </CopyButton>
                                                <Tooltip label="Open in new tab" withArrow>
                                                    <ActionIcon size="xs" variant="subtle" onClick={() => window.open(url, '_blank')} color="blue">
                                                        <IconLink size={12} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {selectedRequest.loraUrl && (
                            <Box>
                                <Text size="sm" fw={600} mb={4}>LoRA Details:</Text>
                                <Text size="sm"><Text component="span" fw={600}>URL:</Text> {selectedRequest.loraUrl}</Text>
                                {selectedRequest.loraName && <Text size="sm"><Text component="span" fw={600}>Name:</Text> {selectedRequest.loraName}</Text>}
                                {selectedRequest.loraKeyword && <Text size="sm"><Text component="span" fw={600}>Keyword:</Text> {selectedRequest.loraKeyword}</Text>}
                            </Box>
                        )}

                        {(selectedRequest.status === 'pending' || selectedRequest.status === 'in_progress') && (
                            <Group justify="flex-end" mt="md">
                                <Button
                                    color="green"
                                    leftSection={<IconCheck size={16} />}
                                    onClick={() => {
                                        closeDetailModal();
                                        handleOpenComplete(selectedRequest);
                                    }}
                                >
                                    Complete Training
                                </Button>
                                <Button
                                    color="red"
                                    variant="light"
                                    leftSection={<IconX size={16} />}
                                    onClick={() => {
                                        closeDetailModal();
                                        handleOpenReject(selectedRequest);
                                    }}
                                >
                                    Reject
                                </Button>
                            </Group>
                        )}
                    </Stack>
                )}
            </Modal>

            {/* Complete Training Modal */}
            <Modal
                opened={completeModalOpen}
                onClose={closeCompleteModal}
                title={`Complete Training: ${selectedRequest?.characterName}`}
                centered
                size="md"
            >
                <form onSubmit={completeForm.onSubmit(handleComplete)}>
                    <Stack gap="md">
                        <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                            Fill in the LoRA details to complete training for this character. The user will be notified automatically.
                        </Alert>

                        <TextInput
                            label="LoRA URL"
                            placeholder="https://storage.example.com/lora/character.safetensors"
                            required
                            leftSection={<IconLink size={16} />}
                            {...completeForm.getInputProps('loraUrl')}
                        />

                        <TextInput
                            label="LoRA Name"
                            placeholder="character_name_v1"
                            description="Must match the storage bucket filename"
                            required
                            {...completeForm.getInputProps('loraName')}
                        />

                        <TextInput
                            label="LoRA Keyword"
                            placeholder="character_keyword"
                            description="The trigger keyword for this LoRA in generation prompts"
                            required
                            {...completeForm.getInputProps('loraKeyword')}
                        />

                        <Group justify="flex-end">
                            <Button variant="default" onClick={closeCompleteModal}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                color="green"
                                loading={submitting}
                                leftSection={<IconCheck size={16} />}
                            >
                                Complete Training
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            {/* Reject Modal */}
            <Modal
                opened={rejectModalOpen}
                onClose={closeRejectModal}
                title={`Reject Training: ${selectedRequest?.characterName}`}
                centered
                size="md"
            >
                <Stack gap="md">
                    <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                        Rejecting this request will refund the user's LoRA token and notify them.
                    </Alert>

                    <Textarea
                        label="Reason (optional)"
                        placeholder="Reason for rejecting this training request..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.currentTarget.value)}
                        rows={3}
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeRejectModal}>
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            loading={submitting}
                            leftSection={<IconX size={16} />}
                            onClick={handleReject}
                        >
                            Reject Request
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
