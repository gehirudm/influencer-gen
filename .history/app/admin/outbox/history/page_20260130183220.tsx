'use client'

import { useState, useEffect } from 'react';
import {
	Box,
	Title,
	Card,
	Text,
	Group,
	Stack,
	Button,
	Badge,
	Loader,
	Divider,
	ActionIcon,
	Tooltip,
	Menu,
} from '@mantine/core';
import {
	IconHistory,
	IconSparkles,
	IconShoppingCart,
	IconCoin,
	IconAlertTriangle,
	IconTrophy,
	IconTrash,
	IconDots,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getSentAnnouncements, deleteAnnouncement, clearAnnouncementHistory } from '@/app/actions/notifications/notifications';

interface SentAnnouncement {
	id: string;
	type: string;
	title: string;
	message: string;
	link?: string;
	targetType: 'all' | 'specific' | 'segment';
	targetDetails?: string;
	recipientCount: number;
	sentBy: string;
	sentAt: any;
}

const predefinedTypes = [
	{ value: 'welcome', label: 'Welcome', icon: <IconSparkles size={16} />, color: 'cyan' },
	{ value: 'purchase', label: 'Purchase', icon: <IconShoppingCart size={16} />, color: 'green' },
	{ value: 'credits', label: 'Credits', icon: <IconCoin size={16} />, color: 'violet' },
	{ value: 'warning', label: 'Warning', icon: <IconAlertTriangle size={16} />, color: 'orange' },
	{ value: 'achievement', label: 'Achievement', icon: <IconTrophy size={16} />, color: 'yellow' },
];

export default function AnnouncementHistoryPage() {
	const [sentAnnouncements, setSentAnnouncements] = useState<SentAnnouncement[]>([]);
	const [loading, setLoading] = useState(true);
	const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
	const [clearingAll, setClearingAll] = useState(false);

	useEffect(() => {
		loadHistory();
	}, []);

	const loadHistory = async () => {
		setLoading(true);
		const result = await getSentAnnouncements();
		if (result.success) {
			setSentAnnouncements(result.announcements);
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to load announcement history',
				color: 'red',
			});
		}
		setLoading(false);
	};

	const handleDelete = async (announcementId: string) => {
		setProcessingIds(prev => new Set(prev).add(announcementId));
		const result = await deleteAnnouncement(announcementId);
		setProcessingIds(prev => {
			const next = new Set(prev);
			next.delete(announcementId);
			return next;
		});

		if (result.success) {
			notifications.show({
				title: 'Deleted',
				message: 'Announcement deleted successfully',
				color: 'green',
			});
			await loadHistory();
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to delete announcement',
				color: 'red',
			});
		}
	};

	const handleClearHistory = async () => {
		if (!confirm('Are you sure you want to clear all announcement history? This action cannot be undone.')) {
			return;
		}

		setClearingAll(true);
		const result = await clearAnnouncementHistory();
		setClearingAll(false);

		if (result.success) {
			notifications.show({
				title: 'Success',
				message: `Cleared ${result.deletedCount} announcement(s)`,
				color: 'green',
			});
			await loadHistory();
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to clear history',
				color: 'red',
			});
		}
	};

	const formatTimestamp = (timestamp: any) => {
		if (!timestamp) return 'Unknown';
		const date = typeof timestamp === 'string' ? new Date(timestamp) : (timestamp.toDate ? timestamp.toDate() : new Date(timestamp));
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getTypeColor = (type: string) => {
		const predefined = predefinedTypes.find(t => t.value === type);
		return predefined ? predefined.color : 'gray';
	};

	return (
		<Box style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
			<Stack gap="lg">
				{/* Header */}
				<Group justify="space-between" align="center">
					<Group gap="sm">
						<IconHistory size={32} />
						<Title size="h2" c="white">Announcement History</Title>
					</Group>
					<Group gap="sm">
						<Button
							variant="light"
							size="sm"
							onClick={loadHistory}
							loading={loading}
						>
							Refresh
						</Button>
						{sentAnnouncements.length > 0 && (
							<Button
								variant="light"
								color="red"
								size="sm"
								leftSection={<IconTrash size={16} />}
								onClick={handleClearHistory}
								loading={clearingAll}
								disabled={loading}
							>
								Clear History
							</Button>
						)}
					</Group>
				</Group>

				{/* History Content */}
				<Card p="xl" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					{loading ? (
						<div style={{ textAlign: 'center', padding: '3rem' }}>
							<Loader size="lg" />
						</div>
					) : sentAnnouncements.length === 0 ? (
						<div style={{ textAlign: 'center', padding: '3rem' }}>
							<Text size="lg" c="dimmed">No announcements sent yet</Text>
						</div>
					) : (
						<Stack gap="md">
							{sentAnnouncements.map((announcement) => (
								<Card
									key={announcement.id}
									p="md"
									style={{
										backgroundColor: '#111',
										border: '1px solid #333',
									}}
								>
									<Stack gap="sm">
										<Group justify="space-between" align="flex-start">
										<Text size="md" fw={600} c="white">
											{announcement.title}
										</Text>
										<Group gap="xs">
											<Badge variant="light" color="blue">
												{announcement.recipientCount} recipient{announcement.recipientCount !== 1 ? 's' : ''}
											</Badge>
											<Tooltip label="Delete announcement">
												<ActionIcon
													variant="subtle"
													color="red"
													size="sm"
													onClick={() => handleDelete(announcement.id)}
													loading={processingIds.has(announcement.id)}
													disabled={processingIds.has(announcement.id)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Tooltip>
										</Group>

										{announcement.link && (
											<Text size="xs" c="blue">
												Link: {announcement.link}
											</Text>
										)}

										<Divider />

									<Group justify="space-between" align="center">
										<Group gap="xs">
											<Text size="xs" c="dimmed">
												Target: <strong>{announcement.targetType}</strong>
												{announcement.targetDetails && ` (${announcement.targetDetails})`}
											</Text>
										</Group>
										<Group gap="xs">
											<Badge color={getTypeColor(announcement.type)} size="sm" variant="light">
												{announcement.type}
											</Badge>
											<Text size="xs" c="dimmed">
												{formatTimestamp(announcement.sentAt)}
											</Text>
										</Group>
										</Group>
									</Stack>
								</Card>
							))}
						</Stack>
					)}
				</Card>
			</Stack>
		</Box>
	);
}
