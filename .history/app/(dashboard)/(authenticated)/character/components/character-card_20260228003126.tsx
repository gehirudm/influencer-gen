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
    const [isTraining, setIsTraining] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [trainModalOpen, setTrainModalOpen] = useState(false);
    const router = useRouter();
    const { systemData } = useUserData();

    const { selectCharacter } = useCharacterContext();

    const {
        deleteCharacter
    } = useCharacters();

    const trainStatus = character.trainStatus || 'untrained';
    const isUntrained = trainStatus === 'untrained';
    const isPending = trainStatus === 'pending';
    const isTrained = trainStatus === 'completed';

    // Calculate remaining time for the progress bar
    // If the 6-hour window expires, restart the cycle with a "long queue" note
    const getTrainingProgress = () => {
        if (!character.trainRequestedAt) return { progress: 0, remaining: '~2-6 hours remaining', longQueue: false };

        const requestedAt = new Date(character.trainRequestedAt).getTime();
        const now = Date.now();
        const sixHours = 6 * 60 * 60 * 1000;
        const totalElapsed = now - requestedAt;

        // If beyond the first 6h window, restart cycles
        const cycleElapsed = totalElapsed % sixHours;
        const longQueue = totalElapsed >= sixHours;
        const progress = Math.min((cycleElapsed / sixHours) * 100, 99);
        const remainingMs = Math.max(sixHours - cycleElapsed, 0);

        const hours = Math.floor(remainingMs / (60 * 60 * 1000));
        const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

        let remaining: string;
        if (hours > 0) {
            remaining = `~${hours}h ${minutes}m remaining`;
        } else {
            remaining = `~${minutes}m remaining`;
        }

        return { progress, remaining, longQueue };
    };

    const handleTrain = async () => {
        setIsTraining(true);
        setTrainModalOpen(false);
        try {
            const result = await submitTrainRequest(character.id);

            if (result.success) {
                notifications.show({
                    title: 'Training Started',
                    message: `Training request submitted for "${character.name}". You'll be notified when it's ready!`,
                    color: 'green',
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: result.error || 'Failed to submit training request.',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error submitting train request:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to submit training request. Please try again.',
                color: 'red',
            });
        } finally {
            setIsTraining(false);
        }
    };

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

                {/* Training full overlay with animation */}
                {isPending && (
                    <Box className={classes.trainingOverlay}>
                        {/* Scanning line animation */}
                        <Box className={classes.scanLine} />

                        {/* Center content */}
                        <Stack
                            gap={6}
                            align="center"
                            justify="center"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 2,
                            }}
                        >
                            <Loader size={28} color="cyan" type="bars" />
                            <Text size="xs" c="white" fw={600} ta="center" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                                Training...
                            </Text>
                        </Stack>

                        {/* Bottom info bar */}
                        <Box
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '8px',
                                zIndex: 2,
                            }}
                        >
                            {getTrainingProgress().longQueue && (
                                <Text size="10px" c="yellow" ta="center" mb={4} fw={600}>
                                    Long queue — hang tight!
                                </Text>
                            )}
                            <Group gap={4} justify="center" mb={4}>
                                <Text size="10px" c="rgba(255,255,255,0.8)">{getTrainingProgress().remaining}</Text>
                            </Group>
                            <Progress
                                value={getTrainingProgress().progress}
                                color="cyan"
                                size="xs"
                                radius="xl"
                                animated
                                striped
                            />
                        </Box>
                    </Box>
                )}
            </Box>
            
            <Text size="sm" c="white" ta="center" mb="xs">
                <Text component="span" fw={600}>{character.name}</Text>
                {character.age && (
                    <Text component="span" fw={400}> ({character.age})</Text>
                )}
            </Text>
            
            {/* TRAIN button for untrained characters */}
            {isUntrained && (
                <Tooltip label={`Costs 1 LoRA Token (you have ${systemData?.loraTokens ?? 0})`} withArrow>
                    <Button
                        variant="filled"
                        color="violet"
                        radius="sm"
                        size="sm"
                        fullWidth
                        rightSection={<IconBrain size={20} />}
                        style={{ fontWeight: 700 }}
                        onClick={() => setTrainModalOpen(true)}
                        disabled={isDeleting || isTraining}
                        loading={isTraining}
                    >
                        TRAIN
                    </Button>
                </Tooltip>
            )}

            {/* Pending - show disabled button */}
            {isPending && (
                <Button
                    variant="filled"
                    color="blue"
                    radius="sm"
                    size="sm"
                    fullWidth
                    rightSection={<IconClock size={20} />}
                    style={{ fontWeight: 700 }}
                    disabled
                >
                    TRAINING...
                </Button>
            )}

            {/* USE button only for trained characters */}
            {isTrained && (
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
            )}

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

            {/* Train Confirmation Modal */}
            <Modal
                opened={trainModalOpen}
                onClose={() => setTrainModalOpen(false)}
                title="Train Character"
                centered
                size="sm"
            >
                <Stack gap="sm">
                    <Text size="sm">
                        Training "{character.name}" will allow you to generate images with this character.
                    </Text>
                    <Text size="sm" c="dimmed">
                        This will cost <Text component="span" fw={700} c="violet">1 LoRA Token</Text>.
                        You currently have <Text component="span" fw={700} c="violet">{systemData?.loraTokens ?? 0}</Text> LoRA token{(systemData?.loraTokens ?? 0) !== 1 ? 's' : ''}.
                    </Text>
                    <Text size="sm" c="dimmed">
                        Training typically takes around 2–6 hours. You'll be notified when your character is ready.
                    </Text>
                </Stack>
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={() => setTrainModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="violet"
                        onClick={handleTrain}
                        loading={isTraining}
                        disabled={(systemData?.loraTokens ?? 0) < 1}
                        leftSection={<IconBrain size={18} />}
                    >
                        Start Training
                    </Button>
                </Group>
            </Modal>
        </Card>
    );
}