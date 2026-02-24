'use client'

import { useState, useMemo } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import {
	Box,
	Title,
	Text,
	Card,
	Group,
	Stack,
	ActionIcon,
	Badge,
	Button,
	Menu,
	Select,
	Loader,
	Tooltip,
	Modal,
} from '@mantine/core';
import {
	IconTrash,
	IconDots,
	IconCheck,
	IconChecks,
	IconFilter,
	IconSortDescending,
	IconSortAscending,
	IconInbox,
	IconSparkles,
	IconShoppingCart,
	IconCoin,
	IconAlertTriangle,
	IconTrophy,
} from '@tabler/icons-react';
import { useInboxNotifications, InboxNotification, NotificationType } from '@/hooks/useInboxNotifications';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications } from '@/app/actions/notifications/notifications';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
	welcome: <IconSparkles size={20} />,
	purchase: <IconShoppingCart size={20} />,
	credits: <IconCoin size={20} />,
	warning: <IconAlertTriangle size={20} />,
	achievement: <IconTrophy size={20} />,
};

const notificationColors: Record<NotificationType, string> = {
	welcome: 'cyan',
	purchase: 'green',
	credits: 'violet',
	warning: 'orange',
	achievement: 'yellow',
};

export default function InboxPage() {
	const { notifications: inboxNotifications, unreadCount, loading } = useInboxNotifications();
	const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'read' | 'unread'>('newest');
	const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
	const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
	const [selectedNotification, setSelectedNotification] = useState<InboxNotification | null>(null);
	const [modalOpened, setModalOpened] = useState(false);
	const router = useRouter();
	const isMobile = useMediaQuery('(max-width: 768px)');

	const sortedAndFilteredNotifications = useMemo(() => {
		let filtered = [...inboxNotifications];

		// Filter
		if (filterBy === 'unread') {
			filtered = filtered.filter(n => !n.read);
		}

		// Sort
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'newest':
					return b.createdAt.toMillis() - a.createdAt.toMillis();
				case 'oldest':
					return a.createdAt.toMillis() - b.createdAt.toMillis();
				case 'read':
					return (a.read ? 1 : 0) - (b.read ? 1 : 0);
				case 'unread':
					return (b.read ? 1 : 0) - (a.read ? 1 : 0);
				default:
					return 0;
			}
		});

		return filtered;
	}, [inboxNotifications, sortBy, filterBy]);

	const handleNotificationClick = async (notification: InboxNotification) => {
		if (!notification.read) {
			setProcessingIds(prev => new Set(prev).add(notification.id));
			const result = await markNotificationAsRead(notification.id);
			setProcessingIds(prev => {
				const next = new Set(prev);
				next.delete(notification.id);
				return next;
			});

			if (!result.success) {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to mark notification as read',
					color: 'red',
				});
			}
		}

		// Open modal to show full content
		setSelectedNotification(notification);
		setModalOpened(true);
	};

	const handleModalClose = () => {
		setModalOpened(false);
		setSelectedNotification(null);
	};

	const handleViewLink = () => {
		if (selectedNotification?.link) {
			router.push(selectedNotification.link);
			handleModalClose();
		}
	};

	const truncateText = (text: string, maxLength: number = 100) => {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	};

	const handleMarkAllAsRead = async () => {
		const result = await markAllNotificationsAsRead();
		if (result.success) {
			notifications.show({
				title: 'Success',
				message: 'All notifications marked as read',
				color: 'green',
			});
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to mark all as read',
				color: 'red',
			});
		}
	};

	const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
		event.stopPropagation();
		setProcessingIds(prev => new Set(prev).add(notificationId));
		const result = await deleteNotification(notificationId);
		setProcessingIds(prev => {
			const next = new Set(prev);
			next.delete(notificationId);
			return next;
		});

		if (result.success) {
			notifications.show({
				title: 'Deleted',
				message: 'Notification deleted successfully',
				color: 'green',
			});
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to delete notification',
				color: 'red',
			});
		}
	};

	const handleDeleteAll = async () => {
		const result = await deleteAllNotifications();
		if (result.success) {
			notifications.show({
				title: 'Success',
				message: 'All notifications deleted',
				color: 'green',
			});
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to delete all notifications',
				color: 'red',
			});
		}
	};

	const formatTimestamp = (timestamp: any) => {
		const date = timestamp.toDate();
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	if (loading) {
		return (
			<Box style={{ padding: '0.75rem', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Loader size="lg" />
			</Box>
		);
	}

	return (
		<Box style={{ padding: isMobile ? '0' : '0.75rem', height: '100%' }} pt={{ base: 'sm', md: 0 }} px={{ base: 'sm', md: '0.75rem' }}>
			<Stack gap="md">
				{/* Header */}
				<Group justify="space-between" align="center">
					<Group gap="sm">
						<IconInbox size={28} />
						<Title size={36} c="white">Inbox</Title>
						{unreadCount > 0 && (
							<Badge size="lg" circle color="red">
								{unreadCount}
							</Badge>
						)}
					</Group>

					<Group gap="sm">
						{unreadCount > 0 && (
							<Button
								variant="light"
								size="sm"
								leftSection={<IconChecks size={16} />}
								onClick={handleMarkAllAsRead}
							>
								Mark All Read
							</Button>
						)}
						<Menu position="bottom-end">
							<Menu.Target>
								<ActionIcon variant="subtle" size="lg">
									<IconDots size={20} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
									leftSection={<IconTrash size={16} />}
									color="red"
									onClick={handleDeleteAll}
									disabled={inboxNotifications.length === 0}
								>
									Delete All
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</Group>
				</Group>

				{/* Toolbar */}
				<Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					<Group justify="space-between" align="flex-end" wrap="nowrap">
						<Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
							<Select
								label={isMobile ? undefined : 'Filter'}
								placeholder="Filter"
								value={filterBy}
								onChange={(value) => setFilterBy(value as 'all' | 'unread')}
								data={[
									{ value: 'all', label: isMobile ? 'All' : 'All Notifications' },
									{ value: 'unread', label: isMobile ? 'Unread' : 'Unread Only' },
								]}
								leftSection={<IconFilter size={16} />}
								style={{ width: isMobile ? 120 : 160 }}
							/>
							<Select
								label={isMobile ? undefined : 'Sort By'}
								placeholder="Sort"
								value={sortBy}
								onChange={(value) => setSortBy(value as any)}
								data={[
									{ value: 'newest', label: isMobile ? 'Newest' : 'Newest First' },
									{ value: 'oldest', label: isMobile ? 'Oldest' : 'Oldest First' },
									{ value: 'unread', label: isMobile ? 'Unread' : 'Unread First' },
									{ value: 'read', label: isMobile ? 'Read' : 'Read First' },
								]}
								leftSection={sortBy === 'newest' || sortBy === 'unread' ? <IconSortDescending size={16} /> : <IconSortAscending size={16} />}
								style={{ width: isMobile ? 120 : 160 }}
							/>
						</Group>

						<Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
							{isMobile ? sortedAndFilteredNotifications.length : `${sortedAndFilteredNotifications.length} notification${sortedAndFilteredNotifications.length !== 1 ? 's' : ''}`}
						</Text>
					</Group>
				</Card>

				{/* Notifications List */}
				{sortedAndFilteredNotifications.length === 0 ? (
					<Card p="xl" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', textAlign: 'center' }}>
						<Stack align="center" gap="md">
							<IconInbox size={64} color="#666" />
							<Title size="h4" c="dimmed">No notifications</Title>
							<Text size="sm" c="dimmed">
								{filterBy === 'unread' 
									? "You're all caught up! No unread notifications."
									: "You don't have any notifications yet."}
							</Text>
						</Stack>
					</Card>
				) : (
					<Stack gap="md">
						{sortedAndFilteredNotifications.map((notification) => (
							<Card
								key={notification.id}
								p="md"
								style={{
									background: notification.read 
										? '#111' 
										: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%), #0a0a0a',
									border: '1px solid #333',
									cursor: 'pointer',
									opacity: processingIds.has(notification.id) ? 0.6 : 1,
									transition: 'all 0.2s',
								}}
								onClick={() => handleNotificationClick(notification)}
								onMouseEnter={(e) => {
									e.currentTarget.style.borderColor = '#555';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.borderColor = '#333';
								}}
							>
								<Stack gap="sm">
<Group justify="space-between" align="flex-start" wrap={isMobile ? 'wrap' : 'nowrap'}>
							<Group gap="sm" style={{ flex: 1, minWidth: 0 }}>

											<Text size="md" fw={600} c="blue">
												{notification.title}
											</Text>
											{!notification.read && (
												<Badge size="xs" color="blue" variant="dot">
													New
												</Badge>
											)}
										</Group>
										<Group gap="xs">
											{!notification.read && (
												<Tooltip label="Mark as read">
													<ActionIcon
														variant="subtle"
														color="blue"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															handleNotificationClick(notification);
														}}
														disabled={processingIds.has(notification.id)}
													>
														<IconCheck size={16} />
													</ActionIcon>
												</Tooltip>
											)}
											<Tooltip label="Delete">
												<ActionIcon
													variant="subtle"
													color="red"
													size="sm"
													onClick={(e) => handleDeleteNotification(notification.id, e)}
													disabled={processingIds.has(notification.id)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Tooltip>
										</Group>
									</Group>

									<Text size="sm" c="dimmed">
										{truncateText(notification.message)}
									</Text>

									{notification.link && (
										<Text size="xs" c="blue">
											Link: {notification.link}
										</Text>
									)}

								<Group justify="space-between" align="center">
									<Group gap="xs">
										<Badge 
											color={notificationColors[notification.type]} 
											size="sm"
											variant="light"
										>
											{notification.type}
										</Badge>
										<Text size="xs" c="dimmed">
											{formatTimestamp(notification.createdAt)}
										</Text>
									</Group>
									</Group>
								</Stack>
							</Card>
						))}
					</Stack>
				)}

				{/* Notification Detail Modal */}
				<Modal
					opened={modalOpened}
					onClose={handleModalClose}
					title={
						<Group gap="sm">
							{selectedNotification && (
								<Badge
									size="lg"
									color={notificationColors[selectedNotification.type]}
									variant="light"
								>
									{notificationIcons[selectedNotification.type]}
								</Badge>
							)}
							<Text fw={600} c="blue">{selectedNotification?.title}</Text>
						</Group>
					}
					size="xl"
					centered
				>
					{selectedNotification && (
						<Stack gap="md">
							<Text size="sm" c="dimmed">
								{formatTimestamp(selectedNotification.createdAt)}
							</Text>
							
							<Text size="md" style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
								{selectedNotification.message}
							</Text>

							{selectedNotification.link && (
								<Button
									fullWidth
									mt="md"
									onClick={handleViewLink}
								>
									View Details →
								</Button>
							)}
						</Stack>
					)}
				</Modal>
			</Stack>
		</Box>
	);
}
