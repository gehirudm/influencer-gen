'use client';

import { useState, useEffect } from 'react';
import {
    ActionIcon,
    Badge,
    Button,
    Container,
    Group,
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
    Modal,
    Select,
    NumberInput,
    Avatar,
    Switch,
    Menu,
    Pagination
} from '@mantine/core';
import { IconSearch, IconFilter, IconAdjustments, IconChevronDown, IconChevronUp, IconEdit, IconShield, IconCoin, IconUserCheck, IconUserX } from '@tabler/icons-react';
import { useUserManagement } from '@/hooks/admin/useUsers';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

export default function UsersManagementPage() {
    const {
        users,
        loading,
        loadingMore,
        error,
        hasMore,
        totalUsers,
        fetchUsers,
        loadMoreUsers,
        sortDirection,
        setSortDirection,
        filterOptions,
        setFilterOptions,
        makeUserAdmin,
        updateUserTokens,
        updateUserPaidStatus
    } = useUserManagement();

    // UI state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterField, setFilterField] = useState<string>('email');
    const [adminFilter, setAdminFilter] = useState<string | null>(null);
    const [paidFilter, setPaidFilter] = useState<string | null>(null);

    // Modal states
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [editTokens, setEditTokens] = useState<number>(0);
    const [editPaidStatus, setEditPaidStatus] = useState<boolean>(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Admin toggle confirmation modal
    const [adminModalOpened, { open: openAdminModal, close: closeAdminModal }] = useDisclosure(false);
    const [userToToggleAdmin, setUserToToggleAdmin] = useState<{ id: string, isAdmin: boolean } | null>(null);

    // Apply filters when search is submitted
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setFilterOptions({
            ...filterOptions,
            searchQuery: searchQuery,
            filterField: filterField as any
        });

        fetchUsers(true);
    };

    // Apply admin and subscription filters
    useEffect(() => {
        const newFilterOptions: any = { ...filterOptions };

        if (adminFilter) {
            newFilterOptions.isAdmin = adminFilter === 'admin';
        } else {
            delete newFilterOptions.isAdmin;
        }

        if (paidFilter && paidFilter !== 'all') {
            newFilterOptions.isPaidCustomer = paidFilter === 'paid';
        } else {
            delete newFilterOptions.isPaidCustomer;
        }

        setFilterOptions(newFilterOptions);
        fetchUsers(true);
    }, [adminFilter, paidFilter]);

    // Toggle sort direction
    const toggleSortDirection = () => {
        const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDirection);
        fetchUsers(true);
    };

    // Open edit modal for a user
    const handleEditUser = (user: any) => {
        setSelectedUser(user);
        setEditTokens(user.tokens);
        setEditPaidStatus(user.isPaidCustomer);
        openEditModal();
    };

    // Handle admin toggle
    const handleToggleAdmin = (userId: string, currentStatus: boolean) => {
        setUserToToggleAdmin({ id: userId, isAdmin: !currentStatus });
        openAdminModal();
    };

    // Confirm admin status change
    const confirmAdminChange = async () => {
        if (!userToToggleAdmin) return;

        setIsUpdating(true);
        try {
            const result = await makeUserAdmin(userToToggleAdmin.id, userToToggleAdmin.isAdmin);

            if (!result.success) {
                throw new Error(result.error);
            }

            notifications.show({
                title: 'Success',
                message: `User admin status updated successfully`,
                color: 'green',
            });

            closeAdminModal();
        } catch (err: any) {
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to update admin status',
                color: 'red',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Save user changes
    const saveUserChanges = async () => {
        if (!selectedUser) return;

        setIsUpdating(true);
        try {
            // Update tokens if changed
            if (editTokens !== selectedUser.tokens) {
                const tokenResult = await updateUserTokens(selectedUser.id, editTokens);
                if (!tokenResult.success) {
                    throw new Error(tokenResult.error);
                }
            }

            // Update paid status if changed
            if (editPaidStatus !== selectedUser.isPaidCustomer) {
                const paidResult = await updateUserPaidStatus(
                    selectedUser.id,
                    editPaidStatus
                );
                if (!paidResult.success) {
                    throw new Error(paidResult.error);
                }
            }

            notifications.show({
                title: 'Success',
                message: 'User updated successfully',
                color: 'green',
            });

            closeEditModal();
        } catch (err: any) {
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to update user',
                color: 'red',
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Render subscription badge
    const renderPaidBadge = (isPaidCustomer: boolean) => {
        return isPaidCustomer
            ? <Badge color="green">Paid</Badge>
            : <Badge color="gray">Free</Badge>;
    };

    // Render table rows
    const rows = users.map((user) => (
        <Table.Tr key={user.id}>
            <Table.Td>
                <Group gap="sm">
                    <Avatar src={user.avatarUrl} radius="xl" size="sm" />
                    <div>
                        <Text size="sm" fw={500}>{user.displayName || 'No Name'}</Text>
                        <Text size="xs" c="dimmed">@{user.username || 'no-username'}</Text>
                    </div>
                </Group>
            </Table.Td>

            <Table.Td>
                <Text size="sm">{user.email || 'No Email'}</Text>
            </Table.Td>

            <Table.Td>
                <Group gap="xs">
                    <IconCoin size={16} />
                    <Text>{user.tokens}</Text>
                </Group>
            </Table.Td>

            <Table.Td>
                {renderPaidBadge(user.isPaidCustomer)}
            </Table.Td>

            <Table.Td>
                <Badge color={user.isAdmin ? 'green' : 'gray'}>
                    {user.isAdmin ? 'Admin' : 'User'}
                </Badge>
            </Table.Td>

            <Table.Td>
                <Text size="sm">{formatDate(user.registeredDate)}</Text>
            </Table.Td>

            <Table.Td>
                <Group gap={8} justify="flex-end">
                    <Tooltip label="Edit User">
                        <ActionIcon
                            variant="subtle"
                            onClick={() => handleEditUser(user)}
                        >
                            <IconEdit size={16} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label={user.isAdmin ? "Remove Admin" : "Make Admin"}>
                        <ActionIcon
                            variant="subtle"
                            color={user.isAdmin ? "red" : "blue"}
                            onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                        >
                            {user.isAdmin ? <IconUserX size={16} /> : <IconUserCheck size={16} />}
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="lg" py="xl">
            <Title order={2} mb="md">User Management</Title>

            {/* Filters and Search */}
            <Paper withBorder p="md" mb="xl">
                <Group justify="space-between" mb="md">
                    <Title order={4}>Filters</Title>
                    <Button
                        variant="subtle"
                        leftSection={<IconAdjustments size={16} />}
                        onClick={() => {
                            setSearchQuery('');
                            setAdminFilter(null);
                            setPaidFilter(null);
                            setFilterOptions({});
                            fetchUsers(true);
                        }}
                    >
                        Reset Filters
                    </Button>
                </Group>

                <Stack>
                    <Group grow>
                        {/* Search Form */}
                        <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}>
                            <Group grow>
                                <TextInput
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                    leftSection={<IconSearch size={16} />}
                                />

                                <Select
                                    value={filterField}
                                    onChange={(value) => setFilterField(value || 'email')}
                                    data={[
                                        { value: 'email', label: 'Email' },
                                        { value: 'username', label: 'Username' },
                                        { value: 'displayName', label: 'Display Name' }
                                    ]}
                                />

                                <Button type="submit">Search</Button>
                            </Group>
                        </form>
                    </Group>

                    <Group grow>
                        <Select
                            label="Admin Status"
                            placeholder="Filter by admin status"
                            value={adminFilter}
                            onChange={setAdminFilter}
                            data={[
                                { value: '', label: 'All Users' },
                                { value: 'admin', label: 'Admins Only' },
                                { value: 'user', label: 'Regular Users Only' }
                            ]}
                        />

                        <Select
                            label="Paid Status"
                            placeholder="Filter by paid status"
                            value={paidFilter}
                            onChange={setPaidFilter}
                            data={[
                                { value: 'all', label: 'All Users' },
                                { value: 'paid', label: 'Paid Customers' },
                                { value: 'free', label: 'Free Users' }
                            ]}
                        />
                    </Group>
                </Stack>
            </Paper>

            {/* Users Table */}
            <Paper withBorder p="md" mb="md">
                <Group justify="space-between" mb="md">
                    <Group>
                        <Title order={4}>Users</Title>
                        <Text c="dimmed" size="sm">({totalUsers} total)</Text>
                    </Group>

                    <Button
                        variant="subtle"
                        onClick={toggleSortDirection}
                        rightSection={
                            sortDirection === 'asc'
                                ? <IconChevronUp size={16} />
                                : <IconChevronDown size={16} />
                        }
                    >
                        Registration Date: {sortDirection === 'asc' ? 'Oldest First' : 'Newest First'}
                    </Button>
                </Group>

                {error && (
                    <Alert color="red" mb="md" title="Error">
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Group justify="center" p="xl">
                        <Loader />
                    </Group>
                ) : users.length === 0 ? (
                    <Text c="dimmed" ta="center" p="xl">
                        No users found matching your filters.
                    </Text>
                ) : (
                    <>
                        <Table.ScrollContainer minWidth={800}>
                            <Table verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>User</Table.Th>
                                        <Table.Th>Email</Table.Th>
                                        <Table.Th>Tokens</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Role</Table.Th>
                                        <Table.Th>Registered</Table.Th>
                                        <Table.Th />
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>

                        {hasMore && (
                            <Group justify="center" mt="md">
                                <Button
                                    onClick={loadMoreUsers}
                                    loading={loadingMore}
                                    disabled={loadingMore || !hasMore}
                                    variant="outline"
                                >
                                    Load More
                                </Button>
                            </Group>
                        )}
                    </>
                )}
            </Paper>

            {/* Edit User Modal */}
            <Modal
                opened={editModalOpened}
                onClose={closeEditModal}
                title={<Title order={4}>Edit User: {selectedUser?.displayName || selectedUser?.username || 'User'}</Title>}
                centered
                size="md"
            >
                {selectedUser && (
                    <Stack>
                        <Group gap="sm">
                            <Avatar src={selectedUser.avatarUrl} size="lg" radius="xl" />
                            <div>
                                <Text fw={500}>{selectedUser.displayName || 'No Display Name'}</Text>
                                <Text size="sm" c="dimmed">@{selectedUser.username || 'no-username'}</Text>
                                <Text size="sm">{selectedUser.email}</Text>
                            </div>
                        </Group>

                        <Divider my="xs" />

                        <NumberInput
                            label="Tokens"
                            description="Adjust user's token balance"
                            value={editTokens}
                            onChange={(val) => setEditTokens(+val || 0)}
                            min={0}
                            max={100000}
                            leftSection={<IconCoin size={16} />}
                        />

                        <Switch
                            label="Paid Customer"
                            description="Toggle user's paid status"
                            checked={editPaidStatus}
                            onChange={(event) => setEditPaidStatus(event.currentTarget.checked)}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeEditModal}>
                                Cancel
                            </Button>
                            <Button
                                onClick={saveUserChanges}
                                loading={isUpdating}
                            >
                                Save Changes
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Admin Toggle Confirmation Modal */}
            <Modal
                opened={adminModalOpened}
                onClose={closeAdminModal}
                title={
                    <Group>
                        <IconShield size={20} color={userToToggleAdmin?.isAdmin ? "var(--mantine-color-green-6)" : "var(--mantine-color-red-6)"} />
                        <Text>{userToToggleAdmin?.isAdmin ? "Make User Admin" : "Remove Admin Status"}</Text>
                    </Group>
                }
                centered
            >
                <Text mb="md">
                    Are you sure you want to {userToToggleAdmin?.isAdmin ? "grant admin privileges to" : "remove admin privileges from"} this user?
                </Text>

                <Alert color={userToToggleAdmin?.isAdmin ? "green" : "red"} mb="md">
                    {userToToggleAdmin?.isAdmin
                        ? "This will give the user full administrative access to the system."
                        : "This will remove the user's administrative access to the system."
                    }
                </Alert>

                <Group justify="flex-end" mt="xl">
                    <Button variant="default" onClick={closeAdminModal}>
                        Cancel
                    </Button>
                    <Button
                        color={userToToggleAdmin?.isAdmin ? "green" : "red"}
                        onClick={confirmAdminChange}
                        loading={isUpdating}
                    >
                        Confirm
                    </Button>
                </Group>
            </Modal>
        </Container>
    );
}