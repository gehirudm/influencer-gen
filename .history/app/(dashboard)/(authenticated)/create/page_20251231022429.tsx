"use client"

import { useState } from 'react';
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
    SimpleGrid
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { aspectRatios } from '@/components/ImageGenerationForm/ImageGenerationForm';
import { useCharacters } from '@/hooks/useUserCharacters';
import { useUserJobs } from '@/hooks/useUserJobs';
import { IconPhoto } from '@tabler/icons-react';

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
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [useCharacter, setUseCharacter] = useState(true);
    const [selectedCharacter, setSelectedCharacter] = useState<string | null>('premade-1');
    const [selectedReference, setSelectedReference] = useState<string | null>(null);
    const [imageBlur, setImageBlur] = useState(0);

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

    // Reference image placeholders
    const referenceImages = [
        { id: 'ref-1', name: 'Bathroom Mirror Selfie', image: '/character/premade characters/reference images/bathroom mirror selfie/0.webp', folder: 'bathroom mirror selfie' },
        { id: 'ref-2', name: 'Spiderman cosplay', image: '/character/premade characters/reference images/spiderman cosplay/0.webp', folder: 'spiderman cosplay' },
        { id: 'ref-3', name: 'Balcony at sunset', image: '/character/premade characters/reference images/balcony at sunset/0.webp', folder: 'balcony at sunset' },
        { id: 'ref-4', name: 'Yellow bikini', image: '/character/premade characters/reference images/Yellow bikini/0.webp', folder: 'Yellow bikini' },
        { id: 'ref-5', name: 'Kneeling', image: '/character/premade characters/reference images/kneeling/0.webp', folder: 'kneeling' },
        { id: 'ref-6', name: 'Naked in bathtub', image: '/character/premade characters/reference images/Naked in bathtub/0.webp', folder: 'naked in bathtub' },
        { id: 'ref-7', name: 'School-style', image: '/character/premade characters/reference images/school-style/0.webp', folder: 'school-style' },
        { id: 'ref-8', name: 'Blowing a kiss', image: '/character/premade characters/reference images/blowing a kiss/0.webp', folder: 'blowing a kiss' },
        { id: 'ref-9', name: 'Gym fitness pose', image: '/character/premade characters/reference images/gym fitness pose/0.webp', folder: 'gym fitness pose' },
        { id: 'ref-10', name: 'Picnic lifestyle', image: '/character/premade characters/reference images/picnic lifestyle/0.webp', folder: 'picnic lifestyle' },
    ];

    const allCharacters = [...characters, ...premadeCharacters];

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
                            privateUrl: `/character/premade characters/reference images/${selectedRef.folder}/${imageNumber}.webp`,
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
        <Container size="xl" py={{ base: 'md', md: 'xl' }}>
            <Grid gutter="md">
                {/* Left Column - Input Data */}
                <Grid.Col span={{ base: 12, md: 8 }} style={{ height: 'calc(100vh - 120px)' }}>
                <Card p="lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <ScrollArea 
                        style={{ flex: 1, marginBottom: '1rem' }} 
                        scrollbarSize={10}
                        offsetScrollbars
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
                    <Stack gap="md" pr="md">
                        <Title size="h3" c="white">Generate Image</Title>

                        {/* Character Toggle */}
                        <Switch
                            label="Use Character"
                            description="Character selection is required"
                            checked={useCharacter}
                            onChange={(event) => setUseCharacter(event.currentTarget.checked)}
                            size="md"
                            disabled
                        />

                        {/* Character Selection */}
                        <Card p="md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}>
                            <Text size="sm" fw={500} mb="sm" c="white">Select a Character</Text>
                            {charactersLoading && (
                                <Text size="sm" c="dimmed">Loading characters...</Text>
                            )}
                            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="xs">
                                {allCharacters.map((character) => (
                                    <Card
                                        key={character.id}
                                        p="sm"
                                        style={{
                                            backgroundColor: selectedCharacter === character.id ? '#3a5a8a' : '#333',
                                            border: selectedCharacter === character.id ? '2px solid #4a7aba' : '1px solid #555',
                                            cursor: 'pointer',
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
                            </SimpleGrid>
                        </Card>

                        {/* Reference Image Selection */}
                        <Card p="md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}>
                            <Text size="sm" fw={500} mb="sm" c="white">Reference Image Style</Text>
                            <Text size="xs" c="dimmed" mb="sm">Choose a visual style for your generation</Text>
                            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="xs">
                                {referenceImages.map((ref) => (
                                    <Card
                                        key={ref.id}
                                        p="sm"
                                        style={{
                                            backgroundColor: selectedReference === ref.id ? '#3a5a8a' : '#333',
                                            border: selectedReference === ref.id ? '2px solid #4a7aba' : '1px solid #555',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setSelectedReference(ref.id)}
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
                                                    src={ref.image} 
                                                    alt={ref.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </Box>
                                            <Text size="xs" fw={600} c="white" ta="center" lineClamp={1}>
                                                {ref.name}
                                            </Text>
                                        </Stack>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        </Card>

                        {/* Image Prompt */}
                        <Textarea
                            label="Image Prompt"
                            placeholder="Describe the image you want to generate..."
                            minRows={4}
                            {...form.getInputProps('prompt')}
                            disabled
                            styles={{ input: { opacity: 0.6 } }}
                        />

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
                    </ScrollArea>
                    
                    {/* Generate Button - Sticky at bottom */}
                    <Button
                        fullWidth
                        size="lg"
                        disabled={loading}
                        onClick={handleGenerate}
                    >
                        Generate (Costs Tokens)
                    </Button>
                </Card>
            </Grid.Col>

                {/* Right Column - Output */}
                <Grid.Col span={{ base: 12, md: 4 }} style={{ height: 'calc(100vh - 120px)' }}>
                <Card p="lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Stack gap="md" pb="md">
                        <Title size="h3" c="white">Generated Images</Title>

                        {/* Current/Latest Image */}
                        <Card p="md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}>
                            <Box
                                style={{
                                    width: '100%',
                                    aspectRatio: '3/4',
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
                                <Title size="h4" c="white" mt="md">Previous Images</Title>
                                <ScrollArea h={500}>
                                    <Stack gap="md">
                                        {previousJobs.map((job, index) => (
                                            <Card key={job.id} p="md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}>
                                                <Image
                                                    src={job.imageUrls[0].privateUrl}
                                                    alt={`Generated image ${index + 2}`}
                                                    fit="contain"
                                                    style={{ width: '100%', maxHeight: 400 }}
                                                />
                                                {job.metadata?.prompt && (
                                                    <Text size="sm" c="dimmed" mt="sm" lineClamp={2}>
                                                        {job.metadata.prompt}
                                                    </Text>
                                                )}
                                            </Card>
                                        ))}
                                    </Stack>
                                </ScrollArea>
                            </>
                        )}
                    </Stack>
                </Card>
                </Grid.Col>
            </Grid>
        </Container>
    );
}