import { useState } from 'react';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import {
    ActionIcon,
    Badge,
    Card,
    Group,
    Image,
    Text,
    Tooltip,
    useMantineTheme,
    Modal,
    Select,
    Button,
    Pill,
} from '@mantine/core';
import { getFirestore, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import { getAuth, User } from 'firebase/auth';
import { notifications } from '@mantine/notifications';
import classes from './ImageGenCard.module.css';

interface ImageGenCardProps {
    jobId: string;
    status: string;
    prompt: string;
    imageUrls: string[];
	imageIds: string[];
    generationTime: number | null;
    dimensions: { width: number; height: number } | null;
    userProjects: Project[];
}

interface Project {
    id: string;
    name: string;
}

export function ImageGenCard({
    jobId,
    status,
    prompt,
    imageUrls,
	imageIds,
    generationTime,
    dimensions,
    userProjects,
}: ImageGenCardProps) {
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const theme = useMantineTheme();

    const auth = getAuth(app);
    const user = auth.currentUser as User;
    const db = getFirestore(app);

    const handleDelete = async () => {
        if (!imageIds[0]) return;

        try {
            const imageDocRef = doc(db, 'images', imageIds[0]);
            await deleteDoc(imageDocRef);

            notifications.show({
                title: 'Success',
                message: 'Image deleted successfully!',
                color: 'green',
            });
        } catch (error) {
            console.error('Error deleting image:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to delete image.',
                color: 'red',
            });
        }
    };

    const handleConfirmAddToProject = async () => {
        if (!selectedProject || !imageIds[0]) return;

        const project = userProjects.find(p => p.name === selectedProject);
        if (!project) return;

        try {
            const imageDocRef = doc(db, 'images', imageIds[0]);
            await updateDoc(imageDocRef, { projectId: project.id });

            notifications.show({
                title: 'Success',
                message: `Image added to project ${selectedProject} successfully!`,
                color: 'green',
            });
        } catch (error) {
            console.error('Error updating image document:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to add image to project.',
                color: 'red',
            });
        }

        setProjectModalOpen(false);
    };

    return (
        <Card withBorder radius="md" className={classes.card}>
            <Card.Section>
                {status === 'COMPLETED' && <Image h={400} src={imageUrls[0]}/>}
            </Card.Section>

            <Badge className={classes.rating} variant="gradient" gradient={{ from: 'cyan', to: 'green' }}>
                {status}
            </Badge>

            <Text className={classes.title} fw={500} fz={14}>
                Prompt
            </Text>

            <Text fz="sm" c="dimmed" lineClamp={4}>
                {prompt}
            </Text>

            {generationTime !== null && (
                <Text fz="sm" c="dimmed">
                    Generation Time: {generationTime} ms
                </Text>
            )}

            <Pill>{dimensions?.height}x{dimensions?.width}</Pill>

            <Group justify="flex-end" className={classes.footer}>
                <Group gap={8} mr={0}>
                    <Tooltip label="Add to Project">
                        <ActionIcon className={classes.action} onClick={() => setProjectModalOpen(true)}>
                            <IconPlus size={16} color={theme.colors.blue[6]} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Edit">
                        <ActionIcon className={classes.action} onClick={() => console.log('Edit clicked')}>
                            <IconPencil size={16} color={theme.colors.blue[6]} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete">
                        <ActionIcon className={classes.action} onClick={handleDelete}>
                            <IconTrash size={16} color={theme.colors.red[4]} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            <Modal opened={projectModalOpen} onClose={() => setProjectModalOpen(false)} title="Select Project">
                <Select
                    label="Project"
                    placeholder="Pick one"
                    data={userProjects.map(project => project.name)} // Use project names for selection
                    value={selectedProject}
                    onChange={setSelectedProject}
                />
                <Button fullWidth mt="md" onClick={handleConfirmAddToProject}>
                    Confirm
                </Button>
            </Modal>
        </Card>
    );
}