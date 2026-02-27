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
    Progress,
    Loader,
    Stack,
    Tooltip,
} from '@mantine/core';
import { IconTrash, IconPhotoSpark, IconEdit, IconBrain, IconClock } from '@tabler/icons-react';
import classes from './character-card.module.css';
import { useCharacters } from '@/hooks/useUserCharacters';
import { notifications } from '@mantine/notifications';
import { useCharacterContext } from '@/contexts/character-context';
import { useRouter } from 'next/navigation';
import { submitTrainRequest } from '@/app/actions/character/train';
import { useUserData } from '@/hooks/useUserData';


interface CharacterCardProps {
    character: {
        id: string;
        name: string;
        imageUrls: string[];
        baseImageUrl?: string;
        age?: string;
        gender?: string;
        trainStatus?: 'untrained' | 'pending' | 'completed';
        trainRequestedAt?: string;
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
        router.push(`/generate-images?gen_type=advanced`);
    }

    // Use base image if available, otherwise fall back to first image
    const displayImage = character.baseImageUrl || character.imageUrls[0];

    return (
        <Card p={{ base: 'xs', md: 'md' }} style={{ backgroundColor: '#3a3a3a', border: '1px solid #555', cursor: 'pointer' }}>
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
                
                {/* Edit icon - top left */}
                <ActionIcon
                    className={classes.editIcon}
                    color="blue"
                    variant="filled"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement edit functionality
                        console.log('Edit character:', character.id);
                    }}
                >
                    <IconEdit size={16} />
                </ActionIcon>
                
                {/* Delete icon - top right */}
                <ActionIcon
                    className={classes.deleteIcon}
                    color="red"
                    variant="filled"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModalOpen(true);
                    }}
                    loading={isDeleting}
                >
                    <IconTrash size={16} />
                </ActionIcon>
            </Box>
            
            <Text size="sm" c="white" ta="center" mb="xs">
                <Text component="span" fw={600}>{character.name}</Text>
                {character.age && (
                    <Text component="span" fw={400}> ({character.age})</Text>
                )}
            </Text>
            
            <Button
                variant="filled"
                radius="sm"
                size="sm"
                fullWidth
                rightSection={<IconPhotoSpark size={20} />}
                style={{ fontWeight: 700 }}
                onClick={() => handleUseCharacter(character.id)}
                disabled={isDeleting}
            >
                USE
            </Button>

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