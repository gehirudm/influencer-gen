"use client"

import {
    Container,
    Card,
    Text,
    Button,
    Group,
    Stack,
    Box,
    Title,
    SimpleGrid,
    Badge,
} from '@mantine/core';
import { IconWoman } from '@tabler/icons-react';
import { useCharacters } from '@/hooks/useUserCharacters';
import { CharacterCard } from './components/character-card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CharacterCreationWizard } from '@/components/CharacterCreationWizard/CharacterCreationWizard';

export default function CharacterCreationPage() {
    const router = useRouter();
    const [wizardOpened, setWizardOpened] = useState(false);
    const {
        characters,
        loading,
        error,
        createCharacter,
        deleteCharacter
    } = useCharacters();

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


    return (
        <Container size="xl" py={{ base: 'md', md: 'xl' }}>
            <CharacterCreationWizard 
                opened={wizardOpened} 
                onClose={() => setWizardOpened(false)} 
            />
            
            <Stack gap="xl">
                {/* Your Characters Section */}
                <Card p={{ base: 'md', md: 'lg' }} withBorder={false}>
                    <Title size="h3" mb={{ base: 'md', md: 'lg' }} c="white">
                        Your Characters
                    </Title>

                    <Card p={{ base: 'md', md: 'lg' }} style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                        {loading && (
                            <Text ta="center" c="dimmed" py="xl">Loading your characters...</Text>
                        )}
                        {!loading && (
                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
                                {/* Create New Character Card */}
                                <Card 
                                    p="sm" 
                                    style={{ 
                                        backgroundColor: '#2a2a2a', 
                                        border: '2px dashed #4a7aba', 
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setWizardOpened(true)}
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
                                            <Stack align="center" gap="xs">
                                                <Text size="3rem" c="#4a7aba">+</Text>
                                                <Text size="xs" c="#4a7aba" fw={600} ta="center">
                                                    Create Your Own
                                                </Text>
                                            </Stack>
                                        </Box>
                                        <Text size="xs" fw={600} c="white" ta="center">
                                            Custom Character
                                        </Text>
                                    </Stack>
                                </Card>

                                {/* User Characters */}
                                {characters.map((character) => (
                                    <CharacterCard
                                        key={character.id}
                                        character={character}
                                    />
                                ))}
                            </SimpleGrid>
                        )}
                    </Card>
                </Card>

                {/* Use a Premade Character Section */}
                <Card p={{ base: 'md', md: 'lg' }} withBorder={false}>
                    <Title size="h3" mb={{ base: 'md', md: 'lg' }} c="white">
                        Premade Characters
                    </Title>

                    <Card p={{ base: 'md', md: 'lg' }} style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
                            {premadeCharacters.map((character) => (
                                <Card key={character.id} p="md" style={{ backgroundColor: '#3a3a3a', border: '1px solid #555', cursor: 'pointer' }}>
                                    <Stack gap="sm">
                                        <Box
                                            style={{
                                                width: '100%',
                                                aspectRatio: '3/4',
                                                backgroundColor: '#2a2a2a',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                position: 'relative'
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
                                            <Group 
                                                gap="xs" 
                                                style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    left: '8px',
                                                    right: '8px',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <Badge variant="filled" color="blue" size="sm">
                                                    ZIT
                                                </Badge>
                                                <Badge variant="filled" color="gray" size="sm">
                                                    Classic
                                                </Badge>
                                            </Group>
                                        </Box>
                                        <Text size="lg" c="white" ta="center">
                                            <Text component="span" fw={600}>{character.name}</Text>
                                            <Text component="span" fw={400}> ({character.age})</Text>
                                        </Text>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Card>
                </Card>
            </Stack>
        </Container>
    );
}