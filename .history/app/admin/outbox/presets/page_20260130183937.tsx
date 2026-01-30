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
	ActionIcon,
	Tooltip,
	Modal,
	TextInput,
	Textarea,
	Alert,
} from '@mantine/core';
import {
	IconTemplate,
	IconSparkles,
	IconShoppingCart,
	IconCoin,
	IconAlertTriangle,
	IconTrophy,
	IconEdit,
	IconTrash,
	IconRefresh,
	IconInfoCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
	getNotificationPresets,
	updateNotificationPreset,
	deleteNotificationPreset,
	resetNotificationPresets,
	type NotificationPreset,
} from '@/app/actions/notifications/notifications';

const typeColors: Record<string, string> = {
	welcome: 'cyan',
	purchase: 'green',
	credits: 'violet',
	warning: 'orange',
	achievement: 'yellow',
};

export default function NotificationPresetsPage() {
	const [presets, setPresets] = useState<NotificationPreset[]>([]);
	const [loading, setLoading] = useState(true);
	const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
	const [resetting, setResetting] = useState(false);
	
	// Edit modal state
	const [editModalOpened, setEditModalOpened] = useState(false);
	const [editingPreset, setEditingPreset] = useState<NotificationPreset | null>(null);
	const [editTitle, setEditTitle] = useState('');
	const [editMessage, setEditMessage] = useState('');
	const [editLink, setEditLink] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadPresets();
	}, []);

	const loadPresets = async () => {
		setLoading(true);
		const result = await getNotificationPresets();
		if (result.success) {
			setPresets(result.presets);
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to load notification presets',
				color: 'red',
			});
		}
		setLoading(false);
	};

	const handleEdit = (preset: NotificationPreset) => {
		setEditingPreset(preset);
		setEditTitle(preset.title);
		setEditMessage(preset.message);
		setEditLink(preset.link || '');
		setEditModalOpened(true);
	};

	const handleSaveEdit = async () => {
		if (!editingPreset) return;

		if (!editTitle.trim()) {
			notifications.show({
				title: 'Validation Error',
				message: 'Title is required',
				color: 'red',
			});
			return;
		}

		if (!editMessage.trim()) {
			notifications.show({
				title: 'Validation Error',
				message: 'Message is required',
				color: 'red',
			});
			return;
		}

		setSaving(true);
		const result = await updateNotificationPreset(editingPreset.id, {
			title: editTitle,
			message: editMessage,
			link: editLink || undefined,
		});
		setSaving(false);

		if (result.success) {
			notifications.show({
				title: 'Success',
				message: 'Preset updated successfully',
				color: 'green',
			});
			setEditModalOpened(false);
			await loadPresets();
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to update preset',
				color: 'red',
			});
		}
	};

	const handleDelete = async (presetId: string) => {
		if (!confirm('Are you sure you want to delete this preset? This action cannot be undone.')) {
			return;
		}

		setProcessingIds(prev => new Set(prev).add(presetId));
		const result = await deleteNotificationPreset(presetId);
		setProcessingIds(prev => {
			const next = new Set(prev);
			next.delete(presetId);
			return next;
		});

		if (result.success) {
			notifications.show({
				title: 'Deleted',
				message: 'Preset deleted successfully',
				color: 'green',
			});
			await loadPresets();
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to delete preset',
				color: 'red',
			});
		}
	};

	const handleReset = async () => {
		if (!confirm('Are you sure you want to reset all presets to default values? This will delete all custom modifications.')) {
			return;
		}

		setResetting(true);
		const result = await resetNotificationPresets();
		setResetting(false);

		if (result.success) {
			notifications.show({
				title: 'Success',
				message: 'All presets have been reset to defaults',
				color: 'green',
			});
			await loadPresets();
		} else {
			notifications.show({
				title: 'Error',
				message: result.error || 'Failed to reset presets',
				color: 'red',
			});
		}
	};

	const formatTimestamp = (timestamp: any) => {
		if (!timestamp) return 'Unknown';
		const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<Box style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
			<Stack gap="lg">
				{/* Header */}
				<Group justify="space-between" align="center">
					<Group gap="sm">
						<IconTemplate size={32} />
						<Title size="h2" c="white">Notification Presets</Title>
					</Group>
					<Group gap="sm">
						<Button
							variant="light"
							size="sm"
							onClick={loadPresets}
							loading={loading}
						>
							Refresh
						</Button>
						{presets.length > 0 && (
							<Button
								variant="light"
								color="orange"
								size="sm"
								leftSection={<IconRefresh size={16} />}
								onClick={handleReset}
								loading={resetting}
								disabled={loading}
							>
								Reset to Defaults
							</Button>
						)}
					</Group>
				</Group>

				{/* Info Alert */}
				<Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
					These are the preset notification templates used throughout the system. Edit them to customize the messages sent to users. Variables in curly braces like {'{variable}'} will be replaced with actual values when sent.
				</Alert>

				{/* Presets Content */}
				<Card p="xl" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					{loading ? (
						<div style={{ textAlign: 'center', padding: '3rem' }}>
							<Loader size="lg" />
						</div>
					) : presets.length === 0 ? (
						<div style={{ textAlign: 'center', padding: '3rem' }}>
							<Text size="lg" c="dimmed">No presets found</Text>
							<Button mt="md" onClick={handleReset} loading={resetting}>
								Initialize Default Presets
							</Button>
						</div>
					) : (
						<Stack gap="md">
							{presets.map((preset) => (
								<Card
									key={preset.id}
									p="md"
									style={{
										backgroundColor: '#111',
										border: '1px solid #333',
									}}
								>
									<Stack gap="sm">
										<Group justify="space-between" align="flex-start">
											<Text size="md" fw={600} c="white">
												{preset.key}
											</Text>
											<Group gap="xs">
												{preset.editable && (
													<>
														<Tooltip label="Edit preset">
															<ActionIcon
																variant="subtle"
																color="blue"
																size="sm"
																onClick={() => handleEdit(preset)}
																disabled={processingIds.has(preset.id)}
															>
																<IconEdit size={16} />
															</ActionIcon>
														</Tooltip>
														<Tooltip label="Delete preset">
															<ActionIcon
																variant="subtle"
																color="red"
																size="sm"
																onClick={() => handleDelete(preset.id)}
																loading={processingIds.has(preset.id)}
																disabled={processingIds.has(preset.id)}
															>
																<IconTrash size={16} />
															</ActionIcon>
														</Tooltip>
													</>
												)}
											</Group>
										</Group>

										<Text size="sm" c="dimmed" fs="italic">
											{preset.description}
										</Text>

										<Stack gap="xs">
											<Group gap="xs">
												<Text size="xs" fw={500} c="dimmed">Title:</Text>
												<Text size="sm" c="blue">{preset.title}</Text>
											</Group>
											<Group gap="xs" align="flex-start">
												<Text size="xs" fw={500} c="dimmed">Message:</Text>
												<Text size="sm" c="white" style={{ flex: 1 }}>{preset.message}</Text>
											</Group>
											{preset.link && (
												<Group gap="xs">
													<Text size="xs" fw={500} c="dimmed">Link:</Text>
													<Text size="sm" c="cyan">{preset.link}</Text>
												</Group>
											)}
											{preset.variables && preset.variables.length > 0 && (
												<Group gap="xs">
													<Text size="xs" fw={500} c="dimmed">Variables:</Text>
													<Group gap="xs">
														{preset.variables.map((variable) => (
															<Badge key={variable} size="sm" variant="light" color="grape">
																{`{${variable}}`}
															</Badge>
														))}
													</Group>
												</Group>
											)}
										</Stack>

										<Group justify="space-between" align="center">
											<Group gap="xs">
												<Badge color={typeColors[preset.type] || 'gray'} size="sm" variant="light">
													{preset.type}
												</Badge>
												{preset.updatedAt && (
													<Text size="xs" c="dimmed">
														{formatTimestamp(preset.updatedAt)}
													</Text>
												)}
											</Group>
										</Group>
									</Stack>
								</Card>
							))}
						</Stack>
					)}
				</Card>
			</Stack>

			{/* Edit Modal */}
			<Modal
				opened={editModalOpened}
				onClose={() => setEditModalOpened(false)}
				title={<Text fw={600} size="lg">Edit Preset: {editingPreset?.key}</Text>}
				size="lg"
				centered
			>
				{editingPreset && (
					<Stack gap="md">
						<Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
							{editingPreset.variables && editingPreset.variables.length > 0 ? (
								<>
									Available variables: {editingPreset.variables.map(v => `{${v}}`).join(', ')}
								</>
							) : (
								'No variables available for this preset'
							)}
						</Alert>

						<TextInput
							label="Title"
							placeholder="Enter notification title"
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							required
						/>

						<Textarea
							label="Message"
							placeholder="Enter notification message"
							value={editMessage}
							onChange={(e) => setEditMessage(e.target.value)}
							required
							minRows={4}
						/>

						<TextInput
							label="Link (Optional)"
							placeholder="/pricing or https://example.com"
							value={editLink}
							onChange={(e) => setEditLink(e.target.value)}
						/>

						<Group justify="flex-end" mt="md">
							<Button
								variant="subtle"
								onClick={() => setEditModalOpened(false)}
								disabled={saving}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSaveEdit}
								loading={saving}
								disabled={saving}
							>
								Save Changes
							</Button>
						</Group>
					</Stack>
				)}
			</Modal>
		</Box>
	);
}
