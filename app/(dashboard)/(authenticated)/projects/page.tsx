"use client"

import { useState } from 'react';
import { Container, Grid, Card, Image, Text, Button, Modal, TextInput, Textarea, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useUserProjectsWithImages } from '@/hooks/useUserProjectWithImages';

export default function ProjectsPage() {
    // const { projects, loading, error } = useUserProjectsWithImages();
    const [modalOpen, setModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');

    const handleCreateProject = async () => {
        // Implement project creation logic here
        // For now, just close the modal and reset the form
        setModalOpen(false);
        setProjectName('');
        setProjectDescription('');
        notifications.show({
            title: 'Success',
            message: 'Project created successfully!',
            color: 'green',
        });
    };

    return (
        <Container>
            <Group mb="md">
                <Text size="xl" fw={700}>Your Projects</Text>
                <Button onClick={() => setModalOpen(true)}>Create New Project</Button>
            </Group>

            <Grid>
                {/* {projects.map((project) => (
                    <Grid.Col key={project.id} span={4}>
                        <Card shadow="sm" padding="lg">
                            <Card.Section>
                                <Image src={project.} height={160} alt={project.name} />
                            </Card.Section>
                            <Text fw={500} mt="md">{project.name}</Text>
                            <Text size="sm" color="dimmed">{project.description}</Text>
                        </Card>
                    </Grid.Col>
                ))} */}
            </Grid>

            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Create New Project"
            >
                <TextInput
                    label="Project Name"
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(event) => setProjectName(event.currentTarget.value)}
                    mb="md"
                />
                <Textarea
                    label="Project Description"
                    placeholder="Enter project description"
                    value={projectDescription}
                    onChange={(event) => setProjectDescription(event.currentTarget.value)}
                    mb="md"
                />
                <Button onClick={handleCreateProject}>Create Project</Button>
            </Modal>
        </Container>
    );
}