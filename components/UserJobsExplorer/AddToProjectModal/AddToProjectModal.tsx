import { useState, useEffect } from 'react';
import {
  Modal,
  Image,
  Text,
  Group,
  Stack,
  Button,
  Menu,
  UnstyledButton,
  Badge,
  Paper,
  Center,
  Loader
} from '@mantine/core';
import { IconChevronDown, IconFolderPlus, IconPhoto } from '@tabler/icons-react';
import { useUserProjects } from '@/hooks/useUserProjects';
import { notifications } from '@mantine/notifications';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import classes from './AddToProjectModal.module.css';

interface AddToProjectModalProps {
  opened: boolean;
  onClose: () => void;
  imageUrl: string;
  imageId: string;
}

export function AddToProjectModal({ opened, onClose, imageUrl, imageId }: AddToProjectModalProps) {
  const { projects, loading: projectsLoading, addImagesToProject } = useUserProjects();
  const [selectedProject, setSelectedProject] = useState<UserProject & { id: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selected project when modal opens
  useEffect(() => {
    if (opened && projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, [opened, projects]);

  const handleAddToProject = async () => {
    if (!selectedProject) {
      notifications.show({
        title: 'Error',
        message: 'Please select a project first',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);
    const db = getFirestore(app);

    try {
      // Update the image document with the project ID
      console.log({ imageId, userId: selectedProject.userId });
      const imageDocRef = doc(db, 'images', imageId);
      await updateDoc(imageDocRef, { projectId: selectedProject.id });

      await addImagesToProject(selectedProject.id, [imageId], [imageUrl] as string[]);

      notifications.show({
        title: 'Success',
        message: `Image added to project "${selectedProject.name}" successfully!`,
        color: 'green',
      });

      onClose();
    } catch (error) {
      console.error('Error adding image to project:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add image to project. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Project selector dropdown items
  const projectItems = projects.map((project) => (
    <Menu.Item
      key={project.id}
      onClick={() => setSelectedProject(project)}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <IconFolderPlus size={18} />
          <Text lineClamp={1} style={{ maxWidth: '180px' }}>
            {project.name}
          </Text>
        </Group>
        <Badge size="sm">
          {project.imageIds?.length || 0} {project.imageIds?.length === 1 ? 'image' : 'images'}
        </Badge>
      </Group>
    </Menu.Item>
  ));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Add to Project</Text>}
      centered
      size="md"
    >
      <Stack>
        {/* Image Preview */}
        <Paper withBorder p="xs" radius="md">
          <Text size="sm" fw={500} mb="xs">Image Preview</Text>
          <Center style={{ width: '100%', height: '200px', overflow: 'hidden', borderRadius: '8px' }}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Image to add"
                fit="contain"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
              />
            ) : (
              <Stack align="center" gap="xs">
                <IconPhoto size={48} opacity={0.3} />
                <Text c="dimmed" size="sm">No preview available</Text>
              </Stack>
            )}
          </Center>
        </Paper>

        {/* Project Selection */}
        <Paper withBorder p="xs" radius="md">
          <Text size="sm" fw={500} mb="xs">Select Project</Text>

          {projectsLoading ? (
            <Center p="md">
              <Loader size="sm" />
            </Center>
          ) : projects.length === 0 ? (
            <Text c="dimmed" ta="center" py="md">
              No projects available. Create a project first.
            </Text>
          ) : (
            <Menu
              width="target"
              withinPortal
              radius="md"
            >
              <Menu.Target>
                <UnstyledButton className={classes.projectSelector}>
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                      <IconFolderPlus size={18} />
                      <Text lineClamp={1}>
                        {selectedProject?.name || 'Select a project'}
                      </Text>
                    </Group>
                    <Group gap="xs" wrap="nowrap">
                      {selectedProject && (
                        <Badge size="sm">
                          {selectedProject.imageIds?.length || 0} {selectedProject.imageIds?.length === 1 ? 'image' : 'images'}
                        </Badge>
                      )}
                      <IconChevronDown size={16} stroke={1.5} />
                    </Group>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>{projectItems}</Menu.Dropdown>
            </Menu>
          )}
        </Paper>

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToProject}
            loading={isSubmitting}
            disabled={projectsLoading || projects.length === 0 || !selectedProject}
          >
            Add to Project
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}