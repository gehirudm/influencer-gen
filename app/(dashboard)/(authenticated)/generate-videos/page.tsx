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
} from '@mantine/core';
import { IconPhoto, IconAlertCircle, IconVideo } from '@tabler/icons-react';

const AVAILABLE_LORAS = [
    { value: 'hxwoman_lora_v1_FINAL.safetensors', label: 'hxwoman v1 Final (Recommended)' },
    { value: 'hxwoman_lora_v1_000005500.safetensors', label: 'hxwoman v1 - Iteration 5500' },
    { value: 'hxwoman_lora_v1_000004000.safetensors', label: 'hxwoman v1 - Iteration 4000' },
];

const RESOLUTIONS = [
    { value: '1920x1088', label: '1920 x 1088 (LTX 2.3)' },
    { value: '1536x864', label: '1536 x 864' },
    { value: '1280x768', label: '1280 x 768' },
    { value: '1024x576', label: '1024 x 576' },
    { value: '768x512', label: '768 x 512' },
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

export default function GenerateVideosPage() {
    const router = useRouter();
    const { user, systemData, loading: userLoading } = useUserData();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [frameRate, setFrameRate] = useState<number | string>(24);
    const [length, setLength] = useState<number | string>(241);
    const [resolution, setResolution] = useState<string>('1920x1088');
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

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        setStatusError(null);
        setOutputUrl(null);
        setStatus(null);
        setGenerating(true);

        try {
            const res = await fetch('/api/video/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    negativePrompt: negativePrompt.trim() || undefined,
                    frameRate: typeof frameRate === 'number' && !isNaN(frameRate) ? frameRate : 24,
                    length: typeof length === 'number' && !isNaN(length) ? length : 241,
                    resolution: resolution || undefined,
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
                                <Group grow align="flex-start">
                                    <NumberInput
                                        label="Frame Rate"
                                        description="Frames per second"
                                        min={1}
                                        max={120}
                                        value={frameRate}
                                        onChange={(v) => setFrameRate(v)}
                                        disabled={generating}
                                    />
                                    <NumberInput
                                        label="Length (frames)"
                                        description="Total frames"
                                        min={1}
                                        max={9999}
                                        value={length}
                                        onChange={(v) => setLength(v)}
                                        disabled={generating}
                                    />
                                </Group>
                                <Select
                                    mt="sm"
                                    label="Resolution"
                                    description="Output size"
                                    data={RESOLUTIONS}
                                    value={resolution}
                                    onChange={(v) => v && setResolution(v)}
                                    disabled={generating}
                                />
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
                            }}
                        >
                            {status === 'COMPLETED' && outputUrl ? (
                                <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <video
                                        controls
                                        autoPlay
                                        loop
                                        style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }}
                                        src={outputUrl}
                                    />
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
        </Box>
    );
}
