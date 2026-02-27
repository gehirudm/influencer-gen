"use client"

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Textarea,
    TextInput,
    Button,
    Card,
    Badge,
    Loader,
    Alert,
    Image,
    Group,
    Stack,
    Grid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconPhoto, IconCheck, IconClock, IconPlayerPlay, IconLink } from '@tabler/icons-react';
import styles from './page.module.css';

type JobStatus = 'IDLE' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface JobOutput {
    images?: Array<{
        filename: string;
        type: 'base64' | 's3_url';
        data: string;
    }>;
    errors?: string[];
}

interface JobState {
    jobId: string | null;
    status: JobStatus;
    delayTime?: number;
    executionTime?: number;
    output?: JobOutput;
    error?: string;
}

const POLL_INTERVAL = 2000; // Poll every 2 seconds

export default function WorkflowPage() {
    const [loraUrl, setLoraUrl] = useState('');
    const [loraKeyword, setLoraKeyword] = useState('');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jobState, setJobState] = useState<JobState>({
        jobId: null,
        status: 'IDLE'
    });

    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearTimeout(pollingRef.current);
            }
        };
    }, []);

    const pollJobStatus = useCallback(async (jobId: string) => {
        try {
            const response = await fetch(`/api/comfyui/status/${jobId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get job status');
            }

            setJobState(prev => ({
                ...prev,
                status: data.status,
                delayTime: data.delayTime,
                executionTime: data.executionTime,
                output: data.output,
                error: data.error
            }));

            // Continue polling if job is still processing
            if (data.status === 'IN_QUEUE' || data.status === 'IN_PROGRESS') {
                pollingRef.current = setTimeout(() => pollJobStatus(jobId), POLL_INTERVAL);
            } else if (data.status === 'COMPLETED') {
                notifications.show({
                    title: 'Generation Complete',
                    message: 'Your image has been generated successfully!',
                    color: 'green',
                    icon: <IconCheck size={16} />
                });
            } else if (data.status === 'FAILED') {
                notifications.show({
                    title: 'Generation Failed',
                    message: data.error || 'An error occurred during generation',
                    color: 'red',
                    icon: <IconAlertCircle size={16} />
                });
            }
        } catch (error: any) {
            console.error('Polling error:', error);
            setJobState(prev => ({
                ...prev,
                status: 'FAILED',
                error: error.message
            }));
        }
    }, []);

    const handleSubmit = async () => {
        if (!loraUrl.trim()) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please enter a LoRA URL',
                color: 'red'
            });
            return;
        }

        if (!prompt.trim()) {
            notifications.show({
                title: 'Validation Error',
                message: 'Please enter a positive prompt',
                color: 'red'
            });
            return;
        }

        setIsSubmitting(true);
        setJobState({ jobId: null, status: 'IDLE' });

        // Clear any existing polling
        if (pollingRef.current) {
            clearTimeout(pollingRef.current);
        }

        try {
            const response = await fetch('/api/comfyui/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    negativePrompt: negativePrompt.trim(),
                    loraUrl: loraUrl.trim(),
                    loraKeyword: loraKeyword.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit workflow');
            }

            notifications.show({
                title: 'Workflow Submitted',
                message: `Job ${data.jobId} is being processed`,
                color: 'blue',
                icon: <IconPlayerPlay size={16} />
            });

            setJobState({
                jobId: data.jobId,
                status: data.status || 'IN_QUEUE'
            });

            // Start polling for status
            pollingRef.current = setTimeout(() => pollJobStatus(data.jobId), POLL_INTERVAL);

        } catch (error: any) {
            console.error('Submit error:', error);
            notifications.show({
                title: 'Submission Failed',
                message: error.message || 'Failed to submit workflow',
                color: 'red',
                icon: <IconAlertCircle size={16} />
            });
            setJobState(prev => ({
                ...prev,
                status: 'FAILED',
                error: error.message
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: JobStatus): string => {
        switch (status) {
            case 'IDLE': return 'gray';
            case 'IN_QUEUE': return 'yellow';
            case 'IN_PROGRESS': return 'blue';
            case 'COMPLETED': return 'green';
            case 'FAILED': return 'red';
            case 'CANCELLED': return 'orange';
            default: return 'gray';
        }
    };

    const isProcessing = jobState.status === 'IN_QUEUE' || jobState.status === 'IN_PROGRESS';

    return (
        <Container className={styles.container}>
            <Title order={1} className={styles.title}>
                LoRA Workflow Generator
            </Title>
            <Text size="lg" c="dimmed" className={styles.description}>
                Generate images using a custom LoRA model. Provide the LoRA URL, your prompt, and optional negative prompt.
            </Text>

            <div className={styles.form}>
                <TextInput
                    label="LoRA URL"
                    placeholder="https://huggingface.co/.../model.safetensors?download=true"
                    leftSection={<IconLink size={16} />}
                    value={loraUrl}
                    onChange={(e) => setLoraUrl(e.currentTarget.value)}
                    className={styles.promptInput}
                    disabled={isSubmitting || isProcessing}
                    description="Direct download URL to a .safetensors LoRA file"
                    required
                />

                <TextInput
                    label="LoRA Keyword"
                    placeholder="e.g. ohwx, sks, zwx"
                    leftSection={<IconLink size={16} />}
                    value={loraKeyword}
                    onChange={(e) => setLoraKeyword(e.currentTarget.value)}
                    className={styles.promptInput}
                    disabled={isSubmitting || isProcessing}
                    description="Trigger keyword prepended to the prompt (optional)"
                />

                <Textarea
                    label="Positive Prompt"
                    placeholder="Describe the image you want to generate..."
                    minRows={4}
                    maxRows={8}
                    value={prompt}
                    onChange={(e) => setPrompt(e.currentTarget.value)}
                    className={styles.promptInput}
                    disabled={isSubmitting || isProcessing}
                    required
                />

                <Textarea
                    label="Negative Prompt"
                    placeholder="Describe what you don't want in the image... (optional)"
                    minRows={2}
                    maxRows={4}
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.currentTarget.value)}
                    className={styles.promptInput}
                    disabled={isSubmitting || isProcessing}
                />

                <Button
                    size="lg"
                    leftSection={isSubmitting || isProcessing ? <Loader size={18} color="white" /> : <IconPhoto size={18} />}
                    onClick={handleSubmit}
                    disabled={isSubmitting || isProcessing || !prompt.trim() || !loraUrl.trim()}
                    className={styles.generateButton}
                    fullWidth
                >
                    {isSubmitting ? 'Submitting...' : isProcessing ? 'Processing...' : 'Generate Image'}
                </Button>
            </div>

            {/* Job Status Section */}
            {jobState.jobId && (
                <div className={styles.resultSection}>
                    <Card shadow="sm" padding="lg" radius="md" withBorder className={styles.statusCard}>
                        <Group justify="space-between" mb="md">
                            <Text fw={500}>Job Status</Text>
                            <Badge
                                color={getStatusColor(jobState.status)}
                                variant="filled"
                                className={styles.statusBadge}
                            >
                                {jobState.status}
                            </Badge>
                        </Group>

                        <Text size="sm" c="dimmed" mb="sm">
                            Job ID: {jobState.jobId}
                        </Text>

                        {isProcessing && (
                            <div className={styles.loaderContainer}>
                                <Loader size="sm" />
                                <Text size="sm">
                                    {jobState.status === 'IN_QUEUE'
                                        ? 'Waiting in queue...'
                                        : 'Generating your image...'}
                                </Text>
                            </div>
                        )}

                        {(jobState.delayTime !== undefined || jobState.executionTime !== undefined) && (
                            <Grid mt="md" className={styles.statsGrid}>
                                {jobState.delayTime !== undefined && (
                                    <Grid.Col span={6}>
                                        <Group gap="xs">
                                            <IconClock size={16} />
                                            <Text size="sm">
                                                Queue Time: {(jobState.delayTime / 1000).toFixed(2)}s
                                            </Text>
                                        </Group>
                                    </Grid.Col>
                                )}
                                {jobState.executionTime !== undefined && (
                                    <Grid.Col span={6}>
                                        <Group gap="xs">
                                            <IconPlayerPlay size={16} />
                                            <Text size="sm">
                                                Execution Time: {(jobState.executionTime / 1000).toFixed(2)}s
                                            </Text>
                                        </Group>
                                    </Grid.Col>
                                )}
                            </Grid>
                        )}
                    </Card>

                    {/* Error Display */}
                    {jobState.error && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            title="Error"
                            color="red"
                            mb="md"
                        >
                            {jobState.error}
                        </Alert>
                    )}

                    {/* Output Errors */}
                    {jobState.output?.errors && jobState.output.errors.length > 0 && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            title="Warnings"
                            color="orange"
                            mb="md"
                        >
                            <Stack gap="xs">
                                {jobState.output.errors.map((err, idx) => (
                                    <Text key={idx} size="sm">{err}</Text>
                                ))}
                            </Stack>
                        </Alert>
                    )}

                    {/* Generated Images */}
                    {jobState.output?.images && jobState.output.images.length > 0 && (
                        <div>
                            <Title order={3} mb="md">Generated Images</Title>
                            <div className={styles.imageContainer}>
                                {jobState.output.images.map((image, idx) => (
                                    <Card key={idx} shadow="sm" padding="md" radius="md" withBorder>
                                        <Image
                                            src={
                                                image.type === 'base64'
                                                    ? `data:image/png;base64,${image.data}`
                                                    : image.data
                                            }
                                            alt={`Generated image ${idx + 1}`}
                                            className={styles.generatedImage}
                                            fit="contain"
                                            maw={512}
                                        />
                                        <Text size="xs" c="dimmed" mt="sm">
                                            {image.filename}
                                        </Text>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Container>
    );
}
