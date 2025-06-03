"use client";

import { useEffect, useState } from 'react';
import { Loader, Center, Text, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, systemData, loading, error } = useUserData();
    const [adminChecked, setAdminChecked] = useState(false);

    useEffect(() => {
        // If not loading and we have all the data we need to make a decision
        if (!loading) {
            if (!user) {
                // No user is authenticated, redirect to auth
                router.replace('/auth');
                return;
            }

            if (systemData) {
                if (!systemData.isAdmin) {
                    // User is not an admin, redirect to auth
                    console.log('Access denied: User is not an admin');
                    router.replace('/auth');
                    return;
                }
                
                // User is authenticated and is an admin
                setAdminChecked(true);
            }
        }
    }, [user, systemData, loading, router]);

    // Show loading state while checking authentication or admin status
    if (loading || !adminChecked) {
        return (
            <Center style={{ height: '100vh' }}>
                <Stack align="center" gap="md">
                    <Loader size="xl" />
                    <Text size="lg">Verifying admin privileges...</Text>
                </Stack>
            </Center>
        );
    }

    // Show error if there was a problem checking admin status
    if (error) {
        return (
            <Center style={{ height: '100vh' }}>
                <Text color="red" size="lg">Error: {error}</Text>
            </Center>
        );
    }

    // If we've reached this point, the user is authenticated and is an admin
    return <>{children}</>;
}