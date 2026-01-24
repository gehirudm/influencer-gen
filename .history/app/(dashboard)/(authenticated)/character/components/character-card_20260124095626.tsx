"use client"

import { useState } from 'react';
import {
    Card,
    Text,
    Button,
    Group,
    Image,
    ActionIcon,
    Box,
    Modal,
} from '@mantine/core';
import { IconTrash, IconPhotoSpark } from '@tabler/icons-react';
import classes from './character-card.module.css';
import { useCharacters } from '@/hooks/useUserCharacters';
import { notifications } from '@mantine/notifications';
import { useCharacterContext } from '@/contexts/character-context';
import { useRouter } from 'next/navigation';


interface CharacterCardProps {
    character: {
        id: string;
        name: string;
        imageUrls: string[];
        baseImageUrl?: string;
        ageRange?: string;
        gender?: string;
    }
}

export function CharacterCard({ character }: CharacterCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const router = useRouter();

    const { selectCharacter } = useCharacterContext();

    const {
        deleteCharacter
    } = useCharacters();

    const handleDelete = async (characterId: string) => {
        setIsDeleting(true);
        setDeleteModalOpen(false);
        try {
            const success = await deleteCharacter(characterId);

            if (success) {
                notifications.show({
                    title: 'Success',
                    message: 'Character deleted successfully!',
                    color: 'green',
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to delete character. Please try again.',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error deleting character:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to delete character. Please try again.',
                color: 'red',
            });
        }
    }

    const handleUseCharacter = (characterId: string) => {
        selectCharacter(characterId);
        router.push(`/create?gen_type=advanced`);
    }

    // Use base image if available, otherwise fall back to first image
    const displayImage = character.baseImageUrl || character.imageUrls[0];

    return (
        <Card p="md" style={{ backgroundColor: '#3a3a3a', border: '1px solid #555', cursor: 'pointer' }}>
            <Box
                style={{
                    width: '100%',
                    aspectRatio: '3/4',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: '12px',
                }}
            >
                <img 
                    src={displayImage}
                    alt={character.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                    onError={(e) => {
                        e.currentTarget.src = '/placeholder-character.png';
                    }}
                />
            </Box>
            
            <Text size="sm" c="white" ta="center" mb="sm">
                <Text component="span" fw={600}>{character.name}</Text>
                {character.ageRange && (
                    <Text component="span" fw={400}> ({character.ageRange})</Text>
                )}
            </Text>
            
            <Group justify="space-between" mt="auto">
                <Button
                    variant="filled"
                    radius="sm"
                    size="sm"
                    rightSection={<IconPhotoSpark size={20} />}
                    style={{ fontWeight: 700 }}
                    onClick={() => handleUseCharacter(character.id)}
                    disabled={isDeleting}
                >
                    USE
                </Button>

                <ActionIcon
                    color="red"
                    variant="subtle"
                    size="lg"
                    onClick={() => setDeleteModalOpen(true)}
                    loading={isDeleting}
                >
                    <IconTrash size={20} />
                </ActionIcon>
            </Group>

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Character"
                centered
                size="sm"
            >
                <Text size="sm" mb="lg">
                    Are you sure you want to delete "{character.name}"? This action cannot be undone.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={() => handleDelete(character.id)}
                        loading={isDeleting}
                    >
                        Delete
                    </Button>
                </Group>
            </Modal>
        </Card>
    );
}