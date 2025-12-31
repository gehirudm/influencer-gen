"use client";

import {
    ActionIcon,
    Badge,
    Button,
    Container,
    Group,
    NumberInput,
    Paper,
    Table,
    Text,
    TextInput,
    Textarea,
    Title,
    Stack,
    Loader,
    Alert,
    Tooltip,
    Divider,
    Modal,
    Switch,
    Select,
    Image,
    FileInput,
    SimpleGrid,
    Card,
    Box,
    Avatar,
} from '@mantine/core';
import {
    IconTrash,
    IconEdit,
    IconAlertCircle,
    IconPhoto,
    IconUpload,
    IconUser,
    IconWorld,
    IconCurrencyDollar,
    IconInfinity,
    IconPackage,
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useLoRAManagement, LoRAFormData, LoRAData } from '@/hooks/admin/useLoras';
import { useDisclosure } from '@mantine/hooks';

export default function LoRAsManagementPage() {
    const {
        loras,
        users,
        loading,
        loadingUsers,
        error,
        fetchLoras,
        fetchUsers,
        createLora,
        updateLora,
        deleteLora
    } = useLoRAManagement();

    const [submitting, setSubmitting] = useState(false);
    const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const [editModalOpen, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [loraToDelete, setLoraToDelete] = useState<string | null>(null);
    const [loraToEdit, setLoraToEdit] = useState<LoRAData | null>(null);
    const [deleting, setDeleting] = useState(false);

    const form = useForm<{
        displayName: string;
        loraName: string;
        keyword: string;
        description: string;
        thumbnailImage: File | null;
        displayImages: File[];
        assignmentType: 'user' | 'public';
        assignedUserId: string | null;
        isFree: boolean;
        isLimitedEdition: boolean;
        availableQuantity: number | null;
        price: number | null;
    }>({
        initialValues: {
            displayName: '',
            loraName: '',
            keyword: '',
            description: '',
            thumbnailImage: null,
            displayImages: [],
            assignmentType: 'user',
            assignedUserId: null,
            isFree: true,
            isLimitedEdition: false,
            availableQuantity: null,
            price: null,
        },
        validate: {
            displayName: (value) => !value.trim() ? 'Display name is required' : null,
            loraName: (value) => !value.trim() ? 'LoRA name (bucket filename) is required' : null,
            keyword: (value) => !value.trim() ? 'Keyword is required' : null,
            description: (value) => !value.trim() ? 'Description is required' : null,
            thumbnailImage: (value) => !value ? 'Thumbnail image is required' : null,
            assignedUserId: (value, values) =>
                values.assignmentType === 'user' && !value ? 'Please select a user' : null,
            price: (value, values) =>
                values.assignmentType === 'public' && !values.isFree && (!value || value <= 0)
                    ? 'Price is required for paid LoRAs' : null,
            availableQuantity: (value, values) =>
                values.assignmentType === 'public' && values.isLimitedEdition && (!value || value <= 0)
                    ? 'Quantity is required for limited edition' : null,
        },
    });

    useEffect(() => {
        fetchLoras();
        fetchUsers();
    }, [fetchLoras, fetchUsers]);

    // Handle form submission
    const handleSubmit = async (values: typeof form.values) => {
        try {
            setSubmitting(true);

            const loraData: LoRAFormData = {
                displayName: values.displayName,
                loraName: values.loraName,
                keyword: values.keyword,
                description: values.description,
                thumbnailImage: values.thumbnailImage || undefined,
                displayImages: values.displayImages.length > 0 ? values.displayImages : undefined,
                assignedUserId: values.assignmentType === 'user' ? values.assignedUserId : null,
                isPublic: values.assignmentType === 'public',
                isFree: values.assignmentType === 'public' ? values.isFree : true,
                isLimitedEdition: values.assignmentType === 'public' ? values.isLimitedEdition : false,
                availableQuantity: values.assignmentType === 'public' && values.isLimitedEdition
                    ? values.availableQuantity : null,
                price: values.assignmentType === 'public' && !values.isFree ? values.price : null,
            };

            const result = await createLora(loraData);

            if (!result.success) {
                throw new Error(result.error);
            }

            notifications.show({
                title: 'Success',
                message: `LoRA "${values.displayName}" created successfully`,
                color: 'green',
            });

            form.reset();
        } catch (err: any) {
            console.error('Error creating LoRA:', err);
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to create LoRA',
                color: 'red',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete confirmation
    const handleConfirmDelete = (loraId: string) => {
        setLoraToDelete(loraId);
        openDeleteModal();
    };

    const handleDeleteLora = async () => {
        if (!loraToDelete) return;

        try {
            setDeleting(true);
            const result = await deleteLora(loraToDelete);

            if (!result.success) {
                throw new Error(result.error);
            }

            notifications.show({
                title: 'Success',
                message: 'LoRA deleted successfully',
                color: 'green',
            });

            closeDeleteModal();
            setLoraToDelete(null);
        } catch (err: any) {
            console.error('Error deleting LoRA:', err);
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to delete LoRA',
                color: 'red',
            });
        } finally {
            setDeleting(false);
        }
    };

    // Get user display info
    const getUserDisplay = (userId: string | null) => {
        if (!userId) return null;
        const user = users.find(u => u.id === userId);
        if (!user) return userId;
        return user.displayName || user.username || user.email || userId;
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // User options for select
    const userOptions = users.map(user => ({
        value: user.id,
        label: user.displayName || user.username || user.email || user.id,
    }));

    // Render table rows
    const rows = loras.map((lora) => (
        <Table.Tr key={lora.id}>
            <Table.Td>
                <Group gap="sm">
                    <Avatar src={lora.thumbnailUrl} size="md" radius="sm" />
                    <div>
                        <Text fw={500}>{lora.displayName}</Text>
                        <Text size="xs" c="dimmed">{lora.loraName}</Text>
                    </div>
                </Group>
            </Table.Td>

            <Table.Td>
                {lora.isPublic ? (
                    <Group gap="xs">
                        <IconWorld size={16} />
                        <Text size="sm">Public</Text>
                    </Group>
                ) : (
                    <Group gap="xs">
                        <IconUser size={16} />
                        <Text size="sm">{getUserDisplay(lora.assignedUserId)}</Text>
                    </Group>
                )}
            </Table.Td>

            <Table.Td>
                {lora.isPublic && (
                    <Stack gap={4}>
                        {lora.isFree ? (
                            <Badge color="green" size="sm">Free</Badge>
                        ) : (
                            <Badge color="blue" size="sm" leftSection={<IconCurrencyDollar size={12} />}>
                                {lora.price} tokens
                            </Badge>
                        )}
                        {lora.isLimitedEdition && (
                            <Badge color="orange" size="sm" leftSection={<IconPackage size={12} />}>
                                {lora.purchasedCount}/{lora.availableQuantity}
                            </Badge>
                        )}
                    </Stack>
                )}
            </Table.Td>

            <Table.Td>
                <Text size="sm">{formatDate(lora.createdAt)}</Text>
            </Table.Td>

            <Table.Td>
                <Group gap={0} justify="flex-end">
                    <Tooltip label="Delete">
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleConfirmDelete(lora.id)}
                        >
                            <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="xl" py="xl">
            <Title order={2} mb="md">LoRA Management</Title>
            <Text c="dimmed" mb="xl">
                Create and manage custom trained LoRAs. Assign them to specific users or make them available in the marketplace.
            </Text>

            {/* Create LoRA Form */}
            <Paper withBorder p="lg" mb="xl">
                <Title order={4} mb="md">Create New LoRA</Title>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        {/* Basic Info */}
                        <SimpleGrid cols={{ base: 1, sm: 3 }}>
                            <TextInput
                                label="Display Name"
                                placeholder="e.g., Anime Style Girl"
                                description="The public name shown to users"
                                {...form.getInputProps('displayName')}
                            />
                            <TextInput
                                label="LoRA Name"
                                placeholder="e.g., anime_girl_v2.safetensors"
                                description="Must match the filename in storage bucket"
                                {...form.getInputProps('loraName')}
                            />
                            <TextInput
                                label="Trigger Keyword"
                                placeholder="e.g., anime_girl"
                                description="Keyword that triggers this LoRA"
                                {...form.getInputProps('keyword')}
                            />
                        </SimpleGrid>

                        <Textarea
                            label="Description"
                            placeholder="Describe what this LoRA does, art style, etc."
                            minRows={3}
                            {...form.getInputProps('description')}
                        />

                        {/* Images */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <FileInput
                                label="Thumbnail Image"
                                placeholder="Upload thumbnail"
                                description="Main preview image"
                                accept="image/*"
                                leftSection={<IconPhoto size={16} />}
                                {...form.getInputProps('thumbnailImage')}
                            />
                            <FileInput
                                label="Display Images"
                                placeholder="Upload gallery images"
                                description="Additional preview images (optional)"
                                accept="image/*"
                                multiple
                                leftSection={<IconUpload size={16} />}
                                {...form.getInputProps('displayImages')}
                            />
                        </SimpleGrid>

                        <Divider my="sm" />

                        {/* Assignment */}
                        <Title order={5}>Assignment</Title>

                        <Select
                            label="Assignment Type"
                            data={[
                                { value: 'user', label: 'Assign to Specific User' },
                                { value: 'public', label: 'Public (Marketplace)' },
                            ]}
                            {...form.getInputProps('assignmentType')}
                        />

                        {form.values.assignmentType === 'user' && (
                            <Select
                                label="Assigned User"
                                placeholder="Select a user"
                                data={userOptions}
                                searchable
                                clearable
                                disabled={loadingUsers}
                                {...form.getInputProps('assignedUserId')}
                            />
                        )}

                        {form.values.assignmentType === 'public' && (
                            <>
                                <Switch
                                    label="Free LoRA"
                                    description="If disabled, users must pay tokens to access"
                                    {...form.getInputProps('isFree', { type: 'checkbox' })}
                                />

                                {!form.values.isFree && (
                                    <NumberInput
                                        label="Price (tokens)"
                                        placeholder="Enter price"
                                        min={1}
                                        {...form.getInputProps('price')}
                                    />
                                )}

                                <Switch
                                    label="Limited Edition"
                                    description="If enabled, only a limited quantity can be purchased"
                                    {...form.getInputProps('isLimitedEdition', { type: 'checkbox' })}
                                />

                                {form.values.isLimitedEdition && (
                                    <NumberInput
                                        label="Available Quantity"
                                        placeholder="Enter quantity"
                                        min={1}
                                        {...form.getInputProps('availableQuantity')}
                                    />
                                )}
                            </>
                        )}

                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={submitting}
                            mt="md"
                        >
                            Create LoRA
                        </Button>
                    </Stack>
                </form>
            </Paper>

            <Divider my="lg" />

            {/* LoRAs Table */}
            <Title order={4} mb="md">Existing LoRAs</Title>

            {error && (
                <Alert color="red" mb="md" title="Error">
                    {error}
                </Alert>
            )}

            {loading ? (
                <Group justify="center" p="xl">
                    <Loader />
                </Group>
            ) : loras.length === 0 ? (
                <Text c="dimmed" ta="center" p="xl">
                    No LoRAs found. Create your first one using the form above.
                </Text>
            ) : (
                <Table.ScrollContainer minWidth={800}>
                    <Table verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>LoRA</Table.Th>
                                <Table.Th>Assignment</Table.Th>
                                <Table.Th>Marketplace</Table.Th>
                                <Table.Th>Created</Table.Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={closeDeleteModal}
                title={
                    <Group>
                        <IconAlertCircle size={20} color="var(--mantine-color-red-6)" />
                        <Text>Delete LoRA</Text>
                    </Group>
                }
                centered
            >
                <Text mb="md">
                    Are you sure you want to delete this LoRA? This will also delete all associated images. This action cannot be undone.
                </Text>

                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={closeDeleteModal}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={handleDeleteLora}
                        loading={deleting}
                    >
                        Delete
                    </Button>
                </Group>
            </Modal>
        </Container>
    );
}
