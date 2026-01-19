"use client"

import { useState } from 'react';
import { 
    Grid, 
    Card, 
    Stack, 
    Button, 
    Box,
    Text,
    Title,
    Image,
    Container,
    FileButton,
    Select,
    Accordion,
    Group,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { useUserJobs } from '@/hooks/useUserJobs';
import { IconPhoto, IconUpload, IconShirt, IconEye, IconSwimming, IconHanger, IconLink } from '@tabler/icons-react';

// Add CSS for pulse animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
        }
    `;
    if (!document.querySelector('[data-pulse-animation]')) {
        style.setAttribute('data-pulse-animation', 'true');
        document.head.appendChild(style);
    }
}

export default function UndressPage() {
    const form = useForm({
        initialValues: {
            mode: 'Undress',
        },
    });

    const { jobs: userJobs } = useUserJobs();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBlur, setImageBlur] = useState(0);
    const [selectedMode, setSelectedMode] = useState('Undress');
    const [breastSize, setBreastSize] = useState<string | null>(null);
    const [pussyHaircut, setPussyHaircut] = useState<string | null>(null);
    const [bodyType, setBodyType] = useState<string | null>(null);

    const handleImageUpload = (file: File | null) => {
        if (file) {
            setUploadedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUndress = async () => {
        if (!uploadedImage) {
            notifications.show({
                title: 'Error',
                message: 'Please upload an image first',
                color: 'red'
            });
            return;
        }

        setLoading(true);

        // Simulate processing
        setTimeout(() => {
            notifications.show({
                title: 'Processing',
                message: 'Image undressing in progress...',
                color: 'blue'
            });
            
            // Simulate completion after a delay
            setTimeout(() => {
                setLoading(false);
                notifications.show({
                    title: 'Success',
                    message: 'Image processing completed!',
                    color: 'green'
                });
            }, 8000);
        }, 1000);
    };

    // Get completed jobs with images
    const completedJobs = userJobs.filter(job => job.status === 'completed' && job.imageUrls && job.imageUrls.length > 0);
    const latestJob = completedJobs[0];
    const previousJobs = completedJobs.slice(1);

    return (
        <Box style={{ height: '100%', width: '100%' }}>
            <Grid gutter="md" style={{ margin: 0, height: '100%' }}>
                {/* Left Column - Input Data */}
                <Grid.Col span={{ base: 12, md: 8 }} style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '0.75rem' }}>
                        {/* Scrollable Content */}
                        <Box style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                            <Stack gap="md">
                                <Title size="h3" c="white">Undress Image</Title>

                                {/* Image Upload */}
                                <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                    <Text size="sm" fw={500} mb="sm" c="white">Upload Image</Text>
                                    <FileButton onChange={handleImageUpload} accept="image/png,image/jpeg,image/webp">
                                        {(props) => (
                                            <Box
                                                {...props}
                                                style={{
                                                    width: '100%',
                                                    height: '180px',
                                                    backgroundColor: '#1a1a1a',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '2px dashed #555',
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {imagePreview ? (
                                                    <img 
                                                        src={imagePreview} 
                                                        alt="Uploaded" 
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '100%', 
                                                            objectFit: 'contain' 
                                                        }} 
                                                    />
                                                ) : (
                                                    <Stack align="center" gap="sm">
                                                        <IconUpload size={48} color="#4a7aba" />
                                                        <Text c="#4a7aba" size="md" fw={500}>Click to Upload Image</Text>
                                                        <Text c="dimmed" size="xs">PNG, JPG, or WEBP</Text>
                                                    </Stack>
                                                )}
                                            </Box>
                                        )}
                                    </FileButton>
                                </Card>

                                {/* Mode Selection */}
                                <Box>
                                    <Text size="sm" fw={500} mb="sm" c="white">Mode</Text>
                                    <Group gap="md">
                                        {[
                                            { value: 'Undress', label: 'Undress', image: '/undress/Undress.webp' },
                                            { value: 'X-ray', label: 'X-ray', image: '/undress/X-ray.webp' },
                                            { value: 'Bikini', label: 'Bikini', image: '/undress/Bikini.webp' },
                                            { value: 'Lingerie', label: 'Lingerie', image: '/undress/Lingerie.webp' },
                                            { value: 'Shibari', label: 'Shibari', image: '/undress/Shibari.webp' },
                                        ].map((mode) => {
                                            return (
                                                <Stack key={mode.value} align="center" gap={4}>
                                                    <Box
                                                        onClick={() => setSelectedMode(mode.value)}
                                                        style={{
                                                            backgroundColor: '#1a1a1a',
                                                            border: selectedMode === mode.value ? '3px solid #4a8aca' : '1px solid #333',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            width: '80px',
                                                            height: '60px',
                                                            overflow: 'hidden',
                                                            borderRadius: '16px',
                                                        }}
                                                    >
                                                        <img
                                                            src={mode.image}
                                                            alt={mode.label}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                display: 'block',
                                                            }}
                                                        />
                                                    </Box>
                                                    <Text size="xs" fw={500} c={selectedMode === mode.value ? 'white' : 'dimmed'}>
                                                        {mode.label}
                                                    </Text>
                                                </Stack>
                                            );
                                        })}
                                    </Group>
                                </Box>

                                {/* Custom Settings */}
                                <Accordion variant="contained">
                                    <Accordion.Item value="custom-settings">
                                        <Accordion.Control>Custom Settings</Accordion.Control>
                                        <Accordion.Panel>
                                            <Stack gap="md">
                                                {/* Breast Size */}
                                                <Box>
                                                    <Text size="sm" fw={500} mb="sm" c="white">Breast Size (optional)</Text>
                                                    <Group gap="md">
                                                        {[
                                                            { value: 'small', label: 'Small' },
                                                            { value: 'medium', label: 'Medium' },
                                                            { value: 'large', label: 'Large' },
                                                            { value: 'huge', label: 'Huge' },
                                                        ].map((option) => {
                                                            return (
                                                                <Stack key={option.value} align="center" gap={4}>
                                                                    <Box
                                                                        onClick={() => setBreastSize(option.value)}
                                                                        style={{
                                                                            backgroundColor: '#1a1a1a',
                                                                            border: breastSize === option.value ? '3px solid #4a8aca' : '1px solid #333',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s',
                                                                            width: '80px',
                                                                            height: '60px',
                                                                            overflow: 'hidden',
                                                                            borderRadius: '12px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                        }}
                                                                    >
                                                                        <Text size="xs" c="dimmed">{option.label}</Text>
                                                                    </Box>
                                                                    <Text size="xs" fw={500} c={breastSize === option.value ? 'white' : 'dimmed'}>
                                                                        {option.label}
                                                                    </Text>
                                                                </Stack>
                                                            );
                                                        })}
                                                    </Group>
                                                </Box>

                                                {/* Pussy Haircut */}
                                                <Box>
                                                    <Text size="sm" fw={500} mb="sm" c="white">Pussy Haircut (optional)</Text>
                                                    <Group gap="md">
                                                        {[
                                                            { value: 'shaved', label: 'Shaved' },
                                                            { value: 'trimmed', label: 'Trimmed' },
                                                            { value: 'bush', label: 'Bush' },
                                                        ].map((option) => {
                                                            return (
                                                                <Stack key={option.value} align="center" gap={4}>
                                                                    <Box
                                                                        onClick={() => setPussyHaircut(option.value)}
                                                                        style={{
                                                                            backgroundColor: '#1a1a1a',
                                                                            border: pussyHaircut === option.value ? '3px solid #4a8aca' : '1px solid #333',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s',
                                                                            width: '80px',
                                                                            height: '60px',
                                                                            overflow: 'hidden',
                                                                            borderRadius: '12px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                        }}
                                                                    >
                                                                        <Text size="xs" c="dimmed">{option.label}</Text>
                                                                    </Box>
                                                                    <Text size="xs" fw={500} c={pussyHaircut === option.value ? 'white' : 'dimmed'}>
                                                                        {option.label}
                                                                    </Text>
                                                                </Stack>
                                                            );
                                                        })}
                                                    </Group>
                                                </Box>

                                                {/* Body Type */}
                                                <Box>
                                                    <Text size="sm" fw={500} mb="sm" c="white">Body Type (optional)</Text>
                                                    <Group gap="md">
                                                        {[
                                                            { value: 'slim', label: 'Slim' },
                                                            { value: 'athletic', label: 'Athletic' },
                                                            { value: 'curvy', label: 'Curvy' },
                                                        ].map((option) => {
                                                            return (
                                                                <Stack key={option.value} align="center" gap={4}>
                                                                    <Box
                                                                        onClick={() => setBodyType(option.value)}
                                                                        style={{
                                                                            backgroundColor: '#1a1a1a',
                                                                            border: bodyType === option.value ? '3px solid #4a8aca' : '1px solid #333',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s',
                                                                            width: '80px',
                                                                            height: '60px',
                                                                            overflow: 'hidden',
                                                                            borderRadius: '12px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                        }}
                                                                    >
                                                                        <Text size="xs" c="dimmed">{option.label}</Text>
                                                                    </Box>
                                                                    <Text size="xs" fw={500} c={bodyType === option.value ? 'white' : 'dimmed'}>
                                                                        {option.label}
                                                                    </Text>
                                                                </Stack>
                                                            );
                                                        })}
                                                    </Group>
                                                </Box>
                                            </Stack>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                </Accordion>

                                {/* Safety Notice */}
                                <Text size="sm" c="dimmed">
                                    We don't store your photo — feel free to use it safely.
                                </Text>

                                {/* Instructions */}
                                <Stack gap="xs">
                                    <Group gap="xs" align="flex-start">
                                        <Text size="sm" fw={500} c="white">1</Text>
                                        <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                                            Upload a full-body portrait photo, then click 'Generate' to start generating.
                                        </Text>
                                    </Group>
                                    <Group gap="xs" align="flex-start">
                                        <Text size="sm" fw={500} c="white">2</Text>
                                        <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                                            The more clearly the body is defined, the better the result.
                                        </Text>
                                    </Group>
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Undress Button - Sticky at bottom */}
                        <Button
                            fullWidth
                            size="lg"
                            disabled={loading || !uploadedImage}
                            onClick={handleUndress}
                            mt="md"
                            style={{ flexShrink: 0 }}
                        >
                            {loading ? 'Processing...' : 'Undress (Costs Tokens)'}
                        </Button>
                </Grid.Col>

                {/* Right Column - Output */}
                <Grid.Col span={{ base: 12, md: 4 }} style={{ height: '100vh', padding: '0.75rem', display: 'flex', flexDirection: 'column' }}>
                        <Stack gap="md" style={{ flex: 1, overflow: 'hidden' }}>
                            <Title size="h3" c="white">Result</Title>

                            {/* Current/Latest Image */}
                            <Card p="md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', flex: 1, minHeight: 0 }}>
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
                                    {loading ? (
                                        <Stack align="center" gap="sm">
                                            <IconPhoto size={64} color="#4a7aba" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                                            <Text c="#4a7aba" size="lg" fw={500}>Processing...</Text>
                                            <Text c="dimmed" size="sm">This may take a few moments</Text>
                                        </Stack>
                                    ) : !latestJob ? (
                                        <Stack align="center" gap="sm">
                                            <IconPhoto size={64} color="#666" />
                                            <Text c="dimmed" size="lg">No results yet</Text>
                                            <Text c="dimmed" size="sm">Your result will appear here</Text>
                                        </Stack>
                                    ) : (
                                        <Image
                                            src={latestJob.imageUrls[0].privateUrl}
                                            alt="Latest result"
                                            fit="contain"
                                            style={{ 
                                                width: '100%', 
                                                height: '100%',
                                                filter: `blur(${imageBlur}px)`,
                                                transition: 'none'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Card>

                            {/* Previous Results */}
                            {previousJobs.length > 0 && (
                                <>
                                    <Text size="sm" fw={500} c="white" mb={2}>Previously Generated Images</Text>
                                    <Box style={{ border: '1px solid #333', borderRadius: '6px', padding: '8px', backgroundColor: '#0a0a0a', flexShrink: 0 }}>
                                        <ScrollArea type="scroll" offsetScrollbars scrollbarSize={8}>
                                            <Group gap="xs" wrap="nowrap">
                                                {previousJobs.map((job, index) => (
                                                    <Box
                                                        key={job.id}
                                                        style={{
                                                            minWidth: '80px',
                                                            maxWidth: '80px',
                                                            height: '80px',
                                                            backgroundColor: '#1a1a1a',
                                                            borderRadius: '6px',
                                                            overflow: 'hidden',
                                                            border: '1px solid #333',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Image
                                                            src={job.imageUrls[0].privateUrl}
                                                            alt={`Result ${index + 2}`}
                                                            fit="cover"
                                                            style={{ width: '100%', height: '100%' }}
                                                        />
                                                    </Box>
                                                ))}
                                            </Group>
                                        </ScrollArea>
                                    </Box>
                                </>
                            )}
                        </Stack>
                </Grid.Col>
            </Grid>
        </Box>
    );
}
