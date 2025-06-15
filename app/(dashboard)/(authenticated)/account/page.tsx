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
  Loader
} from '@mantine/core';
import { IconEdit, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import classes from './Profile.module.css';
import { useUserData } from '@/hooks/useUserData';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { clearSessionCookie } from '@/app/actions/sign-out';

export default function ProfilePage() {
  const [promoCode, setPromoCode] = useState('');
  const { userData, systemData, loading, error } = useUserData();
  const router = useRouter();

  const handlePromoCodeSubmit = () => {
    if (promoCode.trim() === '') {
      notifications.show({
        title: 'Error',
        message: 'Please enter a promo code',
        color: 'red',
        icon: <IconAlertCircle />,
      });
      return;
    }

    notifications.show({
      title: 'Success',
      message: 'Promo code applied successfully!',
      color: 'green',
    });
    setPromoCode('');
  };

  const handleDeleteAccount = () => {
    notifications.show({
      title: 'Warning',
      message: 'This is a dummy implementation. No account was deleted.',
      color: 'yellow',
    });
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
              onClick={handleDeleteAccount}
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

            <Button
              fullWidth
              color="violet"
              radius="xl"
              className={classes.buyTokensButton}
            >
              Buy Tokens
            </Button>
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
    </Container>
  );
}