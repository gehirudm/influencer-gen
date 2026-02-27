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
    Box,
    Text,
    ScrollArea,
    Group,
    Image,
    SimpleGrid,
    Accordion,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { aspectRatios } from '@/components/ImageGenerationForm/ImageGenerationForm';
import { IconPhoto, IconCrown, IconChevronLeft, IconChevronRight, IconCheck } from '@tabler/icons-react';
import app from '@/lib/firebase';
import { useUserData } from '@/hooks/useUserData';

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

export default function ImageGeneratorFreePage() {
    const form = useForm({
        initialValues: {
            prompt: 'Generate image with selected character and reference style',
            negative_prompt: '',
            aspectRatio: 'portrait',
            steps: 30,
            cfg_scale: 7,
            seed: '',
        },
    });

    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { systemData, loading: userDataLoading } = useUserData();

    const [loading, setLoading] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState<string | null>('premade-1');
    const [selectedReference, setSelectedReference] = useState<string | null>(null);
    const [imageBlur, setImageBlur] = useState(0);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [previousImages, setPreviousImages] = useState<string[]>([]);
    const refScrollRef = useRef<HTMLDivElement>(null);
    const charScrollRef = useRef<HTMLDivElement>(null);
    const isPromptSetByRef = useRef(false);

    // Reference images sorted alphabetically, free and premium mixed
    const referenceImages = [
        { id: 'balcony-at-sunset', name: 'Balcony at sunset', image: '/character/premade characters/reference images/Balcony at sunset/0.webp', folder: '/character/premade characters/reference images/Balcony at sunset' },
        { id: 'bathroom-mirror-selfie', name: 'Bathroom mirror selfie', image: '/character/premade characters/reference images/bathroom mirror selfie/0.webp', folder: '/character/premade characters/reference images/bathroom mirror selfie' },
        { id: 'blowing-a-kiss', name: 'Blowing a kiss', image: '/character/premade characters/reference images/Blowing a kiss/0.webp', folder: '/character/premade characters/reference images/Blowing a kiss' },
        { id: 'cop-girl-cosplay', name: 'Cop girl cosplay', image: '/character/premade characters/reference images/Premium-reference-img/cop girl cosplay 2.webp', folder: '', premium: true },
        { id: 'countertop-arch-pose', name: 'Countertop Arch Pose', image: '/character/premade characters/reference images/Premium-reference-img/Countertop Arch Pose.webp', folder: '', premium: true },
        { id: 'gym-fitness-pose', name: 'Gym fitness pose', image: '/character/premade characters/reference images/Gym fitness pose/0.webp', folder: '/character/premade characters/reference images/Gym fitness pose' },
        { id: 'holding-chest', name: 'Holding chest', image: '/character/premade characters/reference images/Premium-reference-img/holding chest.webp', folder: '', premium: true },
        { id: 'kneeling', name: 'Kneeling', image: '/character/premade characters/reference images/Kneeling/0.webp', folder: '/character/premade characters/reference images/Kneeling' },
        { id: 'kneeling-couch-lean', name: 'Kneeling Couch Lean', image: '/character/premade characters/reference images/Premium-reference-img/Kneeling Couch Lean.webp', folder: '', premium: true },
        { id: 'leaning-forward', name: 'Leaning forward', image: '/character/premade characters/reference images/Premium-reference-img/leaning forward.webp', folder: '', premium: true },
        { id: 'lying-on-beach', name: 'Lying on beach', image: '/character/premade characters/reference images/Premium-reference-img/lying on beach.webp', folder: '', premium: true },
        { id: 'naked-in-bathtub', name: 'Naked in bathtub', image: '/character/premade characters/reference images/Naked in bathtub/0.webp', folder: '/character/premade characters/reference images/Naked in bathtub' },
        { id: 'naked-tongue-out', name: 'Naked tongue out', image: '/character/premade characters/reference images/Premium-reference-img/naked tongue out.webp', folder: '', premium: true },
        { id: 'picnic-lifestyle', name: 'Picnic lifestyle', image: '/character/premade characters/reference images/Picnic lifestyle/0.webp', folder: '/character/premade characters/reference images/Picnic lifestyle' },
        { id: 'pregnant-pose', name: 'Pregnant pose', image: '/character/premade characters/reference images/Premium-reference-img/pregnant pose.webp', folder: '', premium: true },
        { id: 'santa-outfit', name: 'Santa outfit', image: '/character/premade characters/reference images/Premium-reference-img/santa outfit.webp', folder: '', premium: true },
        { id: 'school-style', name: 'School style', image: '/character/premade characters/reference images/School-style/0.webp', folder: '/character/premade characters/reference images/School-style' },
        { id: 'showing-feet', name: 'Showing feet', image: '/character/premade characters/reference images/Premium-reference-img/showing feet.webp', folder: '', premium: true },
        { id: 'spiderman-cosplay', name: 'Spiderman cosplay', image: '/character/premade characters/reference images/Spiderman cosplay/0.webp', folder: '/character/premade characters/reference images/Spiderman cosplay' },
        { id: 'tight-clothes', name: 'Tight clothes', image: '/character/premade characters/reference images/Premium-reference-img/tight clothes.webp', folder: '', premium: true },
        { id: 'velma-cosplay', name: 'Velma cosplay', image: '/character/premade characters/reference images/Premium-reference-img/velma cosplay.webp', folder: '', premium: true },
        { id: 'wearing-hijab', name: 'Wearing hijab', image: '/character/premade characters/reference images/Premium-reference-img/wearing hijab.webp', folder: '', premium: true },
        { id: 'yellow-bikini', name: 'Yellow bikini', image: '/character/premade characters/reference images/Yellow bikini/0.webp', folder: '/character/premade characters/reference images/Yellow bikini' },
        { id: 'yoga', name: 'Yoga', image: '/character/premade characters/reference images/Premium-reference-img/yoga.webp', folder: '', premium: true },
    ];

    // Redirect paid/admin users to the full generation page
    useEffect(() => {
        if (!userDataLoading && systemData && (systemData.isPaidCustomer || systemData.isAdmin)) {
            router.replace('/generate-images');
        }
    }, [userDataLoading, systemData, router]);

    // Premade character placeholders
    const premadeCharacters = [
        {
            id: 'premade-1',
            name: 'Emily Carter',
            age: '19',
            image: '/character/premade characters/Emily Carter.webp',
            tags: ['College', 'Blonde', 'Cheerful']
        },
        {
            id: 'premade-2',
            name: 'Laura Bennett',
            age: '38',
            image: '/character/premade characters/Laura Bennett.webp',
            tags: ['Mature', 'Confident', 'Caring']
        },
        {
            id: 'premade-3',
            name: 'Aiko Tanaka',
            age: '20',
            image: '/character/premade characters/Aiko Tanaka.webp',
            tags: ['Anime', 'Energetic', 'Cute']
        },
        {
            id: 'premade-4',
            name: 'Raven Blackwood',
            age: '22',
            image: '/character/premade characters/Raven Blackwood.webp',
            tags: ['Goth', 'Aesthetic', 'Mysterious']
        },
        {
            id: 'premade-5',
            name: 'Nyla Monroe',
            age: '25',
            image: '/character/premade characters/Nyla Monroe.webp',
            tags: ['Elegant', 'Bold', 'Stylish']
        },
    ];

    // Map premade character id to image number (1-5)
    const getPremadeCharacterImageNumber = (characterId: string): string | null => {
        const mapping: { [key: string]: string } = {
            'premade-1': '1',
            'premade-2': '2',
            'premade-3': '3',
            'premade-4': '4',
            'premade-5': '5',
        };
        return mapping[characterId] || null;
    };

    // Scroll functions for characters
    const scrollCharLeft = () => charScrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
    const scrollCharRight = () => charScrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

    // Scroll functions for reference images
    const scrollRefLeft = () => refScrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
    const scrollRefRight = () => refScrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' });

    const handleGenerate = async () => {
        if (!selectedCharacter || !selectedReference) {
            notifications.show({
                title: 'Selection Required',
                message: 'Please select both a character and a reference image style',
                color: 'orange'
            });
            return;
        }

        const imageNumber = getPremadeCharacterImageNumber(selectedCharacter);
        const selectedRef = referenceImages.find(ref => ref.id === selectedReference);

        if (!imageNumber || !selectedRef) return;

        setLoading(true);

        // Deduct 40 tokens via API
        try {
            const response = await fetch('/api/generate/deduct-tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

            if (response.status === 402) {
                const data = await response.json();
                notifications.show({
                    title: 'Insufficient Tokens',
                    message: data.error || 'You do not have enough tokens to generate an image.',
                    color: 'red'
                });
                setLoading(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to deduct tokens');
            }
        } catch (error: any) {
            console.error('Token deduction error:', error);
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to process generation',
                color: 'red'
            });
            setLoading(false);
            return;
        }

        // Build the character-specific result path from the folder
        // e.g. "/character/premade characters/reference images/Kneeling/1.webp"
        const resultImage = `${selectedRef.folder}/${imageNumber}.webp`;

        // Random loading time between 8-15 seconds for realistic feel
        const randomLoadingTime = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;

        setTimeout(() => {
            // Push current generated image to previous list
            if (generatedImage) {
                setPreviousImages(prev => [generatedImage, ...prev]);
            }

            setGeneratedImage(resultImage);
            setLoading(false);

            // Blur reveal effect
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
                color: 'green',
                icon: <IconCheck size={16} />
            });
        }, randomLoadingTime);
    };

    return (
        <Box style={{ height: '100%', width: '100%' }} pt={{ base: 'sm', md: 0 }}>
            <Grid gutter="xs" style={{ margin: 0, height: '100%' }}>
                {/* Left Column - Input */}
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
                                            {premadeCharacters.map((character) => (
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
                            disabled={loading}
                            onClick={handleGenerate}
                        >
                            {loading ? 'Generating...' : <span>Generate (<span style={{ color: '#FBBF24' }}>40</span> Tokens)</span>}
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
                                        <Text c="dimmed" size="sm">This may take a few moments</Text>
                                    </Stack>
                                ) : generatedImage ? (
                                    <Image
                                        src={generatedImage}
                                        alt="Generated image"
                                        fit="contain"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            filter: `blur(${imageBlur}px)`,
                                            transition: 'none'
                                        }}
                                    />
                                ) : (
                                    <Stack align="center" gap="sm">
                                        <IconPhoto size={64} color="#666" />
                                        <Text c="dimmed" size="lg">No images generated yet</Text>
                                        <Text c="dimmed" size="sm">Your generated image will appear here</Text>
                                    </Stack>
                                )}
                            </Box>
                        </Card>

                        {/* Previous Images */}
                        {previousImages.length > 0 && (
                            <>
                                <Text size="sm" fw={500} c="white" mb={2}>Previously Generated Images</Text>
                                <Box style={{ border: '1px solid #333', borderRadius: '6px', padding: '8px', backgroundColor: '#0a0a0a', flexShrink: 0 }}>
                                    <ScrollArea type="scroll" offsetScrollbars scrollbarSize={8}>
                                        <Group gap="xs" wrap="nowrap">
                                            {previousImages.map((img, index) => (
                                                <Box
                                                    key={`prev-${index}`}
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
                                                        src={img}
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
