'use client'

import { useState } from 'react';
import {
	Container,
	Grid,
	Paper,
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
	Anchor
} from '@mantine/core';
import { IconEdit, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import classes from './Profile.module.css';
import { useUserData } from '@/hooks/useUserData';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { clearSessionCookie } from '@/app/actions/account/sign-out';
import { deleteUserAccount } from '@/app/actions/account/account';

export default function ProfilePage() {
	const [promoCode, setPromoCode] = useState('');
	const [applyingPromoCode, setApplyingPromoCode] = useState(false);

	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deletingAccount, setDeletingAccount] = useState(false);

	const { userData, systemData, loading, error } = useUserData();
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

	const handleChangePassword = () => {
		notifications.show({
			title: 'Info',
			message: 'Password reset email would be sent in a real implementation.',
			color: 'blue',
		});
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

	if (loading) return (
		<Group h="80vh" align='center' justify='center'>
			<Loader size="lg" />
		</Group>
	)

	return (
		<Container size="xl" py="xl" className={classes.container}>
			<Title order={1} ta="center" mb="xl" className={classes.title}>Account</Title>

			<Grid gutter="xl">
				{/* Left Column */}
				<Grid.Col span={{ base: 12, md: 6 }}>
					{/* Profile Section */}
					<Paper radius="lg" className={classes.paper}>
						<Title order={2} mb="xl" className={classes.sectionTitle}>Profile</Title>

						<Box mb="md">
							<Group justify="flex-start" gap="md">
								<Text fw={500} className={classes.label}>Email :</Text>
								<Text>{userData?.email}</Text>
							</Group>
						</Box>

						<Box mb="md">
							<Group justify="flex-start" gap="md">
								<Text fw={500} className={classes.label}>Name :</Text>
								<Text>{userData?.displayName}</Text>
								<ActionIcon variant="subtle" color="blue" radius="xl">
									<IconEdit size={18} />
								</ActionIcon>
							</Group>
						</Box>

						<Box mb="xl">
							<Group justify="flex-start" gap="md">
								<Text fw={500} className={classes.label}>Current Tier :</Text>
								<Text>{systemData?.subscription_tier}</Text>
							</Group>
						</Box>

						<Button
							fullWidth
							color="violet"
							radius="xl"
							onClick={handleSignOut}
							className={classes.signOutButton}
						>
							Sign Out
						</Button>
					</Paper>

					{/* Delete Account Section */}
					<Paper radius="lg" className={classes.paper} mt="xl">
						<Title order={2} mb="md" className={classes.sectionTitle}>Delete Account</Title>

						<Text mb="md" className={classes.warningText}>
							By deleting your account, your token balance will be set to zero, any
							remaining tokens will be lost and all images associated with your account
							will be removed.
						</Text>

						<Text mb="xl" className={classes.warningText}>
							This action is permanent and cannot be reversed!
						</Text>

						<Button
							fullWidth
							color="red"
							radius="xl"
							onClick={e => setDeleteModalOpen(true)}
							className={classes.deleteButton}
						>
							Delete Account
						</Button>
					</Paper>
				</Grid.Col>

				{/* Right Column */}
				<Grid.Col span={{ base: 12, md: 6 }}>
					{/* Token Balance Section */}
					<Paper radius="lg" className={classes.paper}>
						<Title order={2} mb="xl" className={classes.sectionTitle}>Token Balance</Title>

						<Box mb="xl">
							<Group justify="flex-start" gap="md">
								<Text fw={500} className={classes.label}>Tokens Remaining :</Text>
								<Text>{systemData?.tokens}</Text>
							</Group>
						</Box>

						<Anchor href='/pricing'>
							<Button
								fullWidth
								color="violet"
								radius="xl"
								className={classes.buyTokensButton}
							>
								Buy Tokens
							</Button>
						</Anchor>
					</Paper>

					{/* Promo Code Section */}
					<Paper radius="lg" className={classes.paper} mt="xl">
						<Title order={2} mb="xl" className={classes.sectionTitle}>Promo Code</Title>

						<Group grow>
							<TextInput
								placeholder="Code"
								value={promoCode}
								onChange={(event) => setPromoCode(event.currentTarget.value)}
								radius="md"
								className={classes.promoInput}
							/>
							<Button
								color="orange"
								radius="xl"
								onClick={handlePromoCodeSubmit}
								loading={applyingPromoCode}
								className={classes.submitButton}
							>
								Submit
							</Button>
						</Group>
					</Paper>

					{/* Change Password Section */}
					<Paper radius="lg" className={classes.paper} mt="xl">
						<Title order={2} mb="xl" className={classes.sectionTitle}>Change Password</Title>

						<Text mb="xl">
							Reset your password by clicking the button below.
						</Text>

						<Button
							fullWidth
							color="orange"
							radius="xl"
							onClick={handleChangePassword}
							className={classes.changePasswordButton}
						>
							Change Password
						</Button>
					</Paper>
				</Grid.Col>
			</Grid>

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
		</Container>
	);
}