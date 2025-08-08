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

    return (
        <Card
            key={character.id}
            padding={0}
            radius="md"
            w={{ base: 200, md: 250 }}
            className={classes.characterCard}
        >
            <Box style={{ position: 'relative' }}>
                <Image
                    src={character.imageUrls[0]}
                    alt={character.name}
                    style={{
                        width: '100%',
                        height: "auto",
                        objectFit: 'cover',
                        objectPosition: 'center'
                    }}
                    className={classes.characterImage}
                    fallbackSrc="/placeholder-character.png"
                />
            </Box>

            <Text size="xl" fw={700} c="white">
                {character.name}
            </Text>

            <Group
                justify="space-between"
            >
                <Button
                    variant="filled"
                    radius="sm"
                    size="sm"
                    rightSection={<IconPhotoSpark size={20} />}
                    p={10}
                    style={{
                        fontWeight: 700
                    }}
                    onClick={() => handleUseCharacter(character.id)}
                    disabled={isDeleting}
                >
                    USE
                </Button>

                <ActionIcon
                    color="gray"
                    variant="transparent"
                    size="xl"
                    onClick={() => setDeleteModalOpen(true)}
                    loading={isDeleting}
                >
                    <IconTrash size={24} />
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