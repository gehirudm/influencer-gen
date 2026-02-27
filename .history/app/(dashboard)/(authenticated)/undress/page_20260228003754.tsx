"use client"

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@mantine/hooks';
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
    ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { useUserJobs } from '@/hooks/useUserJobs';
import { IconPhoto, IconUpload, IconShirt, IconEye, IconSwimming, IconHanger, IconLink, IconCrown } from '@tabler/icons-react';

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
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [loading, setLoading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBlur, setImageBlur] = useState(0);
    const [selectedMode, setSelectedMode] = useState('Undress');
    const [breastSize, setBreastSize] = useState<string | null>(null);
    const [pussyHaircut, setPussyHaircut] = useState<string | null>(null);
    const [bodyType, setBodyType] = useState<string | null>(null);
    const [showExample, setShowExample] = useState(false);
    const [exampleProgress, setExampleProgress] = useState(0);
    const [exampleLoop, setExampleLoop] = useState(0);
    const [exampleOpacity, setExampleOpacity] = useState(0);
    const [scanDirection, setScanDirection] = useState<'down' | 'up'>('down');

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

    // Example animation effect
    useEffect(() => {
        // Wait 0.5 seconds after page load, then fade in over 1.5 seconds
        const initialTimer = setTimeout(() => {
            setShowExample(true);
            // Fade in over 1.5 seconds
            let fadeProgress = 0;
            const fadeInterval = setInterval(() => {
                fadeProgress += 0.05;
                setExampleOpacity(Math.min(fadeProgress, 1));
                if (fadeProgress >= 1) {
                    clearInterval(fadeInterval);
                    // Start animation after fade in
                    setExampleLoop(1);
                    setScanDirection('down');
                }
            }, 75);
        }, 500);

        return () => clearTimeout(initialTimer);
    }, []);

    useEffect(() => {
        if (exampleLoop > 0 && exampleLoop <= 2) {
            // Animate progress over 3 seconds
            const duration = 3000;
            const steps = 60;
            const stepDuration = duration / steps;
            let currentStep = 0;

            const interval = setInterval(() => {
                currentStep++;
                const progress = (currentStep / steps) * 100;
                
                if (scanDirection === 'down') {
                    setExampleProgress(progress);
                } else {
                    setExampleProgress(100 - progress);
                }

                if (currentStep >= steps) {
                    clearInterval(interval);
                    
                    if (scanDirection === 'down') {
                        // Switch to up direction
                        setTimeout(() => {
                            setScanDirection('up');
                        }, 300);
                    } else {
                        // Completed up direction
                        if (exampleLoop < 2) {
                            // Start next loop
                            setTimeout(() => {
                                setScanDirection('down');
                                setExampleLoop(exampleLoop + 1);
                            }, 300);
                        } else {
                            // Fade out over 1.5 seconds after second loop
                            setTimeout(() => {
                                let fadeProgress = 1;
                                const fadeInterval = setInterval(() => {
                                    fadeProgress -= 0.05;
                                    setExampleOpacity(Math.max(fadeProgress, 0));
                                    if (fadeProgress <= 0) {
                                        clearInterval(fadeInterval);
                                        setShowExample(false);
                                        setExampleProgress(0);
                                        setExampleLoop(0);
                                        setScanDirection('down');
                                    }
                                }, 75);
                            }, 500);
                        }
                    }
                }
            }, stepDuration);

            return () => clearInterval(interval);
        }
    }, [exampleLoop, scanDirection]);

    // Get completed jobs with images
    const completedJobs = userJobs.filter(job => job.status === 'completed' && job.imageUrls && job.imageUrls.length > 0);
    const latestJob = completedJobs[0];
    const previousJobs = completedJobs.slice(1);

    return (
        <Box style={{ height: '100%', width: '100%' }} pt={{ base: 'sm', md: 0 }}>
            <Grid gutter="xs" style={{ margin: 0, height: '100%' }}>
                {/* Left Column - Input Data */}
                <Grid.Col span={{ base: 12, md: 8 }} style={{ height: isMobile ? 'auto' : 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', padding: isMobile ? '0.25rem 0.15rem' : '0.75rem' }}>
                        {/* Scrollable Content */}
                        <Box style={{ flex: isMobile ? undefined : 1, overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? 0 : '8px' }}>
                            <Stack gap="md" px={isMobile ? 'sm' : 0}>
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
                                                            { value: 'small', label: 'Small', image: '/undress/breast size/Small.webp' },
                                                            { value: 'medium', label: 'Medium', image: '/undress/breast size/Medium.webp' },
                                                            { value: 'large', label: 'Large', image: '/undress/breast size/Large.webp' },
                                                            { value: 'huge', label: 'Huge', image: '/undress/breast size/Huge.webp' },
                                                        ].map((option) => {
                                                            return (
                                                                <Stack key={option.value} align="center" gap={4}>
                                                                    <Box
                                                                        onClick={() => setBreastSize(breastSize === option.value ? null : option.value)}
                                                                        style={{
                                                                            backgroundColor: '#1a1a1a',
                                                                            border: breastSize === option.value ? '3px solid #4a8aca' : '1px solid #333',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s',
                                                                            width: '80px',
                                                                            height: '60px',
                                                                            overflow: 'hidden',
                                                                            borderRadius: '12px',
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={option.image}
                                                                            alt={option.label}
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover',
                                                                                display: 'block',
                                                                            }}
                                                                        />
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
                                                            { value: 'shaved', label: 'Shaved', image: '/undress/pussy haircut/Shaved.webp' },
                                                            { value: 'trimmed', label: 'Trimmed', image: '/undress/pussy haircut/Haired.webp' },
                                                            { value: 'bush', label: 'Bush', image: '/undress/pussy haircut/Bush.webp' },
                                                        ].map((option) => {
                                                            return (
                                                                <Stack key={option.value} align="center" gap={4}>
                                                                    <Box
                                                                        onClick={() => setPussyHaircut(pussyHaircut === option.value ? null : option.value)}
                                                                        style={{
                                                                            backgroundColor: '#1a1a1a',
                                                                            border: pussyHaircut === option.value ? '3px solid #4a8aca' : '1px solid #333',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s',
                                                                            width: '80px',
                                                                            height: '60px',
                                                                            overflow: 'hidden',
                                                                            borderRadius: '12px',
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={option.image}
                                                                            alt={option.label}
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover',
                                                                                display: 'block',
                                                                            }}
                                                                        />
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
                                                            { value: 'slim', label: 'Slim', image: '/undress/body type/Slim.webp' },
                                                            { value: 'athletic', label: 'Athletic', image: '/undress/body type/Athletic.webp' },
                                                            { value: 'curvy', label: 'Curvy', image: '/undress/body type/Curvy.webp' },
                                                        ].map((option) => {
                                                            return (
                                                                <Stack key={option.value} align="center" gap={4}>
                                                                    <Box
                                                                        onClick={() => setBodyType(bodyType === option.value ? null : option.value)}
                                                                        style={{
                                                                            backgroundColor: '#1a1a1a',
                                                                            border: bodyType === option.value ? '3px solid #4a8aca' : '1px solid #333',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.2s',
                                                                            width: '80px',
                                                                            height: '60px',
                                                                            overflow: 'hidden',
                                                                            borderRadius: '12px',
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={option.image}
                                                                            alt={option.label}
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover',
                                                                                display: 'block',
                                                                            }}
                                                                        />
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
                        <Box px={isMobile ? 'sm' : 0}>
                        <Button
                            fullWidth
                            size="lg"
                            disabled={loading || !uploadedImage}
                            onClick={handleUndress}
                            mt="md"
                            style={{ flexShrink: 0 }}
                            leftSection={<IconCrown size={20} color="#FFD700" />}
                        >
                            {loading ? 'Processing...' : 'Undress (Costs Tokens)'}
                        </Button>
                        </Box>
                </Grid.Col>

                {/* Right Column - Output */}
                <Grid.Col span={{ base: 12, md: 4 }} style={{ height: isMobile ? 'auto' : 'calc(100vh - 40px)', padding: isMobile ? '0.25rem 0.15rem' : '0.75rem', display: 'flex', flexDirection: 'column' }}>
                        <Stack gap="md" px={isMobile ? 'sm' : 0} style={{ flex: 1, overflow: 'hidden' }}>
                            {/* Current/Latest Image */}
                            <Card p="md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', flex: isMobile ? undefined : 1, minHeight: isMobile ? '200px' : 0, maxHeight: isMobile ? '260px' : undefined }}>
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
                                            <IconPhoto size={64} color="#4a7aba" style={isMobile ? undefined : { animation: 'pulse 1.5s ease-in-out infinite' }} />
                                            <Text c="#4a7aba" size="lg" fw={500}>Processing...</Text>
                                            <Text c="dimmed" size="sm">This may take a few moments</Text>
                                        </Stack>
                                    ) : !latestJob ? (
                                        (!isMobile && showExample) ? (
                                            <Box style={{ position: 'relative', width: '100%', height: '100%', opacity: exampleOpacity, transition: 'none' }}>
                                                {/* Base image */}
                                                <img
                                                    src="/undress/example.webp"
                                                    alt="Example"
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain',
                                                    }}
                                                />
                                                {/* Transformed image with clip */}
                                                <img
                                                    src="/undress/example-undressed.webp"
                                                    alt="Example undressed"
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain',
                                                        clipPath: `inset(0 0 ${100 - exampleProgress}% 0)`,
                                                    }}
                                                />
                                                {/* Glowing scan line */}
                                                <Box
                                                    style={{
                                                        position: 'absolute',
                                                        top: `${exampleProgress}%`,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '4px',
                                                        background: 'linear-gradient(to bottom, transparent, #4a8aca, #4a8aca, transparent)',
                                                        boxShadow: '0 0 20px 5px rgba(74, 138, 202, 0.8)',
                                                        transform: 'translateY(-50%)',
                                                    }}
                                                />
                                            </Box>
                                        ) : (
                                            <Stack align="center" gap="sm">
                                                <IconPhoto size={64} color="#666" />
                                                <Text c="dimmed" size="lg">No results yet</Text>
                                                <Text c="dimmed" size="sm">Your result will appear here</Text>
                                            </Stack>
                                        )
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
