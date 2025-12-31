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
    Title,
    Stack,
    Loader,
    Alert,
    Tooltip,
    Divider,
    Modal
} from '@mantine/core';
import { IconTrash, IconCopy, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { usePromoCodeManagement } from '@/hooks/admin/usePromo';

interface PromoFormValues {
    tokenAmount: number;
    description: string;
    expirationDays: number;
}

export default function PromoCodesPage() {
    const {
        promoCodes,
        loading,
        error,
        fetchPromoCodes,
        createPromoCode,
        deletePromoCode
    } = usePromoCodeManagement();

    const [submitting, setSubmitting] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const form = useForm<PromoFormValues>({
        initialValues: {
            tokenAmount: 500,
            description: 'Promotional tokens',
            expirationDays: 7,
        },
        validate: {
            tokenAmount: (value) =>
                value <= 0 || value > 10000
                    ? 'Token amount must be between 1 and 10000'
                    : null,
            description: (value) =>
                !value.trim()
                    ? 'Description is required'
                    : null,
            expirationDays: (value) =>
                value <= 0 || value > 365
                    ? 'Expiration days must be between 1 and 365'
                    : null,
        },
    });

    useEffect(() => {
        fetchPromoCodes();
    }, [fetchPromoCodes]);

    // Handle form submission
    const handleSubmit = async (values: PromoFormValues) => {
        try {
            setSubmitting(true);

            const result = await createPromoCode(values);

            if (!result.success) {
                throw new Error(result.error);
            }

            // Show success notification
            notifications.show({
                title: 'Success',
                message: `Promo code ${result.promoCode} created successfully`,
                color: 'green',
            });

            // Reset form
            form.reset();

        } catch (err: any) {
            console.error('Error creating promo code:', err);
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to create promo code',
                color: 'red',
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Copy promo code to clipboard
    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Open delete confirmation modal
    const openDeleteModal = (code: string) => {
        setCodeToDelete(code);
        setDeleteModalOpen(true);
    };

    // Handle promo code deletion
    const handleDeletePromoCode = async () => {
        if (!codeToDelete) return;

        try {
            setDeleting(true);

            const result = await deletePromoCode(codeToDelete);

            if (!result.success) {
                throw new Error(result.error);
            }

            notifications.show({
                title: 'Success',
                message: 'Promo code deleted successfully',
                color: 'green',
            });

            setDeleteModalOpen(false);
            setCodeToDelete(null);

        } catch (err: any) {
            console.error('Error deleting promo code:', err);
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to delete promo code',
                color: 'red',
            });
        } finally {
            setDeleting(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Render promo code status badge
    const renderStatusBadge = (promoCode: any) => {
        const now = new Date();
        const expiresAt = new Date(promoCode.expiresAt);

        if (promoCode.isUsed) {
            return <Badge color="gray">Used</Badge>;
        } else if (expiresAt < now) {
            return <Badge color="red">Expired</Badge>;
        } else {
            return <Badge color="green">Active</Badge>;
        }
    };

    // Render table rows
    const rows = promoCodes.map((promoCode) => (
        <Table.Tr key={promoCode.code}>
            <Table.Td>
                <Group gap="xs">
                    <Text fw={500}>{promoCode.code}</Text>
                    <Tooltip label={copiedCode === promoCode.code ? "Copied!" : "Copy code"}>
                        <ActionIcon
                            variant="subtle"
                            color={copiedCode === promoCode.code ? "green" : "gray"}
                            onClick={() => copyToClipboard(promoCode.code)}
                        >
                            {copiedCode === promoCode.code ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>

            <Table.Td>
                <Text>{promoCode.tokenAmount}</Text>
            </Table.Td>

            <Table.Td>
                <Text>{promoCode.description}</Text>
            </Table.Td>

            <Table.Td>
                {renderStatusBadge(promoCode)}
            </Table.Td>

            <Table.Td>
                <Text size="sm">{formatDate(promoCode.createdAt)}</Text>
            </Table.Td>

            <Table.Td>
                <Text size="sm">{formatDate(promoCode.expiresAt)}</Text>
            </Table.Td>

            <Table.Td>
                {promoCode.isUsed ? (
                    <Text size="sm">Used by: {promoCode.usedBy}</Text>
                ) : (
                    <Group gap={0} justify="flex-end">
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => openDeleteModal(promoCode.code)}
                        >
                            <IconTrash size={16} stroke={1.5} />
                        </ActionIcon>
                    </Group>
                )}
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="lg" py="xl">
            <Title order={2} mb="md">Promo Code Management</Title>

            {/* Create Promo Code Form */}
            <Paper withBorder p="md" mb="xl">
                <Title order={4} mb="md">Create New Promo Code</Title>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack>
                        <Group grow>
                            <NumberInput
                                label="Token Amount"
                                placeholder="Enter token amount"
                                min={1}
                                max={10000}
                                {...form.getInputProps('tokenAmount')}
                            />

                            <NumberInput
                                label="Expiration (days)"
                                placeholder="Enter expiration in days"
                                min={1}
                                max={365}
                                {...form.getInputProps('expirationDays')}
                            />
                        </Group>

                        <TextInput
                            label="Description"
                            placeholder="Enter promo code description"
                            {...form.getInputProps('description')}
                        />

                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={submitting}
                        >
                            Create Promo Code
                        </Button>
                    </Stack>
                </form>
            </Paper>

            <Divider my="lg" />

            {/* Promo Codes Table */}
            <Title order={4} mb="md">Existing Promo Codes</Title>

            {error && (
                <Alert color="red" mb="md" title="Error">
                    {error}
                </Alert>
            )}

            {loading ? (
                <Group justify="center" p="xl">
                    <Loader />
                </Group>
            ) : promoCodes.length === 0 ? (
                <Text c="dimmed" ta="center" p="xl">
                    No promo codes found. Create your first one using the form above.
                </Text>
            ) : (
                <Table.ScrollContainer minWidth={800}>
                    <Table verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Code</Table.Th>
                                <Table.Th>Tokens</Table.Th>
                                <Table.Th>Description</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Created</Table.Th>
                                <Table.Th>Expires</Table.Th>
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
                onClose={() => setDeleteModalOpen(false)}
                title={
                    <Group>
                        <IconAlertCircle size={20} color="var(--mantine-color-red-6)" />
                        <Text>Delete Promo Code</Text>
                    </Group>
                }
                centered
            >
                <Text mb="md">
                    Are you sure you want to delete the promo code <b>{codeToDelete}</b>? This action cannot be undone.
                </Text>

                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={handleDeletePromoCode}
                        loading={deleting}
                    >
                        Delete
                    </Button>
                </Group>
            </Modal>
        </Container>
    );
}