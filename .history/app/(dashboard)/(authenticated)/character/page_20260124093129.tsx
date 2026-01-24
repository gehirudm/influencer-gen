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
            <Stack gap="xl">
                {/* Your Characters Section */}
                <Card p={{ base: 'md', md: 'lg' }} withBorder={false}>
                    <Title size="h3" mb={{ base: 'md', md: 'lg' }} c="white">
                        Your Characters
                    </Title>

                    <Card p={{ base: 'md', md: 'lg' }} style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                        <Group gap="md" justify='center'>
                            {characters.length === 0 && !loading && (
                                <Stack align="center" py="xl" gap="sm">
                                    <IconWoman size={48} color="gray" />
                                    <Text ta="center" c="dimmed" size="lg">You don't have any characters yet</Text>
                                    <Text ta="center" c="dimmed" size="sm">
                                        Create a new character to get started
                                    </Text>
                                    <Button 
                                        variant="filled" 
                                        size="md" 
                                        mt="md"
                                        onClick={() => router.push('/character/create')}
                                    >
                                        Create New Character
                                    </Button>
                                </Stack>
                            )}
                            {loading && (
                                <Text ta="center" c="dimmed" py="xl">Loading your characters...</Text>
                            )}
                            {characters.map((character) => (
                                <CharacterCard
                                    key={character.id}
                                    character={character}
                                />
                            ))}
                        </Group>
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
                                        <Group gap="xs" justify="center" style={{ flexWrap: 'wrap' }}>
                                            {character.tags.map((tag, index) => (
                                                <Badge key={index} variant="light" size="sm">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </Group>
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