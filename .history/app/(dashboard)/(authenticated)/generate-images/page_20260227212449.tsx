"use client"

import { useState, useRef, useEffect } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import {
    Grid,
    Card,
    Stack,
    Button,
    Textarea,
    NumberInput,
    TextInput,
    Switch,
    Box,
    Text,
    Title,
    ScrollArea,
    Group,
    Badge,
    Image,
    Container,
    SimpleGrid,
    Accordion
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { aspectRatios } from '@/components/ImageGenerationForm/ImageGenerationForm';
import { useCharacters } from '@/hooks/useUserCharacters';
import { useUserJobs } from '@/hooks/useUserJobs';
import { useUserData } from '@/hooks/useUserData';
import { IconPhoto, IconCrown, IconChevronLeft, IconChevronRight, IconLock, IconUsers, IconCheck, IconAlertCircle, IconPlayerPlay, IconClock } from '@tabler/icons-react';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';

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

export default function ImageGeneratorPage() {
    const form = useForm({
        initialValues: {
            prompt: 'Generate image with selected character and reference style',
            negative_prompt: '',
            aspectRatio: 'portrait',
            steps: 30,
            cfg_scale: 7,
            seed: '',
        },
        validate: {
            steps: (value) => value < 1 || value > 100 ? 'Steps must be between 1 and 100' : null,
            cfg_scale: (value) => value < 1 || value > 20 ? 'CFG must be between 1 and 20' : null,
        }
    });

    const { characters, loading: charactersLoading } = useCharacters();
    const { jobs: userJobs } = useUserJobs();
    const { systemData, loading: userDataLoading } = useUserData();
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [loading, setLoading] = useState(false);
    const [useCharacter, setUseCharacter] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
    const [imageBlur, setImageBlur] = useState(0);
    const [marketplaceCharacters, setMarketplaceCharacters] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const charScrollRef = useRef<HTMLDivElement>(null);

    // Redirect free users to the free generation page
    useEffect(() => {
        if (!userDataLoading && systemData && !systemData.isPaidCustomer && !systemData.isAdmin) {
            router.replace('/generate-images-free');
        }
    }, [userDataLoading, systemData, router]);

    // LoRA generation state
    const [loraJobId, setLoraJobId] = useState<string | null>(null);
    const [loraJobStatus, setLoraJobStatus] = useState<string>('IDLE');
    const [loraJobOutput, setLoraJobOutput] = useState<any>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearTimeout(pollingRef.current);
            }
        };
    }, []);

    const pollLoraJobStatus = async (jobId: string) => {
        try {
            const response = await fetch(`/api/comfyui/status/${jobId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get job status');
            }

            setLoraJobStatus(data.status);

            if (data.status === 'IN_QUEUE' || data.status === 'IN_PROGRESS') {
                pollingRef.current = setTimeout(() => pollLoraJobStatus(jobId), 2000);
            } else if (data.status === 'COMPLETED') {
                setLoraJobOutput(data.output);
                setLoading(false);
                setImageBlur(50);
                setTimeout(() => {
                    setImageBlur(20);
                    setTimeout(() => {
                        setImageBlur(0);
                    }, 300);
                }, 300);
                notifications.show({
                    title: 'Generation Complete',
                    message: 'Your LoRA image has been generated successfully!',
                    color: 'green',
                    icon: <IconCheck size={16} />
                });
            } else if (data.status === 'FAILED') {
                setLoading(false);
                notifications.show({
                    title: 'Generation Failed',
                    message: data.error || 'An error occurred during generation',
                    color: 'red',
                    icon: <IconAlertCircle size={16} />
                });
            }
        } catch (error: any) {
            console.error('Polling error:', error);
            setLoraJobStatus('FAILED');
            setLoading(false);
        }
    };

    // Scroll functions for characters
    const scrollCharLeft = () => {
        if (charScrollRef.current) {
            charScrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
        }
    };

    const scrollCharRight = () => {
        if (charScrollRef.current) {
            charScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
        }
    };

    // Load marketplace purchased characters
    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!userId) return;

        let unsubscribe: (() => void) | undefined;

        try {
            const db = getFirestore(app);
            const charactersRef = collection(db, 'users', userId, 'characters');
            const q = query(charactersRef, orderBy('purchasedAt', 'desc'));

            unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const characterData: any[] = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data) {
                            characterData.push({
                                id: `marketplace-${data.characterId}`,
                                name: data.characterName,
                                image: data.characterImage,
                                age: 'N/A',
                                purchaseType: data.purchaseType,
                                loraUrl: data.loraUrl || '',
                                isMarketplace: true
                            });
                        }
                    });
                    setMarketplaceCharacters(characterData);
                },
                (error) => {
                    console.error('Error fetching marketplace characters:', error);
                    setMarketplaceCharacters([]);
                }
            );
        } catch (error) {
            console.error('Error setting up listener:', error);
            setMarketplaceCharacters([]);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userId]);

    // Map user characters to include an 'image' property for consistent rendering
    const mappedUserCharacters = characters.map(char => ({
        ...char,
        image: char.baseImageUrl || (char.imageUrls && char.imageUrls.length > 0 ? char.imageUrls[0] : '/placeholder.png'),
        age: char.age || char.ageRange || 'N/A'
    }));

    const allCharacters = [...mappedUserCharacters, ...marketplaceCharacters, ...premadeCharacters];

    // Get the selected character's LoRA URL (if it's a marketplace character)
    const getSelectedCharacterLoraUrl = (): string | null => {
        if (!selectedCharacter) return null;
        const character = allCharacters.find(c => c.id === selectedCharacter);
        return character?.loraUrl || null;
    };

    // Get dimensions based on selected aspect ratio
    const getDimensions = () => {
        const selected = aspectRatios.find(ratio => ratio.value === form.values.aspectRatio);
        return selected ? { width: selected.width, height: selected.height } : { width: 800, height: 1200 };
    };

    // Map premade character to bathroom selfie image number
    const getPremadeCharacterImageNumber = (characterId: string): string | null => {
        const mapping: { [key: string]: string } = {
            'premade-1': '1', // Emily Carter
            'premade-2': '2', // Laura Bennett
            'premade-3': '3', // Aiko Tanaka
            'premade-4': '4', // Raven Blackwood
            'premade-5': '5', // Nyla Monroe
        };
        return mapping[characterId] || null;
    };

    const handleGenerate = async () => {
        const validation = form.validate();
        if (validation.hasErrors) {
            return;
        }

        // Check if the selected character has a LoRA URL (marketplace character with LoRA)
        const loraUrl = getSelectedCharacterLoraUrl();

        if (loraUrl) {
            // Use LoRA/ComfyUI generation flow (costs 40 tokens)
            const promptText = form.values.prompt?.trim();
            if (!promptText) {
                notifications.show({
                    title: 'Validation Error',
                    message: 'Please enter an image prompt or select a reference image',
                    color: 'red'
                });
                return;
            }

            setLoading(true);
            setLoraJobId(null);
            setLoraJobStatus('IDLE');
            setLoraJobOutput(null);

            // Clear any existing polling
            if (pollingRef.current) {
                clearTimeout(pollingRef.current);
            }

            try {
                const response = await fetch('/api/comfyui/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: promptText,
                        negativePrompt: form.values.negative_prompt?.trim() || '',
                        loraUrl: loraUrl
                    })
                });

                if (response.status === 401) {
                    notifications.show({
                        title: 'Session Expired',
                        message: 'Please log in again to continue generating images.',
                        color: 'blue'
                    });
                    router.push('/auth');
                    setLoading(false);
                    return;
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to submit generation');
                }

                notifications.show({
                    title: 'Generation Started',
                    message: `LoRA generation submitted (40 tokens deducted). Processing...`,
                    color: 'blue',
                    icon: <IconPlayerPlay size={16} />
                });

                setLoraJobId(data.jobId);
                setLoraJobStatus(data.status || 'IN_QUEUE');

                // Start polling for status
                pollingRef.current = setTimeout(() => pollLoraJobStatus(data.jobId), 2000);

            } catch (error: any) {
                console.error('Error generating LoRA image:', error);
                notifications.show({
                    title: 'Error',
                    message: error.message || 'Failed to generate image',
                    color: 'red'
                });
                setLoading(false);
            }

            return;
        }

        // Check if using any reference image with premade character
        if (selectedReference && selectedCharacter && selectedCharacter.startsWith('premade-')) {
            const imageNumber = getPremadeCharacterImageNumber(selectedCharacter);
            const selectedRef = referenceImages.find(ref => ref.id === selectedReference);

            if (imageNumber && selectedRef) {
                setLoading(true);

                // Random loading time between 8-15 seconds
                const randomLoadingTime = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;

                setTimeout(() => {
                    const mockJob = {
                        id: `local-${Date.now()}`,
                        status: 'completed',
                        imageUrls: [{
                            privateUrl: selectedRef.image,
                            publicUrl: ''
                        }],
                        metadata: {
                            prompt: form.values.prompt || selectedRef.name,
                        }
                    };

                    // Add to jobs list (this will update the UI)
                    userJobs.unshift(mockJob as any);

                    setLoading(false);

                    // Start blur effect: 100% -> 20% -> 0%
                    setImageBlur(50);
                    setTimeout(() => {
                        setImageBlur(20);
                        setTimeout(() => {
                            setImageBlur(0);
                        }, 300);
                    }, 300);

                    notifications.show({
                        title: 'Success',
                        message: 'Image generated successfully!',
                        color: 'green'
                    });
                }, randomLoadingTime);

                return;
            }
        }

        const { width, height } = getDimensions();
        setLoading(true);

        try {
            const payload: any = {
                prompt: form.values.prompt,
                negative_prompt: form.values.negative_prompt || undefined,
                width,
                height,
                steps: form.values.steps,
                cfg_scale: form.values.cfg_scale,
                seed: form.values.seed ? Number(form.values.seed) : undefined,
                character_id: useCharacter && selectedCharacter ? selectedCharacter : undefined,
            };

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 401) {
                notifications.show({
                    title: 'Session Expired',
                    message: 'Please log in again to continue generating images.',
                    color: 'blue'
                });
                router.push('/auth');
                setLoading(false);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate image');
            }

            notifications.show({
                title: 'Success',
                message: 'Image generation started successfully!',
                color: 'green'
            });
        } catch (error: any) {
            console.error('Error generating image:', error);
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to generate image',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    // Get completed jobs with images
    const completedJobs = userJobs.filter(job => job.status === 'completed' && job.imageUrls && job.imageUrls.length > 0);
    const latestJob = completedJobs[0];
    const previousJobs = completedJobs.slice(1);

    return (
        <Box style={{ height: '100%', width: '100%' }} pt={{ base: 'sm', md: 0 }}>
            <Grid gutter="xs" style={{ margin: 0, height: '100%' }}>
                {/* Left Column - Input Data */}
                <Grid.Col span={{ base: 12, md: 8 }} style={{ height: isMobile ? 'auto' : 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', padding: isMobile ? '0.25rem 0.15rem' : '0.75rem' }}>
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
                                }
                            }
                        }}
                    >
                        <Stack gap={isMobile ? 'xs' : 'md'} pl={isMobile ? 'sm' : 0} pr={isMobile ? 'sm' : 'md'}>
                            {/* Character Selection */}
                            <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">Select a Character</Text>
                                {charactersLoading && (
                                    <Text size="sm" c="dimmed">Loading characters...</Text>
                                )}
                                <Box style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {/* Left Arrow */}
                                    <Box
                                        onClick={scrollCharLeft}
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <IconChevronLeft size={28} color="#4a7aba" />
                                    </Box>

                                    {/* Cards Container */}
                                    <Box
                                        ref={charScrollRef}
                                        style={{
                                            overflow: 'hidden',
                                            flex: 1,
                                        }}
                                    >
                                        <Group gap="xs" wrap="nowrap">
                                            {/* Create Your Own Character Card */}
                                            <Card
                                                p="sm"
                                                style={{
                                                    backgroundColor: '#2a2a2a',
                                                    border: '2px dashed #4a7aba',
                                                    cursor: 'pointer',
                                                    minWidth: isMobile ? 'calc((100% - 16px) / 3)' : 'calc((100% - 32px) / 5)',
                                                    maxWidth: isMobile ? 'calc((100% - 16px) / 3)' : 'calc((100% - 32px) / 5)',
                                                }}
                                                onClick={() => router.push('/dashboard/characters')}
                                            >
                                                <Stack gap="xs">
                                                    <Box
                                                        style={{
                                                            width: '100%',
                                                            aspectRatio: '3/4',
                                                            backgroundColor: '#1a1a1a',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: '1px solid #444',
                                                        }}
                                                    >
                                                        <Text size="2rem" c="#4a7aba">+</Text>
                                                    </Box>
                                                    <Text size="xs" fw={600} c="white" ta="center" lineClamp={1}>
                                                        Custom
                                                    </Text>
                                                </Stack>
                                            </Card>

                                            {allCharacters.map((character) => (
                                                <Card
                                                    key={character.id}
                                                    p="sm"
                                                    style={{
                                                        backgroundColor: selectedCharacter === character.id ? '#3a5a8a' : '#1a1a1a',
                                                        border: selectedCharacter === character.id ? '2px solid #4a7aba' : '1px solid #333',
                                                        cursor: 'pointer',
                                                        minWidth: isMobile ? 'calc((100% - 16px) / 3)' : 'calc((100% - 32px) / 5)',
                                                        maxWidth: isMobile ? 'calc((100% - 16px) / 3)' : 'calc((100% - 32px) / 5)',
                                                    }}
                                                    onClick={() => setSelectedCharacter(character.id)}
                                                >
                                                    <Stack gap="xs">
                                                        <Box
                                                            style={{
                                                                width: '100%',
                                                                aspectRatio: '3/4',
                                                                backgroundColor: '#2a2a2a',
                                                                borderRadius: '4px',
                                                                overflow: 'hidden',
                                                                position: 'relative',
                                                            }}
                                                        >
                                                            <img
                                                                src={character.image}
                                                                alt={character.name}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                            {character.isMarketplace && (
                                                                <Badge
                                                                    variant="filled"
                                                                    color={character.purchaseType === 'full_claim' ? 'violet' : 'blue'}
                                                                    size="xs"
                                                                    leftSection={character.purchaseType === 'full_claim' ? <IconLock size={10} /> : <IconUsers size={10} />}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '4px',
                                                                        left: '4px',
                                                                    }}
                                                                >
                                                                    {character.purchaseType === 'full_claim' ? 'Exclusive' : 'Licensed'}
                                                                </Badge>
                                                            )}
                                                        </Box>
                                                        <Text size="xs" fw={600} c="white" ta="center" lineClamp={1}>
                                                            {character.name} ({character.age})
                                                        </Text>
                                                    </Stack>
                                                </Card>
                                            ))}
                                        </Group>
                                    </Box>

                                    {/* Right Arrow */}
                                    <Box
                                        onClick={scrollCharRight}
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <IconChevronRight size={28} color="#4a7aba" />
                                    </Box>
                                </Box>
                            </Card>

                            {/* Reference Image Selection */}
                            <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">Reference Image Style</Text>
                                <Text size="xs" c="dimmed" mb="sm">Choose a visual style for your generation</Text>
                                <Box style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {/* Left Arrow */}
                                    <Box
                                        onClick={scrollRefLeft}
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <IconChevronLeft size={28} color="#4a7aba" />
                                    </Box>

                                    {/* Cards Container */}
                                    <Box
                                        ref={refScrollRef}
                                        style={{
                                            overflow: 'hidden',
                                            flex: 1,
                                        }}
                                    >
                                        <Group gap="xs" wrap="nowrap">
                                            {referenceImages.map((ref) => (
                                                <Card
                                                    key={ref.id}
                                                    p="sm"
                                                    style={{
                                                        backgroundColor: selectedReference === ref.id ? '#3a5a8a' : '#1a1a1a',
                                                        border: selectedReference === ref.id ? '2px solid #4a7aba' : '1px solid #333',
                                                        cursor: ref.premium ? 'not-allowed' : 'pointer',
                                                        opacity: ref.premium ? 0.6 : 1,
                                                        minWidth: isMobile ? 'calc((100% - 16px) / 3)' : 'calc((100% - 40px) / 6)',
                                                        maxWidth: isMobile ? 'calc((100% - 16px) / 3)' : 'calc((100% - 40px) / 6)',
                                                    }}
                                                    onClick={() => {
                                                        if (!ref.premium) {
                                                            setSelectedReference(ref.id);
                                                            isPromptSetByRef.current = true;
                                                            form.setFieldValue('prompt', ref.name);
                                                        }
                                                    }}
                                                >
                                                    <Stack gap="xs">
                                                        <Box
                                                            style={{
                                                                width: '100%',
                                                                aspectRatio: '3/4',
                                                                backgroundColor: '#2a2a2a',
                                                                borderRadius: '4px',
                                                                overflow: 'hidden',
                                                                position: 'relative',
                                                            }}
                                                        >
                                                            <img
                                                                src={ref.image}
                                                                alt={ref.name}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    transition: 'filter 0.2s ease, transform 0.3s ease',
                                                                }}
                                                                onMouseEnter={(e) => !ref.premium && (e.currentTarget.style.transform = 'scale(1.08)')}
                                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                            />
                                                            {ref.premium && (
                                                                <Box
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '8px',
                                                                        right: '8px',
                                                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                                        padding: '6px',
                                                                        borderRadius: '50%',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    <IconCrown size={20} color="#FFD700" />
                                                                </Box>
                                                            )}
                                                        </Box>
                                                        <Text size="xs" fw={600} c="white" ta="center" lineClamp={1}>
                                                            {ref.name}
                                                        </Text>
                                                    </Stack>
                                                </Card>
                                            ))}
                                        </Group>
                                    </Box>

                                    {/* Right Arrow */}
                                    <Box
                                        onClick={scrollRefRight}
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <IconChevronRight size={28} color="#4a7aba" />
                                    </Box>
                                </Box>
                            </Card>

                            {/* Image Prompt */}
                            <Textarea
                                label="Image Prompt"
                                placeholder="Describe the image you want to generate..."
                                minRows={4}
                                value={form.values.prompt}
                                onChange={(e) => {
                                    form.setFieldValue('prompt', e.currentTarget.value);
                                    // If the user is typing (not a programmatic fill), unselect the reference image
                                    if (!isPromptSetByRef.current) {
                                        setSelectedReference(null);
                                    }
                                    isPromptSetByRef.current = false;
                                }}
                                error={form.errors.prompt}
                            />

                            {/* Custom Settings Accordion */}
                            <Accordion variant="contained">
                                <Accordion.Item value="custom-settings" style={{ border: '1px solid #333', backgroundColor: '#0a0a0a' }}>
                                    <Accordion.Control style={{ color: 'white' }}>Custom Settings</Accordion.Control>
                                    <Accordion.Panel>
                                        <Stack gap="md">
                                            {/* Negative Prompt */}
                                            <Textarea
                                                label="Negative Prompt"
                                                placeholder="What you don't want in the image..."
                                                minRows={2}
                                                {...form.getInputProps('negative_prompt')}
                                                disabled
                                                styles={{ input: { opacity: 0.6 } }}
                                            />

                                            {/* Steps and CFG in one line */}
                                            <Group grow align="flex-start">
                                                <NumberInput
                                                    label="Steps"
                                                    description="Inference steps"
                                                    min={1}
                                                    max={100}
                                                    {...form.getInputProps('steps')}
                                                    disabled
                                                    styles={{ input: { opacity: 0.6 } }}
                                                />
                                                <NumberInput
                                                    label="CFG Scale"
                                                    description="Prompt adherence"
                                                    min={1}
                                                    max={20}
                                                    step={0.5}
                                                    decimalScale={1}
                                                    {...form.getInputProps('cfg_scale')}
                                                    disabled
                                                    styles={{ input: { opacity: 0.6 } }}
                                                />
                                            </Group>

                                            {/* Seed */}
                                            <TextInput
                                                label="Seed"
                                                placeholder="Leave empty for random"
                                                description="Use a specific seed for reproducible results"
                                                {...form.getInputProps('seed')}
                                                disabled
                                                styles={{ input: { opacity: 0.6 } }}
                                            />

                                            {/* Image Format (Aspect Ratio) - Card Selection */}
                                            <Box style={{ opacity: 0.6, pointerEvents: 'none' }}>
                                                <Text size="sm" fw={500} mb="xs" c="white">Image Format</Text>
                                                <Text size="xs" c="dimmed" mb="sm">Select the aspect ratio for the output image</Text>
                                                <SimpleGrid cols={4} spacing="xs">
                                                    {aspectRatios.map((ratio) => (
                                                        <Card
                                                            key={ratio.value}
                                                            p="sm"
                                                            style={{
                                                                backgroundColor: form.values.aspectRatio === ratio.value ? '#3a5a8a' : '#2a2a2a',
                                                                border: form.values.aspectRatio === ratio.value ? '2px solid #4a7aba' : '1px solid #444',
                                                                cursor: 'not-allowed',
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            <Text size="sm" fw={500} c="white">{ratio.label}</Text>
                                                            <Text size="xs" c="dimmed">{ratio.width}×{ratio.height}</Text>
                                                        </Card>
                                                    ))}
                                                </SimpleGrid>
                                            </Box>
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            </Accordion>
                        </Stack>
                    </ScrollArea>

                    {/* Generate Button - Sticky at bottom */}
                    <Box px={isMobile ? 'sm' : 0}>
                    <Button
                        fullWidth
                        size="lg"
                        disabled={loading || (loraJobStatus === 'IN_QUEUE' || loraJobStatus === 'IN_PROGRESS')}
                        onClick={handleGenerate}
                    >
                        {loading || loraJobStatus === 'IN_QUEUE' || loraJobStatus === 'IN_PROGRESS'
                            ? 'Generating...'
                            : getSelectedCharacterLoraUrl()
                                ? 'Generate with LoRA (40 Tokens)'
                                : 'Generate (Costs Tokens)'}
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
                                        <IconPhoto size={64} color="#4a7aba" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                                        <Text c="#4a7aba" size="lg" fw={500}>Generating...</Text>
                                        <Text c="dimmed" size="sm">
                                            {loraJobStatus === 'IN_QUEUE' ? 'Waiting in queue...' :
                                             loraJobStatus === 'IN_PROGRESS' ? 'Generating your LoRA image...' :
                                             'This may take a few moments'}
                                        </Text>
                                    </Stack>
                                ) : loraJobOutput?.images && loraJobOutput.images.length > 0 ? (
                                    <Image
                                        src={
                                            loraJobOutput.images[0].type === 'base64'
                                                ? `data:image/png;base64,${loraJobOutput.images[0].data}`
                                                : loraJobOutput.images[0].data
                                        }
                                        alt="LoRA generated image"
                                        fit="contain"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            filter: `blur(${imageBlur}px)`,
                                            transition: 'none'
                                        }}
                                    />
                                ) : !latestJob ? (
                                    <Stack align="center" gap="sm">
                                        <IconPhoto size={64} color="#666" />
                                        <Text c="dimmed" size="lg">No images generated yet</Text>
                                        <Text c="dimmed" size="sm">Your generated image will appear here</Text>
                                    </Stack>
                                ) : (
                                    <Image
                                        src={latestJob.imageUrls[0].privateUrl}
                                        alt="Latest generated image"
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

                        {/* Previous Images */}
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
                                                        alt={`Generated image ${index + 2}`}
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