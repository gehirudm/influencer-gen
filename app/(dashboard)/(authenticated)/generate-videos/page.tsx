"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { useMediaQuery } from '@mantine/hooks';
import {
    Box,
    Grid,
    Stack,
    Card,
    Textarea,
    NumberInput,
    Select,
    TextInput,
    Group,
    Text,
    Button,
    ScrollArea,
    Loader,
    Alert,
    Center,
    Modal,
    Slider,
    Tabs,
    SimpleGrid,
    Badge,
    ActionIcon,
} from '@mantine/core';
import { IconAlertCircle, IconVideo, IconPlayerPlay, IconMaximize } from '@tabler/icons-react';

const AVAILABLE_LORAS = [
    { value: 'hxwoman_lora_v1_FINAL.safetensors', label: 'hxwoman v1 Final (Recommended)' },
    { value: 'hxwoman_lora_v1_000005500.safetensors', label: 'hxwoman v1 - Iteration 5500' },
    { value: 'hxwoman_lora_v1_000004000.safetensors', label: 'hxwoman v1 - Iteration 4000' },
];

const RESOLUTION_PRESETS = [
    { group: 'Portrait (Phone)', items: [
        { value: '768x1152', label: '768 × 1152 (Recommended)' },
        { value: '512x768', label: '512 × 768' },
        { value: '1088x1920', label: '1088 × 1920' },
    ]},
    { group: 'Landscape', items: [
        { value: '1920x1088', label: '1920 × 1088' },
        { value: '1536x864', label: '1536 × 864' },
        { value: '1280x768', label: '1280 × 768' },
        { value: '1024x576', label: '1024 × 576' },
    ]},
];

const FPS_MARKS = [
    { value: 24, label: '24' },
    { value: 30, label: '30' },
    { value: 60, label: '60' },
];

const COST = 100;

type JobStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | null;

interface StatusData {
    id: string;
    status: JobStatus;
    delayTime?: number;
    executionTime?: number;
    output?: {
        images?: Array<{
            filename: string;
            type: 'base64' | 's3_url';
            data: string;
        }>;
    };
    error?: string;
}

interface HistoryVideo {
    jobId: string;
    imageUrls: Array<{ publicUrl: string; privateUrl: string }>;
    metadata: Record<string, any>;
    createdAt: string;
    executionTime: number | null;
}

