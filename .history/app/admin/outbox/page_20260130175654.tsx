'use client'

import { useState } from 'react';
import {
	Box,
	Title,
	Card,
	Text,
	Group,
	Stack,
	Button,
	TextInput,
	Textarea,
	Select,
	Radio,
	Divider,
	Alert,
	TagsInput,
} from '@mantine/core';
import {
	IconSend,
	IconUser,
	IconUsers,
	IconWorld,
	IconTag,
	IconAlertCircle,
	IconCheck,
	IconSparkles,
	IconShoppingCart,
	IconCoin,
	IconAlertTriangle,
	IconTrophy,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
	sendNotificationToAll,
	sendNotificationToSpecific,
	sendNotificationToSegment,
} from '@/app/actions/notifications/notifications';

const predefinedTypes = [
	{ value: 'welcome', label: 'Welcome', icon: <IconSparkles size={16} />, color: 'cyan' },
	{ value: 'purchase', label: 'Purchase', icon: <IconShoppingCart size={16} />, color: 'green' },
	{ value: 'credits', label: 'Credits', icon: <IconCoin size={16} />, color: 'violet' },
	{ value: 'warning', label: 'Warning', icon: <IconAlertTriangle size={16} />, color: 'orange' },
	{ value: 'achievement', label: 'Achievement', icon: <IconTrophy size={16} />, color: 'yellow' },
];

const userSegments = [
	{ value: 'all', label: 'All Users' },
	{ value: 'free', label: 'Free Users' },
	{ value: 'premium', label: 'Premium Users' },
	{ value: 'low_tokens', label: 'Low Token Users (<100)' },
	{ value: 'active', label: 'Active Users (Last 30 days)' },
	{ value: 'inactive', label: 'Inactive Users (30+ days)' },
];

