import {
    Group,
    Card,
    Stack,
    Text,
    Box,
    Center,
    Paper,
    Button,
    Modal,
    TextInput,
    Textarea,
    SimpleGrid,
    Image,
    ActionIcon,
    Title,
    Badge,
    Skeleton
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useUserProjects } from '@/hooks/useUserProjects';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconPlus, IconPhoto } from '@tabler/icons-react';
import classes from './UserProjectsExplorer.module.css';
import { UserProjectCard } from './UserProjectCard/UserProjectCard';

interface UserProjectExplorerProps {
    onViewProject?: (projectId: string) => void;
}

export function UserProjectsExplorer({
    onViewProject
}: UserProjectExplorerProps) {
    const {
        projects,
        loading,
        error,
        createProject,
        deleteProject
    } = useUserProjects();

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle project creation
    const handleCreateProject = async () => {
        if (!projectName.trim()) {
            notifications.show({
                title: 'Error',
                message: 'Project name is required',
                color: 'red',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const projectId = await createProject(projectName, projectDescription);

            if (projectId) {
                notifications.show({
                    title: 'Success',
                    message: 'Project created successfully!',
                    color: 'green',
                });
                setCreateModalOpen(false);
                setProjectName('');
                setProjectDescription('');
            } else {
                throw new Error('Failed to create project');
            }
        } catch (error) {
            console.log(error)
            notifications.show({
                title: 'Error',
                message: 'Failed to create project. Please try again.',
                color: 'red',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle project deletion
    const handleDeleteProject = async (projectId: string, projectName: string) => {
        try {
            const success = await deleteProject(projectId);

            if (success) {
                notifications.show({
                    title: 'Success',
                    message: 'Project deleted successfully!',
                    color: 'green',
                });
            } else {
                throw new Error('Failed to delete project');
            }
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to delete project. Please try again.',
                color: 'red',
            });
        }
    };

    // Generate skeleton placeholders while loading
    const renderSkeletons = () => {
        return Array(4).fill(0).map((_, index) => (
            <Card key={`skeleton-${index}`} radius="md" withBorder padding="lg" className={classes.projectCard}>
                <Card.Section mb={10}>
                    <Skeleton height={200} width="100%" />
                </Card.Section>
                <Skeleton height={24} width="70%" mt={10} mb={5} />
                <Skeleton height={16} width="90%" mb={10} />
                <Group mt="auto" align="space-between">
                    <Skeleton height={30} width={80} />
                    <Group>
                        <Skeleton height={30} width={30} circle />
                        <Skeleton height={30} width={30} circle />
                    </Group>
                </Group>
            </Card>
        ));
    };

    if (error) {
        return <Text >Erro loading projects: {error}</Text>;
    }

    return (
        <Stack gap="md">
            {/* Header with create button */}
            <Paper p="md" radius="md" className={classes.headerContainer}>
                <Group align="space-between">
                    <Title order={3}>Your Projects</Title>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setCreateModalOpen(true)}
                    >
                        Create New Project
                    </Button>
                </Group>
            </Paper>

            {/* Projects grid */}
            <Group
                gap="md"
                align='start'
            >
                {loading ? (
                    renderSkeletons()
                ) : projects.length === 0 ? (
                    <Card radius="md" withBorder={false} padding="xl" className={classes.emptyCard}>
                        <Center style={{ height: '100%', width: "100%", flexDirection: 'column' }}>
                            <Text size="lg" mt="md" c="dimmed" ta="center">
                                No projects yet. Create your first project to organize your images.
                            </Text>
                        </Center>
                    </Card>
                ) : (
                    projects.map((project) => (
                        <UserProjectCard
                            key={project.id}
                            projectName={project.name}
                            projectDescription={project.description || "No description"}
                            imageCount={project.imageIds?.length || 0}
                            imageUrls={project.imageUrls || []}
                            thumbnailIndex={0}
                            onDelete={() => handleDeleteProject(project.id, project.name)}
                            onEdit={() => onViewProject && onViewProject(project.id)}
                            onInpaint={() => {
                                // Handle inpaint action
                                console.log('Inpaint');
                            }}
                            onImg2Img={() => {
                                // Handle img2img action
                                console.log('Img2Img');
                            }}
                            onSaveChar={() => {
                                // Handle save character action
                                console.log('Save Character');
                            }}
                            onRemake={() => {
                                // Handle remake action
                                console.log('Remake');
                            }}
                        />
                    ))
                )}
            </Group>

            {/* Create Project Modal */}
            <Modal
                opened={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Create New Project"
                centered
            >
                <Stack>
                    <TextInput
                        label="Project Name"
                        placeholder="Enter project name"
                        value={projectName}
                        onChange={(event) => setProjectName(event.currentTarget.value)}
                        required
                    />

                    <Textarea
                        label="Project Description (Optional)"
                        placeholder="Enter project description"
                        value={projectDescription}
                        onChange={(event) => setProjectDescription(event.currentTarget.value)}
                        minRows={3}
                    />

                    <Group align="flex-end" mt="md">
                        <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateProject}
                            loading={isSubmitting}
                            disabled={!projectName.trim()}
                        >
                            Create Project
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}