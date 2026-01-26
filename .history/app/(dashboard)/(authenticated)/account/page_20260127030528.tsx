'use client'

import { useState } from 'react';
import {
	Card,
	Title,
	Text,
	Button,
	Group,
	TextInput,
	Switch,
	ActionIcon,
	Box,
	Loader,
	Modal,
	Anchor,
	Tooltip,
	Alert,
	Stack,
	Select,
	Divider,
} from '@mantine/core';
import { IconEdit, IconAlertCircle, IconAlertTriangle, IconLogout } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useUserData } from '@/hooks/useUserData';
import { getAuth, sendEmailVerification, sendPasswordResetEmail, updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth';
import app from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { clearSessionCookie } from '@/app/actions/account/sign-out';
import { changeUserName, deleteUserAccount } from '@/app/actions/account/account';

export default function ProfilePage() {
	const [promoCode, setPromoCode] = useState('');
	const [applyingPromoCode, setApplyingPromoCode] = useState(false);
	const [notificationsEnabled, setNotificationsEnabled] = useState(true);
	const [language, setLanguage] = useState('english');

	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deletingAccount, setDeletingAccount] = useState(false);

	const [emailModalOpen, setEmailModalOpen] = useState(false);
	const [changingEmail, setChangingEmail] = useState(false);

	const [nameModalOpen, setNameModalOpen] = useState(false);
	const [changingName, setChangingName] = useState(false);

	const { user, userData, systemData, loading, error } = useUserData();
	const router = useRouter();

	const handlePromoCodeSubmit = async () => {
		if (promoCode.trim() === '') {
			notifications.show({
				title: 'Error',
				message: 'Please enter a promo code',
				color: 'red',
			});
			return;
		}

		setApplyingPromoCode(true);

		// Show loading notification
		const loadingNotificationId = notifications.show({
			title: 'Processing',
			message: 'Applying promo code...',
			color: 'blue',
			loading: true,
			autoClose: false,
		});

		try {
			// Call the API to redeem the promo code
			const response = await fetch('/api/promo/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ code: promoCode.trim() }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to apply promo code');
			}

			// Update the notification with success message
			notifications.update({
				id: loadingNotificationId,
				title: 'Success',
				message: `Promo code applied successfully! ${data.tokenAmount} tokens added to your account.`,
				color: 'green',
				loading: false,
				autoClose: 5000,
			});

			// Clear the input field
			setPromoCode('');
			setApplyingPromoCode(false);

			// Refresh user data to show updated token balance
			// If you have a refresh function in useUserData, call it here
			// For example: refreshUserData();

		} catch (error: any) {
			// Update the notification with error message
			notifications.update({
				id: loadingNotificationId,
				title: 'Error',
				message: error.message || 'Failed to apply promo code',
				color: 'red',
				loading: false,
				autoClose: 5000,
			});

			setApplyingPromoCode(false);
		}
	};

	const handleDeleteAccount = async () => {
		setDeletingAccount(true);

		// Show loading notification
		const loadingNotificationId = notifications.show({
			title: 'Processing',
			message: 'Deleting your account...',
			color: 'blue',
			loading: true,
			autoClose: false,
		});

		try {
			// Call the server action to delete the account
			const result = await deleteUserAccount();

			if (result.success) {
				// Update notification with success message
				notifications.update({
					id: loadingNotificationId,
					title: 'Success',
					message: 'Your account has been deleted successfully.',
					color: 'green',
					loading: false,
					autoClose: 5000,
				});

				// Close the modal
				setDeleteModalOpen(false);

				// Sign out and redirect to auth page
				const auth = getAuth(app);
				await auth.signOut();
				router.replace("/auth");
			} else {
				throw new Error(result.message);
			}
		} catch (error: any) {
			// Update notification with error message
			notifications.update({
				id: loadingNotificationId,
				title: 'Error',
				message: error.message || 'Failed to delete account. Please try again.',
				color: 'red',
				loading: false,
				autoClose: 5000,
			});
		} finally {
			setDeletingAccount(false);
		}
	};

	const handleChangePassword = async () => {
		const auth = getAuth(app);
		const user = auth.currentUser;

		if (!user || !user.email) {
			notifications.show({
				title: 'Error',
				message: 'No user is currently signed in or email is missing.',
				color: 'red',
			});
			return;
		}

		const loadingNotificationId = notifications.show({
			title: 'Processing',
			message: 'Sending password reset email...',
			color: 'blue',
			loading: true,
			autoClose: false,
		});

		try {
			await sendPasswordResetEmail(auth, user.email);

			notifications.update({
				id: loadingNotificationId,
				title: 'Success',
				message: 'Password reset email has been sent to your email address.',
				color: 'green',
				loading: false,
				autoClose: 5000,
			});
		} catch (error: any) {
			notifications.update({
				id: loadingNotificationId,
				title: 'Error',
				message: error.message || 'Failed to send password reset email. Please try again.',
				color: 'red',
				loading: false,
				autoClose: 5000,
			});
		}
	};

	const handleSignOut = () => {
		const signOutNotification = notifications.show({
			title: 'Signing out',
			message: 'Please wait while we sign you out...',
			color: 'blue',
			loading: true,
			autoClose: false
		});

		const signOut = async () => {
			const auth = getAuth(app);
			await auth.signOut();
			const res = await clearSessionCookie();

			if (res) {
				notifications.update({
					id: signOutNotification,
					title: 'Success',
					message: 'You have been signed out successfully.',
					color: 'green',
					loading: false,
					autoClose: 3000
				});
				router.replace("/auth")
			} else
				notifications.update({
					id: signOutNotification,
					title: 'Error',
					message: 'Failed to sign out. Please try again.',
					color: 'red',
					loading: false,
					autoClose: 3000
				});
		}

		signOut()
	};

	const handleChangeEmail = async (newEmail: string | null) => {
		if (!newEmail) return;

		const auth = getAuth(app);
		const user = auth.currentUser;

		if (!user) {
			notifications.show({
				title: 'Error',
				message: 'No user is currently signed in.',
				color: 'red',
			});
			return;
		}

		if (!newEmail || newEmail.trim() === '') {
			notifications.show({
				title: 'Cancelled',
				message: 'Email change was cancelled.',
				color: 'blue',
			});
			return;
		}

		setChangingEmail(true);

		const loadingNotificationId = notifications.show({
			title: 'Processing',
			message: 'Updating email address...',
			color: 'blue',
			loading: true,
			autoClose: false,
		});

		try {
			await verifyBeforeUpdateEmail(user, newEmail);

			notifications.update({
				id: loadingNotificationId,
				title: 'Success',
				message: 'Verification email sent to your new address. Please check your inbox and follow the instructions to complete the email change.',
				color: 'green',
				loading: false,
				autoClose: 5000,
			});

			setChangingEmail(false);
			setEmailModalOpen(false);
		} catch (error: any) {
			notifications.update({
				id: loadingNotificationId,
				title: 'Error',
				message: error.message || 'Failed to update email. Please try again.',
				color: 'red',
				loading: false,
				autoClose: 5000,
			});

			setChangingEmail(false);
			setEmailModalOpen(false);
		}
	}

	const handleVerifyEmail = async () => {
		const auth = getAuth(app);
		const user = auth.currentUser;

		if (!user) {
			notifications.show({
				title: 'Error',
				message: 'No user is currently signed in.',
				color: 'red',
			});
			return;
		}

		const loadingNotificationId = notifications.show({
			title: 'Processing',
			message: 'Sending verification email...',
			color: 'blue',
			loading: true,
			autoClose: false,
		});

		try {
			await sendEmailVerification(user);

			notifications.update({
				id: loadingNotificationId,
				title: 'Success',
				message: 'Verification email has been sent. Please check your inbox and follow the instructions.',
				color: 'green',
				loading: false,
				autoClose: 5000,
			});
		} catch (error: any) {
			notifications.update({
				id: loadingNotificationId,
				title: 'Error',
				message: error.message || 'Failed to send verification email. Please try again later.',
				color: 'red',
				loading: false,
				autoClose: 5000,
			});
		}
	}

	const handleChangeName = async (newName: string | null) => {
		if (!newName) return;

		const auth = getAuth(app);
		const user = auth.currentUser;

		if (!user) {
			notifications.show({
				title: 'Error',
				message: 'No user is currently signed in.',
				color: 'red',
			});
			return;
		}

		if (!newName || newName.trim() === '') {
			notifications.show({
				title: 'Cancelled',
				message: 'Name change was cancelled.',
				color: 'blue',
			});
			return;
		}

		setChangingName(true);

		const loadingNotificationId = notifications.show({
			title: 'Processing',
			message: 'Updating display name...',
			color: 'blue',
			loading: true,
			autoClose: false,
		});

		try {
			// First update Firebase Auth display name
			await updateProfile(user, {
				displayName: newName
			});

			// Then update in your database using the server action
			const result = await changeUserName(newName);

			if (!result.success) {
				throw new Error(result.message || 'Failed to update name in database');
			}

			notifications.update({
				id: loadingNotificationId,
				title: 'Success',
				message: 'Your display name has been updated successfully.',
				color: 'green',
				loading: false,
				autoClose: 5000,
			});

			setChangingName(false);
			setNameModalOpen(false);
		} catch (error: any) {
			notifications.update({
				id: loadingNotificationId,
				title: 'Error',
				message: error.message || 'Failed to update display name. Please try again.',
				color: 'red',
				loading: false,
				autoClose: 5000,
			});

			setChangingName(false);
			setNameModalOpen(false);
		}
	}

	if (loading) return (
		<Box style={{ padding: '0.75rem', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<Loader size="lg" />
		</Box>
	)

	return (
		<Box style={{ padding: '0.75rem', height: '100%' }}>
			<Stack gap="md">
				<Title size="h3" c="white">Account Settings</Title>

				{/* Profile Information */}
				<Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					<Title size="h4" c="white" mb="md">Profile Information</Title>
					
					<Stack gap="md">
						{/* Name */}
						<Group justify="space-between" align="center">
							<Box style={{ flex: 1 }}>
								<Text size="sm" fw={500} c="white">Name</Text>
								<Text size="sm" c="dimmed">{userData?.displayName || 'Not set'}</Text>
							</Box>
							<ActionIcon variant="subtle" color="blue" onClick={() => setNameModalOpen(true)}>
								<IconEdit size={18} />
							</ActionIcon>
						</Group>

						<Divider color="#333" />

						{/* ID */}
						<Box>
							<Text size="sm" fw={500} c="white">ID</Text>
							<Text size="sm" c="dimmed" style={{ wordBreak: 'break-all' }}>{user?.uid}</Text>
						</Box>

						<Divider color="#333" />

						{/* Email */}
						<Group justify="space-between" align="center">
							<Box style={{ flex: 1 }}>
								<Text size="sm" fw={500} c="white">Email</Text>
								<Group gap="xs">
									<Text size="sm" c="dimmed">{userData?.email}</Text>
									{!user?.emailVerified && (
										<Tooltip label="Your email is not verified">
											<ActionIcon variant="subtle" color="red" size="sm" onClick={handleVerifyEmail}>
												<IconAlertTriangle size={14} />
											</ActionIcon>
										</Tooltip>
									)}
								</Group>
							</Box>
							<ActionIcon variant="subtle" color="blue" onClick={() => setEmailModalOpen(true)}>
								<IconEdit size={18} />
							</ActionIcon>
						</Group>

						<Divider color="#333" />

						{/* Password */}
						<Group justify="space-between" align="center">
							<Box style={{ flex: 1 }}>
								<Text size="sm" fw={500} c="white">Password</Text>
								<Text size="sm" c="dimmed">••••••••</Text>
							</Box>
							<Button variant="subtle" size="xs" onClick={handleChangePassword}>
								Change
							</Button>
						</Group>
					</Stack>
				</Card>

				{/* Token Balance */}
				<Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					<Title size="h4" c="white" mb="md">Token Balance</Title>
					
					<Group justify="space-between" align="center" mb="md">
						<Box>
							<Text size="sm" fw={500} c="white">Tokens Remaining</Text>
							<Text size="xl" fw={700} c="white">{systemData?.tokens || 0}</Text>
						</Box>
						<Button color="violet" onClick={() => router.push('/pricing')}>
							Buy Tokens
						</Button>
					</Group>
				</Card>

				{/* Promo Code */}
				<Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					<Title size="h4" c="white" mb="md">Promo Code</Title>
					
					{!user?.emailVerified ? (
						<Alert icon={<IconAlertCircle size={16} />} title="Email Verification Required" color="orange" mb="md">
							Please verify your email address to use promo codes.
							<Anchor component="button" ml={5} onClick={handleVerifyEmail}>
								Send verification email
							</Anchor>
						</Alert>
					) : null}

					<Group gap="sm">
						<TextInput
							placeholder="Enter promo code"
							value={promoCode}
							onChange={(event) => setPromoCode(event.currentTarget.value)}
							style={{ flex: 1 }}
							disabled={!user?.emailVerified}
						/>
						<Button
							color="orange"
							onClick={handlePromoCodeSubmit}
							loading={applyingPromoCode}
							disabled={!user?.emailVerified}
						>
							Apply
						</Button>
					</Group>
				</Card>

				{/* Notifications */}
				<Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					<Group justify="space-between" align="center">
						<Box>
							<Text size="sm" fw={500} c="white">Notifications</Text>
							<Text size="xs" c="dimmed">Receive updates and alerts</Text>
						</Box>
						<Switch
							checked={notificationsEnabled}
							onChange={(event) => setNotificationsEnabled(event.currentTarget.checked)}
						/>
					</Group>
				</Card>

				{/* Language */}
				<Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					<Title size="h4" c="white" mb="md">Language</Title>
					<Select
						value={language}
						onChange={(value) => setLanguage(value || 'english')}
						data={[
							{ value: 'english', label: 'English (Only)' }
						]}
						disabled
					/>
				</Card>

				{/* Policies and Agreements */}
				<Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					<Title size="h4" c="white" mb="md">Policies and Agreements</Title>
					<Text size="sm" c="dimmed" mb="md">
						Login means default agreement to terms of services and privacy policy.
					</Text>
					<Group gap="sm">
						<Anchor href="/about/tos" target="_blank" size="sm">
							Terms of Service
						</Anchor>
						<Text size="sm" c="dimmed">•</Text>
						<Anchor href="/about/privacy-policy" target="_blank" size="sm">
							Privacy Policy
						</Anchor>
					</Group>
				</Card>

				{/* Delete Account */}
				<Card p="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
					<Title size="h4" c="red" mb="md">Delete Account</Title>
					<Text size="sm" c="dimmed" mb="md">
						By deleting your account, your token balance will be set to zero, any remaining tokens will be lost and all images associated with your account will be removed. This action is permanent and cannot be reversed!
					</Text>
					<Button
						color="red"
						onClick={() => setDeleteModalOpen(true)}
					>
						Delete Account
					</Button>
				</Card>

				{/* Sign Out */}
				<Button
					fullWidth
					size="lg"
					variant="light"
					leftSection={<IconLogout size={20} />}
					onClick={handleSignOut}
				>
					Sign Out
				</Button>
			</Stack>

			{/* Delete Account Confirmation Modal */}
			<Modal
				opened={deleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				title="Delete Account"
				centered
				size="md"
			>
				<Text fw={500} size="lg" c="red" mb="md">
					Are you sure you want to delete your account?
				</Text>

				<Text mb="xl">
					This action is permanent and cannot be undone. All your data, including tokens,
					generated images, and account information will be permanently deleted.
				</Text>

				<Group justify="flex-end" mt="xl">
					<Button
						variant="default"
						onClick={() => setDeleteModalOpen(false)}
						disabled={deletingAccount}
					>
						Cancel
					</Button>
					<Button
						color="red"
						onClick={handleDeleteAccount}
						loading={deletingAccount}
					>
						Delete My Account
					</Button>
				</Group>
			</Modal>

			{/* Change Email Modal */}
			<Modal
				opened={emailModalOpen}
				onClose={() => setEmailModalOpen(false)}
				title="Change Email Address"
				centered
				size="md"
			>
				<form onSubmit={(e) => {
					e.preventDefault();
					handleChangeEmail((new FormData(e.target as HTMLFormElement)).get('email') as string | null);
				}}>
					<Text mb="md">
						Enter your new email address. A verification email will be sent to this address.
						You must verify the new email before the change takes effect.
					</Text>

					<TextInput
						label="New Email Address"
						placeholder="Enter your new email"
						required
						mb="md"
						type="email"
						name="email"
					/>

					<Group justify="flex-end" mt="xl">
						<Button
							variant="default"
							onClick={() => setEmailModalOpen(false)}
							disabled={changingEmail}
						>
							Cancel
						</Button>
						<Button
							color="blue"
							type="submit"
							loading={changingEmail}
						>
							Send Verification Email
						</Button>
					</Group>
				</form>
			</Modal>

			{/* Change Name Modal */}
			<Modal
				opened={nameModalOpen}
				onClose={() => setNameModalOpen(false)}
				title="Change Display Name"
				centered
				size="md"
			>
				<form onSubmit={(e) => {
					e.preventDefault();
					handleChangeName((new FormData(e.target as HTMLFormElement)).get('name') as string | null);
				}}>
					<Text mb="md">
						Enter your new display name. This name will be visible to other users.
					</Text>

					<TextInput
						label="New Display Name"
						placeholder="Enter your new display name"
						required
						mb="md"
						name='name'
					/>

					<Group justify="flex-end" mt="xl">
						<Button
							variant="default"
							onClick={() => setNameModalOpen(false)}
							disabled={changingName}
						>
							Cancel
						</Button>
						<Button
							color="blue"
							type="submit"
							loading={changingName}
						>
							Update Name
						</Button>
					</Group>
				</form>
			</Modal>
		</Box>
	);
}