export default function AdminOutboxPage() {
	// Form state
	const [title, setTitle] = useState('');
	const [message, setMessage] = useState('');
	const [notificationType, setNotificationType] = useState<string>('custom');
	const [customType, setCustomType] = useState('');
	const [link, setLink] = useState('');
	const [targetType, setTargetType] = useState<'all' | 'specific' | 'segment'>('all');
	const [specificUserIds, setSpecificUserIds] = useState<string[]>([]);
	const [specificEmails, setSpecificEmails] = useState<string[]>([]);
	const [segment, setSegment] = useState<string>('all');
	
	// UI state
	const [sending, setSending] = useState(false);

	const handleSend = async () => {
		// Validation
		if (!title.trim()) {
			notifications.show({
				title: 'Validation Error',
				message: 'Title is required',
				color: 'red',
			});
			return;
		}

		if (!message.trim()) {
			notifications.show({
				title: 'Validation Error',
				message: 'Message is required',
				color: 'red',
			});
			return;
		}

		const finalType = notificationType === 'custom' ? (customType || 'custom') : notificationType;

		if (!finalType) {
			notifications.show({
				title: 'Validation Error',
				message: 'Notification type is required',
				color: 'red',
			});
			return;
		}

		if (targetType === 'specific' && specificUserIds.length === 0 && specificEmails.length === 0) {
			notifications.show({
				title: 'Validation Error',
				message: 'Please provide at least one user ID or email',
				color: 'red',
			});
			return;
		}

		setSending(true);

		try {
			let result;

			if (targetType === 'all') {
				result = await sendNotificationToAll({
					type: finalType,
					title,
					message,
					link: link || undefined,
				});
			} else if (targetType === 'specific') {
				result = await sendNotificationToSpecific({
					type: finalType,
					title,
					message,
					link: link || undefined,
					userIds: specificUserIds.length > 0 ? specificUserIds : undefined,
					emails: specificEmails.length > 0 ? specificEmails : undefined,
				});
			} else {
				result = await sendNotificationToSegment({
					type: finalType,
					title,
					message,
					link: link || undefined,
					segment: segment as any,
				});
			}

			if (result.success) {
				notifications.show({
					title: 'Success!',
					message: `Notification sent to ${result.recipientCount} user${result.recipientCount !== 1 ? 's' : ''}`,
					color: 'green',
					icon: <IconCheck size={16} />,
				});

				// Reset form
				setTitle('');
				setMessage('');
				setNotificationType('custom');
				setCustomType('');
				setLink('');
				setTargetType('all');
				setSpecificUserIds([]);
				setSpecificEmails([]);
				setSegment('all');
			} else {
				notifications.show({
					title: 'Error',
					message: result.error || 'Failed to send notification',
					color: 'red',
				});
			}
		} catch (error: any) {
			notifications.show({
				title: 'Error',
				message: error.message || 'An unexpected error occurred',
				color: 'red',
			});
		} finally {
			setSending(false);
		}
	};

	return (
		<Box style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
			<Stack gap="lg">
				{/* Header */}
				<Group justify="space-between" align="center">
					<Group gap="sm">
						<IconSend size={32} />
						<Title size="h2" c="white">Compose Announcement</Title>
					</Group>
				</Group>

				{/* Compose Form */}
				<Card p="xl" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					<Stack gap="lg">
						<Title size="h4" c="white">Create New Announcement</Title>

						<Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
							Notifications will be sent immediately to the selected audience. Make sure to review all details before sending.
						</Alert>

							{/* Notification Type */}
							<div>
								<Text size="sm" fw={500} mb="xs">Notification Type *</Text>
								<Radio.Group value={notificationType} onChange={setNotificationType}>
								<Group gap="md" wrap="wrap">
									{predefinedTypes.map((type) => (
										<Radio
											key={type.value}
											value={type.value}
											label={
												<Group gap="xs">
													{type.icon}
													<Text>{type.label}</Text>
												</Group>
											}
										/>
									))}
									<Radio
										value="custom"
										label="Custom Type"
									/>
								</Group>
							</Radio.Group>

							{notificationType === 'custom' && (
								<TextInput
										mt="sm"
									/>
								)}
							</div>

							{/* Title */}
							<TextInput
								label="Title"
								placeholder="Enter notification title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
								size="md"
							/>

							{/* Message */}
							<Textarea
								label="Message"
								placeholder="Enter notification message"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								required
								minRows={4}
								size="md"
							/>

							{/* Link (Optional) */}
							<TextInput
								label="Link (Optional)"
								placeholder="/pricing or https://example.com"
								value={link}
								onChange={(e) => setLink(e.target.value)}
								size="md"
							/>

							<Divider />

							{/* Target Audience */}
							<div>
								<Text size="sm" fw={500} mb="xs">Target Audience *</Text>
								<Radio.Group value={targetType} onChange={(value) => setTargetType(value as any)}>
									<Stack gap="xs">
										<Radio
											value="all"
											label={
												<Group gap="xs">
													<IconWorld size={18} />
													<Text>All Users</Text>
												</Group>
											}
										/>
										<Radio
											value="segment"
											label={
												<Group gap="xs">
													<IconUsers size={18} />
													<Text>User Segment</Text>
												</Group>
											}
										/>
										<Radio
											value="specific"
											label={
												<Group gap="xs">
													<IconUser size={18} />
													<Text>Specific Users</Text>
												</Group>
											}
										/>
									</Stack>
								</Radio.Group>

								{/* Segment Selection */}
								{targetType === 'segment' && (
									<Select
										label="Select Segment"
										placeholder="Choose a user segment"
										data={userSegments}
										value={segment}
										onChange={(value) => setSegment(value || 'all')}
										mt="md"
									/>
								)}

								{/* Specific Users */}
								{targetType === 'specific' && (
									<Stack gap="md" mt="md">
										<TagsInput
											label="User IDs"
											placeholder="Enter user IDs (press Enter after each)"
											value={specificUserIds}
											onChange={setSpecificUserIds}
											description="Enter Firebase user IDs, one at a time"
										/>
										<Text size="xs" c="dimmed" ta="center">OR</Text>
										<TagsInput
											label="User Emails/Usernames"
											placeholder="Enter emails or usernames (press Enter after each)"
											value={specificEmails}
											onChange={setSpecificEmails}
											description="Enter user emails or usernames, one at a time"
										/>
									</Stack>
								)}
							</div>

							<Divider />

							{/* Send Button */}
							<Group justify="flex-end">
								<Button
									size="lg"
									leftSection={<IconSend size={20} />}
									onClick={handleSend}
									loading={sending}
									disabled={sending}
								>
									{sending ? 'Sending...' : 'Send Notification'}
								</Button>
							</Group>
						</Stack>
					</Card>
				)}

				{/* History Tab */}
				{activeTab === 'history' && (
					<Card p="xl" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
						<Stack gap="lg">
							<Group justify="space-between">
								<Title size="h4" c="white">Announcement History</Title>
								<Button
									variant="light"
									size="sm"
									onClick={loadHistory}
									loading={loadingHistory}
								>
									Refresh
								</Button>
							</Group>

							{loadingHistory ? (
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
													<Group gap="sm">
														<Badge color={getTypeColor(announcement.type)} size="lg">
															{announcement.type}
														</Badge>
														<Text size="md" fw={600} c="white">
															{announcement.title}
														</Text>
													</Group>
													<Badge variant="light" color="blue">
														{announcement.recipientCount} recipient{announcement.recipientCount !== 1 ? 's' : ''}
													</Badge>
												</Group>

												<Text size="sm" c="dimmed">
													{announcement.message}
												</Text>

												{announcement.link && (
													<Text size="xs" c="blue">
														Link: {announcement.link}
													</Text>
												)}

												<Divider />

												<Group justify="space-between">
													<Group gap="xs">
														<Text size="xs" c="dimmed">
															Target: <strong>{announcement.targetType}</strong>
															{announcement.targetDetails && ` (${announcement.targetDetails})`}
														</Text>
													</Group>
													<Text size="xs" c="dimmed">
														Sent: {formatTimestamp(announcement.sentAt)}
													</Text>
												</Group>
											</Stack>
										</Card>
									))}
								</Stack>
							)}
						</Stack>
					</Card>
				)}
			</Stack>
		</Box>
	);
}