export default function GenerateVideosPage() {
    const router = useRouter();
    const { user, systemData, loading: userLoading } = useUserData();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [frameRate, setFrameRate] = useState(24);
    const [durationSeconds, setDurationSeconds] = useState<number | string>(5);
    const [resolution, setResolution] = useState<string>('768x1152');
    const [customW, setCustomW] = useState<number | string>('');
    const [customH, setCustomH] = useState<number | string>('');
    const [steps, setSteps] = useState<number | string>(9);
    const [cfg, setCfg] = useState<number | string>(1);
    const [seed, setSeed] = useState('');
    const [loraStrength, setLoraStrength] = useState<number | string>(1.1);
    const [loraName, setLoraName] = useState<string>(AVAILABLE_LORAS[0].value);

    const [generating, setGenerating] = useState(false);
    const [status, setStatus] = useState<JobStatus>(null);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [tokensRemaining, setTokensRemaining] = useState<number | null>(null);

    const [modalOpened, setModalOpened] = useState(false);
    const [history, setHistory] = useState<HistoryVideo[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!userLoading) {
            if (!user) {
                router.replace('/auth');
                return;
            }
            if (systemData && systemData.role !== 'Dennis') {
                router.replace('/auth');
            }
        }
    }, [userLoading, user, systemData, router]);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const pollStatus = useCallback(
        async (id: string) => {
            try {
                const res = await fetch(`/api/video/status/${id}`);
                const data: StatusData & { error?: string } = await res.json();

                if (!res.ok) {
                    setStatusError(data.error || 'Failed to get job status');
                    setGenerating(false);
                    stopPolling();
                    return;
                }

                setStatus(data.status);

                if (data.status === 'COMPLETED') {
                    setGenerating(false);
                    stopPolling();
                    if (data.output?.images?.length) {
                        const img = data.output.images[0];
                        if (img.type === 'base64') {
                            setOutputUrl(`data:video/mp4;base64,${img.data}`);
                        } else {
                            setOutputUrl(img.data);
                        }
                    }
                } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
                    setGenerating(false);
                    stopPolling();
                    setStatusError(data.error || `Job ${data.status.toLowerCase()}`);
                }
            } catch (err: any) {
                setStatusError(err.message || 'Failed to check status');
                setGenerating(false);
                stopPolling();
            }
        },
        [stopPolling]
    );

    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch('/api/video/history');
            const data = await res.json();
            if (data.videos) {
                setHistory(data.videos);
            }
        } catch (err) {
            console.error('Failed to fetch video history:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (modalOpened) {
            fetchHistory();
        }
    }, [modalOpened, fetchHistory]);

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        setStatusError(null);
        setOutputUrl(null);
        setStatus(null);
        setGenerating(true);

        const effectiveResolution = resolution === 'custom'
            ? `${customW || 768}x${customH || 1152}`
            : resolution;

        try {
            const res = await fetch('/api/video/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    negativePrompt: negativePrompt.trim() || undefined,
                    frameRate,
                    durationSeconds: typeof durationSeconds === 'number' && !isNaN(durationSeconds) ? durationSeconds : 5,
                    resolution: effectiveResolution,
                    steps: typeof steps === 'number' && !isNaN(steps) ? steps : 9,
                    cfg: typeof cfg === 'number' && !isNaN(cfg) ? cfg : 1,
                    seed: seed.trim() ? parseInt(seed.trim(), 10) : undefined,
                    loraStrength: typeof loraStrength === 'number' && !isNaN(loraStrength) ? loraStrength : 1.1,
                    loraName: loraName || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setStatusError(data.error || 'Failed to submit generation');
                setGenerating(false);
                return;
            }

            setJobId(data.jobId);
            setStatus(data.status);
            setTokensRemaining(data.tokensRemaining);

            pollRef.current = setInterval(() => pollStatus(data.jobId), 5000);
        } catch (err: any) {
            setStatusError(err.message || 'Network error');
            setGenerating(false);
        }
    };

    const openModal = (url?: string) => {
        setModalVideoUrl(url || outputUrl);
        setModalOpened(true);
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return '—';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const resolutionOptions = [
        ...RESOLUTION_PRESETS.flatMap(group => [
            { value: `__group__${group.group}`, label: `— ${group.group} —`, disabled: true },
            ...group.items,
        ]),
        { value: 'custom', label: 'Custom (W × H)' },
    ];

    if (userLoading) {
        return (
            <Center style={{ height: '100vh' }}>
                <Loader size="xl" />
            </Center>
        );
    }

    if (!user || (systemData && systemData.role !== 'Dennis')) {
        return null;
    }

    const statusLabel: Record<string, string> = {
        IN_QUEUE: 'In queue...',
        IN_PROGRESS: 'Generating...',
        COMPLETED: 'Completed',
        FAILED: 'Failed',
        CANCELLED: 'Cancelled',
    };

    return (
        <Box style={{ height: '100%', width: '100%' }} pt={{ base: 'sm', md: 0 }}>
            <Grid gutter="xs" style={{ margin: 0, height: '100%' }}>
                {/* Left Column - Inputs */}
                <Grid.Col
                    span={{ base: 12, md: 8 }}
                    style={{
                        height: isMobile ? 'auto' : 'calc(100vh - 40px)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: isMobile ? '0.25rem 0.15rem' : '0.75rem',
                    }}
                >
                    <ScrollArea
                        style={{ flex: 1, marginBottom: isMobile ? '0.5rem' : '1rem' }}
                        scrollbarSize={isMobile ? 0 : 10}
                        offsetScrollbars={!isMobile}
                        styles={{
                            scrollbar: {
                                '&[data-orientation="vertical"] .mantine-ScrollArea-thumb': {
                                    backgroundColor: '#4a7aba',
                                },
                                '&:hover [data-orientation="vertical"] .mantine-ScrollArea-thumb': {
                                    backgroundColor: '#5a8aca',
                                },
                            },
                        }}
                    >
                        <Stack gap={isMobile ? 'xs' : 'md'} pl={isMobile ? 'sm' : 0} pr={isMobile ? 'sm' : 'md'}>
                            <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">Prompt</Text>
                                <Textarea
                                    label="Video Prompt"
                                    placeholder="Describe the video you want to generate..."
                                    minRows={4}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.currentTarget.value)}
                                    disabled={generating}
                                />
                            </Card>

                            <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">Settings</Text>
                                <Stack gap="md">
                                    <Box>
                                        <Text size="sm" fw={500} mb={4} c="dimmed">Frame Rate: {frameRate} fps</Text>
                                        <Slider
                                            value={frameRate}
                                            onChange={setFrameRate}
                                            min={1}
                                            max={60}
                                            step={1}
                                            marks={FPS_MARKS}
                                            disabled={generating}
                                            styles={{
                                                markLabel: { color: '#888', fontSize: '12px' },
                                                thumb: { borderColor: '#5a8aca' },
                                                track: { backgroundColor: '#333' },
                                                bar: { backgroundColor: '#5a8aca' },
                                            }}
                                        />
                                    </Box>
                                    <NumberInput
                                        label="Duration"
                                        description="Length in whole seconds"
                                        min={1}
                                        max={120}
                                        value={durationSeconds}
                                        onChange={(v) => setDurationSeconds(v)}
                                        disabled={generating}
                                    />
                                    <Text size="xs" c="dimmed">
                                        Total frames: {(
                                            (typeof durationSeconds === 'number' && !isNaN(durationSeconds) ? durationSeconds : 5) * frameRate + 1
                                        )} ({(typeof durationSeconds === 'number' && !isNaN(durationSeconds) ? durationSeconds : 5)}s × {frameRate} fps + 1 base)
                                    </Text>
                                    <Select
                                        label="Resolution"
                                        description="Output size"
                                        data={resolutionOptions}
                                        value={resolution}
                                        onChange={(v) => v && setResolution(v)}
                                        disabled={generating}
                                    />
                                    {resolution === 'custom' && (
                                        <Group grow align="flex-start">
                                            <NumberInput
                                                label="Width"
                                                placeholder="768"
                                                min={64}
                                                max={4096}
                                                step={64}
                                                value={customW}
                                                onChange={(v) => setCustomW(v)}
                                                disabled={generating}
                                            />
                                            <NumberInput
                                                label="Height"
                                                placeholder="1152"
                                                min={64}
                                                max={4096}
                                                step={64}
                                                value={customH}
                                                onChange={(v) => setCustomH(v)}
                                                disabled={generating}
                                            />
                                        </Group>
                                    )}
                                </Stack>
                            </Card>

                            <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">LoRA</Text>
                                <Select
                                    label="Select LoRA"
                                    description="Choose which trained LoRA to apply"
                                    data={AVAILABLE_LORAS}
                                    value={loraName}
                                    onChange={(v) => v && setLoraName(v)}
                                    disabled={generating}
                                />
                            </Card>

                            <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">Custom Settings</Text>
                                <Stack gap="md">
                                    <Textarea
                                        label="Negative Prompt"
                                        placeholder="What you don't want in the video..."
                                        minRows={2}
                                        value={negativePrompt}
                                        onChange={(e) => setNegativePrompt(e.currentTarget.value)}
                                        disabled={generating}
                                    />
                                    <Group grow align="flex-start">
                                        <NumberInput
                                            label="Steps"
                                            description="Inference steps"
                                            min={1}
                                            max={200}
                                            value={steps}
                                            onChange={(v) => setSteps(v)}
                                            disabled={generating}
                                        />
                                        <NumberInput
                                            label="CFG Scale"
                                            description="Prompt adherence"
                                            min={1}
                                            max={20}
                                            step={0.5}
                                            decimalScale={1}
                                            value={cfg}
                                            onChange={(v) => setCfg(v)}
                                            disabled={generating}
                                        />
                                        <NumberInput
                                            label="LoRA Strength"
                                            description="LoRA intensity"
                                            min={0}
                                            max={2}
                                            step={0.05}
                                            decimalScale={2}
                                            value={loraStrength}
                                            onChange={(v) => setLoraStrength(v)}
                                            disabled={generating}
                                        />
                                    </Group>
                                    <TextInput
                                        label="Seed"
                                        placeholder="Leave empty for random"
                                        description="Use a specific seed for reproducible results"
                                        value={seed}
                                        onChange={(e) => setSeed(e.currentTarget.value)}
                                        disabled={generating}
                                    />
                                </Stack>
                            </Card>
                        </Stack>
                    </ScrollArea>

                    {statusError && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            color="red"
                            mb="sm"
                            onClose={() => setStatusError(null)}
                            withCloseButton
                        >
                            {statusError}
                        </Alert>
                    )}

                    <Box px={isMobile ? 'sm' : 0}>
                        <Button
                            fullWidth
                            size="lg"
                            onClick={handleSubmit}
                            loading={generating}
                            disabled={!prompt.trim()}
                        >
                            Generate (<span style={{ color: '#FBBF24' }}>{COST}</span> Tokens)
                        </Button>
                        {tokensRemaining !== null && (
                            <Text size="xs" c="dimmed" ta="center" mt="xs">
                                Remaining tokens: {tokensRemaining}
                            </Text>
                        )}
                    </Box>
                </Grid.Col>

                {/* Right Column - Output */}
                <Grid.Col
                    span={{ base: 12, md: 4 }}
                    style={{
                        height: isMobile ? 'auto' : 'calc(100vh - 40px)',
                        padding: isMobile ? '0.25rem 0.15rem' : '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Stack gap="md" px={isMobile ? 'sm' : 0} style={{ flex: 1, overflow: 'hidden' }}>
                        <Card
                            p="md"
                            style={{
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #444',
                                flex: isMobile ? undefined : 1,
                                minHeight: isMobile ? '200px' : 0,
                                maxHeight: isMobile ? '260px' : undefined,
                                position: 'relative',
                            }}
                        >
                            {status === 'COMPLETED' && outputUrl ? (
                                <Box
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                    }}
                                >
                                    <video
                                        controls
                                        autoPlay
                                        loop
                                        style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', cursor: 'pointer' }}
                                        src={outputUrl}
                                        onClick={() => openModal()}
                                    />
                                    <ActionIcon
                                        variant="filled"
                                        color="dark"
                                        radius="xl"
                                        style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                                        onClick={() => openModal()}
                                    >
                                        <IconMaximize size={16} />
                                    </ActionIcon>
                                </Box>
                            ) : generating ? (
                                <Box
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px dashed #555',
                                    }}
                                >
                                    <Stack align="center" gap="sm">
                                        <Loader size="lg" color="violet" />
                                        <Text c="dimmed" size="lg">
                                            {status ? statusLabel[status] || status : 'Submitting...'}
                                        </Text>
                                    </Stack>
                                </Box>
                            ) : (
                                <Box
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px dashed #555',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Stack align="center" gap="sm">
                                        <IconVideo size={64} color="#666" />
                                        <Text c="dimmed" size="lg">Output Preview</Text>
                                        <Text c="dimmed" size="sm">Your generated video will appear here</Text>
                                    </Stack>
                                </Box>
                            )}
                        </Card>
                    </Stack>
                </Grid.Col>
            </Grid>

            {/* Video Modal */}
            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                size="xl"
                title="Video Playback"
                styles={{
                    title: { color: '#fff', fontWeight: 600 },
                    content: { backgroundColor: '#1a1a1a' },
                    header: { backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' },
                }}
            >
                <Tabs defaultValue="current">
                    <Tabs.List>
                        <Tabs.Tab value="current" leftSection={<IconPlayerPlay size={14} />}>
                            Current Video
                        </Tabs.Tab>
                        <Tabs.Tab value="history" leftSection={<IconVideo size={14} />}>
                            Past Videos {history.length > 0 && <Badge ml="xs" size="xs" variant="light">{history.length}</Badge>}
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="current" pt="md">
                        {modalVideoUrl ? (
                            <Box style={{ width: '100%', maxHeight: '70vh' }}>
                                <video
                                    controls
                                    autoPlay
                                    style={{
                                        width: '100%',
                                        maxHeight: '60vh',
                                        borderRadius: '8px',
                                        backgroundColor: '#000',
                                    }}
                                    src={modalVideoUrl}
                                />
                            </Box>
                        ) : (
                            <Center py="xl">
                                <Stack align="center" gap="sm">
                                    <IconVideo size={48} color="#555" />
                                    <Text c="dimmed">No video to display</Text>
                                </Stack>
                            </Center>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="history" pt="md">
                        {historyLoading ? (
                            <Center py="xl">
                                <Loader size="md" />
                            </Center>
                        ) : history.length === 0 ? (
                            <Center py="xl">
                                <Stack align="center" gap="sm">
                                    <IconVideo size={48} color="#555" />
                                    <Text c="dimmed">No past videos yet</Text>
                                </Stack>
                            </Center>
                        ) : (
                            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
                                {history.map((vid) => (
                                    <Card
                                        key={vid.jobId}
                                        padding="sm"
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #444',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => {
                                            if (vid.imageUrls[0]) {
                                                setModalVideoUrl(vid.imageUrls[0].publicUrl);
                                            }
                                        }}
                                    >
                                        <Box
                                            style={{
                                                width: '100%',
                                                aspectRatio: '9/16',
                                                backgroundColor: '#000',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                            }}
                                        >
                                            <IconVideo size={32} color="#444" />
                                            <Box
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <IconPlayerPlay
                                                    size={24}
                                                    color="rgba(255,255,255,0.7)"
                                                    style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.6))' }}
                                                />
                                            </Box>
                                        </Box>
                                        <Stack gap={2} mt="xs">
                                            <Text size="xs" c="dimmed" lineClamp={2}>
                                                {vid.metadata?.prompt || 'Untitled'}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {formatDate(vid.createdAt)}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {formatDuration(vid.metadata?.duration_seconds)}
                                            </Text>
                                        </Stack>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        )}
                    </Tabs.Panel>
                </Tabs>
            </Modal>
        </Box>
    );
}
