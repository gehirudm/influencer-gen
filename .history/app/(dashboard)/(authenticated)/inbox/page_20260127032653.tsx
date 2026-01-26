'use client'

import { useState, useMemo } from 'react';
import {
    Box,
    Title,
    Card,
    Text,
    Group,
    Button,
    Badge,
    Stack,
    Checkbox,
    Select,
    ActionIcon,
    Loader,
    Center,
    Menu,
    Divider,
    Anchor,
    Alert
} from '@mantine/core';
import {
    IconTrash,
    IconCheck,
    IconDots,
    IconInbox,
    IconBell,
    IconGift,
    IconAlertTriangle,
    IconSparkles,
    IconShoppingBag
} from '@tabler/icons-react';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import type { InboxNotification } from '@/types/types';

type WithId<T> = T & { id: string };

const notificationIcons = {
    welcome: IconSparkles,
    purchase: IconShoppingBag,
    credits: IconGift,
    low_tokens: IconAlertTriangle,
    first_image: IconBell,
    custom: IconInbox
};

const notificationColors = {
    welcome: 'blue',
    purchase: 'green',
    credits: 'violet',
    low_tokens: 'orange',
    first_image: 'cyan',
    custom: 'gray'
};

export default function InboxPage() {
    const router = useRouter();
    const { 
        notifications: userNotifications, 
        unreadCount, 
        loading, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification, 
        deleteMultiple 
    } = useUserNotifications();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'unread' | 'read'>('newest');
    const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');

    // Sort and filter notifications
    const filteredNotifications = useMemo(() => {
        let filtered = [...userNotifications];

        // Apply filter
        if (filterBy === 'unread') {
            filtered = filtered.filter(n => !n.read);
        }

        // Apply sort
        filtered.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (sortBy === 'oldest') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === 'unread') {
                return (a.read ? 1 : 0) - (b.read ? 1 : 0);
            } else if (sortBy === 'read') {
                return (b.read ? 1 : 0) - (a.read ? 1 : 0);
            }
            return 0;
        });

        return filtered;
    }, [userNotifications, sortBy, filterBy]);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredNotifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredNotifications.map(n => n.id));
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        try {
            await deleteMultiple(selectedIds);
            setSelectedIds([]);
            notifications.show({
                title: 'Success',
                message: `Deleted ${selectedIds.length} notification(s)`,
                color: 'green'
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to delete notifications',
                color: 'red'
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            notifications.show({
                title: 'Success',
                message: 'All notifications marked as read',
                color: 'green'
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to mark notifications as read',
                color: 'red'
            });
        }
    };

    const handleNotificationClick = async (notification: WithId<InboxNotification>) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        if (notification.link) {
            router.push(notification.link);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <Box style={{ padding: '0.75rem', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader size="lg" />
            </Box>
        );
    }

    return (
        <Box style={{ padding: '0.75rem', height: '100%' }}>
            <Stack gap="md">
                <Group justify="space-between" align="center">
                    <Title size="h3" c="white">
                        Inbox {unreadCount > 0 && <Badge size="lg" color="red" circle>{unreadCount}</Badge>}
                    </Title>
                </Group>

                {/* Toolbar */}
                <Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
                    <Group justify="space-between" wrap="wrap">
                        <Group gap="sm">
                            <Checkbox
                                checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                                indeterminate={selectedIds.length > 0 && selectedIds.length < filteredNotifications.length}
                                onChange={handleSelectAll}
                                label="Select all"
                            />
                            
                            {selectedIds.length > 0 && (
                                <Button
                                    size="xs"
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={handleDeleteSelected}
                                >
                                    Delete ({selectedIds.length})
                                </Button>
                            )}
                        </Group>

                        <Group gap="sm">
                            <Select
                                size="xs"
                                value={filterBy}
                                onChange={(value) => setFilterBy(value as 'all' | 'unread')}
                                data={[
                                    { value: 'all', label: 'All' },
                                    { value: 'unread', label: 'Unread only' }
                                ]}
                                style={{ width: 120 }}
                            />

                            <Select
                                size="xs"
                                value={sortBy}
                                onChange={(value) => setSortBy(value as any)}
                                data={[
                                    { value: 'newest', label: 'Newest first' },
                                    { value: 'oldest', label: 'Oldest first' },
                                    { value: 'unread', label: 'Unread first' },
                                    { value: 'read', label: 'Read first' }
                                ]}
                                style={{ width: 140 }}
                            />

                            {unreadCount > 0 && (
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconCheck size={16} />}
                                    onClick={handleMarkAllAsRead}
                                >
                                    Mark all read
                                </Button>
                            )}
                        </Group>
                    </Group>
                </Card>

                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                    <Center style={{ height: '50vh' }}>
                        <Stack align="center" gap="md">
                            <IconInbox size={64} color="#666" />
                            <Text size="lg" c="dimmed">
                                {filterBy === 'unread' ? 'No unread notifications' : 'Your inbox is empty'}
                            </Text>
                        </Stack>
                    </Center>
                ) : (
                    <Stack gap="sm">
                        {filteredNotifications.map((notification) => {
                            const Icon = notificationIcons[notification.type];
                            const color = notificationColors[notification.type];
                            
                            return (
                                <Card
                                    key={notification.id}
                                    p="md"
                                    style={{
                                        backgroundColor: notification.read ? '#0a0a0a' : '#1a1a1a',
                                        border: `1px solid ${notification.read ? '#333' : '#444'}`,
                                        cursor: notification.link ? 'pointer' : 'default',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <Group wrap="nowrap" align="flex-start" gap="md">
                                        <Checkbox
                                            checked={selectedIds.includes(notification.id)}
                                            onChange={() => handleSelectOne(notification.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />

                                        <Icon size={24} color={`var(--mantine-color-${color}-5)`} />

                                        <Stack gap="xs" style={{ flex: 1 }}>
                                            <Group justify="space-between" align="flex-start">
                                                <Group gap="xs">
                                                    <Text fw={notification.read ? 400 : 600} c="white">
                                                        {notification.title}
                                                    </Text>
                                                    {!notification.read && (
                                                        <Badge size="xs" color={color}>New</Badge>
                                                    )}
                                                </Group>

                                                <Group gap="xs">
                                                    <Text size="xs" c="dimmed">
                                                        {formatDate(notification.createdAt)}
                                                    </Text>

                                                    <Menu position="bottom-end" onClick={(e) => e.stopPropagation()}>
                                                        <Menu.Target>
                                                            <ActionIcon variant="subtle" color="gray" onClick={(e) => e.stopPropagation()}>
                                                                <IconDots size={16} />
                                                            </ActionIcon>
                                                        </Menu.Target>

                                                        <Menu.Dropdown>
                                                            {!notification.read && (
                                                                <Menu.Item
                                                                    leftSection={<IconCheck size={14} />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markAsRead(notification.id);
                                                                    }}
                                                                >
                                                                    Mark as read
                                                                </Menu.Item>
                                                            )}
                                                            <Menu.Item
                                                                leftSection={<IconTrash size={14} />}
                                                                color="red"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteNotification(notification.id);
                                                                    notifications.show({
                                                                        title: 'Deleted',
                                                                        message: 'Notification deleted',
                                                                        color: 'green'
                                                                    });
                                                                }}
                                                            >
                                                                Delete
                                                            </Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                </Group>
                                            </Group>

                                            <Text size="sm" c="dimmed">
                                                {notification.message}
                                            </Text>

                                            {notification.link && (
                                                <Anchor size="sm" c={color} onClick={(e) => e.stopPropagation()}>
                                                    View →
                                                </Anchor>
                                            )}
                                        </Stack>
                                    </Group>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}
