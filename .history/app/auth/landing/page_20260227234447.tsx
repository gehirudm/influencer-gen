"use client"

import {
    Button,
    Paper,
    TextInput,
    Title,
    Container,
    Loader
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';
import classes from './Onboarding.module.css';

export default function DashboardPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const db = getFirestore(app);
    const auth = getAuth(app);

    const form = useForm({
        initialValues: {
            username: '',
            displayName: '',
        },
        validate: {
            username: (value) => {
                if (!/^[a-zA-Z0-9._]+$/.test(value)) {
                    return 'Username can only contain letters, numbers, dots, and underscores';
                }
                return null;
            },
            displayName: (value) => (value.length < 2 ? 'Display name must be at least 2 characters long' : null),
        },
    });

    const checkUsernameExists = async (username: string) => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        return !querySnapshot.empty;
    };

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            const usernameExists = await checkUsernameExists(values.username);
            if (usernameExists) {
                form.setFieldError('username', 'Username already exists');
                setLoading(false);
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                username: values.username,
                displayName: values.displayName,
            });

            notifications.show({
                title: 'Success',
                message: 'Profile updated successfully!',
                color: 'green',
            });

            router.replace('/generate-images-free');
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to update profile. Please try again.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={420} my={40}>
            <Title ta="center" className={classes.title}>
                Let's complete your profile
            </Title>

            <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput
                        label="Username"
                        placeholder="cool.guy23"
                        required
                        radius="md"
                        {...form.getInputProps('username')}
                    />
                    <TextInput
                        label="Display Name"
                        placeholder="Robert Watkins"
                        required
                        mt="md"
                        radius="md"
                        {...form.getInputProps('displayName')}
                    />
                    <Button fullWidth mt="xl" radius="md" type="submit" disabled={loading}>
                        {loading ? <Loader size="sm" /> : 'Continue'}
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}