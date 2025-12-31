"use client";

import { useEffect, useState } from 'react';
import {
    Loader,
    Center,
    Text,
    Stack,
    AppShell,
    NavLink,
    Title,
    Group,
    ThemeIcon,
    Divider,
    Button,
    Box,
} from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import {
    IconDashboard,
    IconUsers,
    IconTicket,
    IconSparkles,
    IconArrowLeft,
    IconShield,
} from '@tabler/icons-react';
import Link from 'next/link';

// Navigation items configuration
const navItems = [
    {
        label: 'Dashboard',
        href: '/admin',
        icon: IconDashboard,
    },
    {
        label: 'Users',
        href: '/admin/users',
        icon: IconUsers,
    },
    {
        label: 'LoRAs',
        href: '/admin/loras',
        icon: IconSparkles,
    },
    {
        label: 'Promo Codes',
        href: '/admin/promo',
        icon: IconTicket,
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
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
            <Center style={{ height: '100vh', backgroundColor: '#1a1a1a' }}>
                <Stack align="center" gap="md">
                    <Loader size="xl" color="violet" />
                    <Text size="lg" c="dimmed">Verifying admin privileges...</Text>
                </Stack>
            </Center>
        );
    }

    // Show error if there was a problem checking admin status
    if (error) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#1a1a1a' }}>
                <Text c="red" size="lg">Error: {error}</Text>
            </Center>
        );
    }

    // If we've reached this point, the user is authenticated and is an admin
    return (
        <AppShell
            navbar={{
                width: 280,
                breakpoint: 'sm',
            }}
            padding="md"
            styles={{
                main: {
                    backgroundColor: '#1a1a1a',
                    minHeight: '100vh',
                },
                navbar: {
                    backgroundColor: '#242424',
                    borderRight: '1px solid #333',
                },
            }}
        >
            <AppShell.Navbar p="md">
                {/* Admin Header */}
                <Box mb="lg">
                    <Group gap="sm" mb="xs">
                        <ThemeIcon
                            size="lg"
                            radius="md"
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'grape' }}
                        >
                            <IconShield size={20} />
                        </ThemeIcon>
                        <div>
                            <Title order={4} c="white">Admin Panel</Title>
                            <Text size="xs" c="dimmed">Management Dashboard</Text>
                        </div>
                    </Group>
                </Box>

                <Divider mb="md" color="dark.5" />

                {/* Navigation Links */}
                <Stack gap={4}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            component={Link}
                            href={item.href}
                            label={item.label}
                            leftSection={<item.icon size={18} stroke={1.5} />}
                            active={pathname === item.href}
                            variant="filled"
                            styles={{
                                root: {
                                    borderRadius: '8px',
                                    color: pathname === item.href ? 'white' : '#aaa',
                                    backgroundColor: pathname === item.href ? 'var(--mantine-color-violet-filled)' : 'transparent',
                                    '&:hover': {
                                        backgroundColor: pathname === item.href
                                            ? 'var(--mantine-color-violet-filled)'
                                            : '#333',
                                    },
                                },
                                label: {
                                    fontWeight: pathname === item.href ? 600 : 400,
                                },
                            }}
                        />
                    ))}
                </Stack>

                {/* Bottom Section */}
                <Box style={{ marginTop: 'auto' }}>
                    <Divider mb="md" color="dark.5" />
                    <Button
                        component={Link}
                        href="/"
                        variant="subtle"
                        color="gray"
                        fullWidth
                        leftSection={<IconArrowLeft size={18} />}
                        styles={{
                            root: {
                                justifyContent: 'flex-start',
                            },
                        }}
                    >
                        Back to Site
                    </Button>
                </Box>
            </AppShell.Navbar>

            <AppShell.Main>
                {children}
            </AppShell.Main>
        </AppShell>
    );
}