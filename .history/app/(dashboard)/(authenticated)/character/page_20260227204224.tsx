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
    ActionIcon,
    Modal,
} from '@mantine/core';
import { IconWoman, IconLock, IconUsers, IconTrash, IconPhotoSpark } from '@tabler/icons-react';
import { useCharacters } from '@/hooks/useUserCharacters';
import { CharacterCard } from './components/character-card';
import { useRouter } from 'next/navigation';
import { useCharacterContext } from '@/contexts/character-context';
import { notifications } from '@mantine/notifications';
import { deleteDoc, doc, getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { CharacterCreationWizard } from '@/components/CharacterCreationWizard/CharacterCreationWizard';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';

interface MarketplaceCharacter {
  id: string;
  characterId: string;
  characterName: string;
  characterImage: string;
  purchaseType: 'license' | 'full_claim';
  cost: number;
  purchasedAt: any;
  loraUrl?: string;
}

export default function CharacterCreationPage() {
    const router = useRouter();
    const [wizardOpened, setWizardOpened] = useState(false);
    const [marketplaceCharacters, setMarketplaceCharacters] = useState<MarketplaceCharacter[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [characterToDelete, setCharacterToDelete] = useState<MarketplaceCharacter | null>(null);
    const { selectCharacter } = useCharacterContext();
    const {
        characters,
        loading,
        error,
        createCharacter,
        deleteCharacter
    } = useCharacters();

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
                    const characterData: MarketplaceCharacter[] = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data) {
                            characterData.push({ id: doc.id, ...data } as MarketplaceCharacter);
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
        <Box style={{ padding: '0.75rem', height: '100%' }}>
            <CharacterCreationWizard 
                opened={wizardOpened} 
                onClose={() => setWizardOpened(false)} 
            />
            
            <Stack gap="md">
                {/* Your Characters Section */}
                <div>
                    <Title size={36} mb={{ base: 'md', md: 'lg' }} c="white">
                        Your Characters
                    </Title>

                    <Card p={{ base: 'md', md: 'lg' }} style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                        {loading && (
                            <Text ta="center" c="dimmed" py="xl">Loading your characters...</Text>
                        )}
                        {!loading && (
                            <SimpleGrid cols={{ base: 2, sm: 2, md: 3, lg: 5 }} spacing="md">
                                {/* Create New Character Card */}
                                <Card 
                                    p={{ base: 'xs', md: 'sm' }}
                                    style={{ 
                                        backgroundColor: '#2a2a2a', 
                                        border: '2px dashed #4a7aba', 
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setWizardOpened(true)}
                                >
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
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <Text size="3rem" c="#4a7aba">+</Text>
                                    </Box>
                                    <Text size="sm" c="#4a7aba" fw={600} ta="center" mb="xs">
                                        New Character
                                    </Text>
                                    <Button
                                        variant="outline"
                                        color="blue"
                                        radius="sm"
                                        size="sm"
                                        fullWidth
                                        style={{ fontWeight: 700, pointerEvents: 'none' }}
                                        tabIndex={-1}
                                    >
                                        CREATE
                                    </Button>
                                </Card>

                                {/* User Characters */}
                                {characters.map((character) => (
                                    <CharacterCard
                                        key={character.id}
                                        character={character}
                                    />
                                ))}

                                {/* Marketplace Purchased Characters */}
                                {marketplaceCharacters.map((character) => (
                                    <Card key={character.id} p={{ base: 'xs', md: 'md' }} style={{ backgroundColor: '#3a3a3a', border: '1px solid #555', cursor: 'pointer' }}>
                                        <Box
                                            style={{
                                                width: '100%',
                                                aspectRatio: '3/4',
                                                backgroundColor: '#2a2a2a',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                position: 'relative',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            <img 
                                                src={character.characterImage} 
                                                alt={character.characterName}
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
                                                <Badge 
                                                    variant="filled" 
                                                    color={character.purchaseType === 'full_claim' ? 'violet' : 'blue'} 
                                                    size="sm"
                                                    leftSection={character.purchaseType === 'full_claim' ? <IconLock size={12} /> : <IconUsers size={12} />}
                                                >
                                                    {character.purchaseType === 'full_claim' ? 'Exclusive' : 'Licensed'}
                                                </Badge>
                                                <ActionIcon
                                                    color="red"
                                                    variant="filled"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCharacterToDelete(character);
                                                        setDeleteModalOpen(true);
                                                    }}
                                                    loading={deletingCharacterId === character.id}
                                                    style={{ position: 'absolute', top: '8px', right: '8px' }}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Box>
                                        
                                        <Text size="sm" c="white" ta="center" mb="xs">
                                            <Text component="span" fw={600}>{character.characterName}</Text>
                                        </Text>
                                        
                                        <Button
                                            variant="filled"
                                            radius="sm"
                                            size="sm"
                                            fullWidth
                                            rightSection={<IconPhotoSpark size={20} />}
                                            style={{ fontWeight: 700 }}
                                            onClick={() => {
                                                selectCharacter(`marketplace-${character.characterId}`);
                                                router.push(`/generate-images?gen_type=advanced`);
                                            }}
                                            disabled={deletingCharacterId === character.id}
                                        >
                                            USE
                                        </Button>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        )}
                    </Card>
                </div>

                {/* Use a Premade Character Section */}
                <div>
                    <Title size={36} mb={{ base: 'md', md: 'lg' }} c="white">
                        Premade Characters
                    </Title>

                    <Card p={{ base: 'md', md: 'lg' }} style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                        <SimpleGrid cols={{ base: 2, sm: 2, md: 3, lg: 5 }} spacing="md">
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
                                        <Text size="sm" c="white" ta="center">
                                            <Text component="span" fw={600}>{character.name}</Text>
                                            <Text component="span" fw={400}> ({character.age})</Text>
                                        </Text>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Card>
                </div>
            </Stack>

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setCharacterToDelete(null);
                }}
                title="Delete Character"
                centered
                size="sm"
            >
                <Text size="sm" mb="lg">
                    Are you sure you want to delete "{characterToDelete?.characterName}"? This action cannot be undone.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => {
                        setDeleteModalOpen(false);
                        setCharacterToDelete(null);
                    }}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={async () => {
                            if (!characterToDelete || !userId) return;
                            
                            setDeletingCharacterId(characterToDelete.id);
                            setDeleteModalOpen(false);
                            
                            try {
                                const db = getFirestore(app);
                                await deleteDoc(doc(db, 'users', userId, 'characters', characterToDelete.id));
                                
                                notifications.show({
                                    title: 'Success',
                                    message: 'Character deleted successfully!',
                                    color: 'green',
                                });
                            } catch (error) {
                                console.error('Error deleting character:', error);
                                notifications.show({
                                    title: 'Error',
                                    message: 'Failed to delete character. Please try again.',
                                    color: 'red',
                                });
                            } finally {
                                setDeletingCharacterId(null);
                                setCharacterToDelete(null);
                            }
                        }}
                        loading={deletingCharacterId !== null}
                    >
                        Delete
                    </Button>
                </Group>
            </Modal>
        </Box>
    );
}