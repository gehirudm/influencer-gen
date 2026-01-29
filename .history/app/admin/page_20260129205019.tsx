"use client";

import {
    Box,
    Title,
    Text,
    SimpleGrid,
    Card,
    Group,
    Stack,
    ThemeIcon,
    RingProgress,
    Skeleton,
} from '@mantine/core';
import {
    IconUsers,
    IconSparkles,
    IconTicket,
    IconTrendingUp,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import app from '@/lib/firebase';
import Link from 'next/link';

interface DashboardStats {
    totalUsers: number;
    totalLoras: number;
    publicLoras: number;
    assignedLoras: number;
    totalPromoCodes: number;
    activePromoCodes: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const db = getFirestore(app);

                // Fetch users count
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const totalUsers = usersSnapshot.size;

                // Fetch LoRAs
                const lorasSnapshot = await getDocs(collection(db, 'loras'));
                const totalLoras = lorasSnapshot.size;
                let publicLoras = 0;
                let assignedLoras = 0;
                lorasSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.isPublic) publicLoras++;
                    else assignedLoras++;
                });

                // Fetch promo codes
                const promoSnapshot = await getDocs(collection(db, 'promo-codes'));
                const totalPromoCodes = promoSnapshot.size;
                let activePromoCodes = 0;
                const now = new Date();
                promoSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!data.isUsed && new Date(data.expiresAt) > now) {
                        activePromoCodes++;
                    }
                });

                setStats({
                    totalUsers,
                    totalLoras,
                    publicLoras,
                    assignedLoras,
                    totalPromoCodes,
                    activePromoCodes,
                });
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers ?? 0,
            icon: IconUsers,
            color: 'blue',
            href: '/admin/users',
        },
        {
            title: 'Total LoRAs',
            value: stats?.totalLoras ?? 0,
            subtitle: `${stats?.publicLoras ?? 0} public, ${stats?.assignedLoras ?? 0} assigned`,
            icon: IconSparkles,
            color: 'violet',
            href: '/admin/loras',
        },
        {
            title: 'Promo Codes',
            value: stats?.totalPromoCodes ?? 0,
            subtitle: `${stats?.activePromoCodes ?? 0} active`,
            icon: IconTicket,
            color: 'green',
            href: '/admin/promo',
        },
    ];

    return (
        <Box style={{ padding: '0.75rem', height: '100%' }}>
            <Stack gap="xl">
                {/* Header */}
                <div>
                    <Title order={2} c="white" mb="xs">
                        Dashboard
                    </Title>
                    <Text c="dimmed">
                        Welcome to the admin panel. Here's an overview of your system.
                    </Text>
                </div>

                {/* Stats Cards */}
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                    {statCards.map((stat) => (
                        <Card
                            key={stat.title}
                            component={Link}
                            href={stat.href}
                            padding="lg"
                            radius="md"
                            style={{
                                backgroundColor: '#0a0a0a',
                                border: '1px solid #333',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, border-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = '#555';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = '#333';
                            }}
                        >
                            <Group justify="space-between" align="flex-start">
                                <div>
                                    <Text size="sm" c="dimmed" mb={4}>
                                        {stat.title}
                                    </Text>
                                    {loading ? (
                                        <Skeleton height={36} width={60} />
                                    ) : (
                                        <Text size="xl" fw={700} c="white">
                                            {stat.value.toLocaleString()}
                                        </Text>
                                    )}
                                    {stat.subtitle && (
                                        <Text size="xs" c="dimmed" mt={4}>
                                            {stat.subtitle}
                                        </Text>
                                    )}
                                </div>
                                <ThemeIcon
                                    size="xl"
                                    radius="md"
                                    variant="light"
                                    color={stat.color}
                                >
                                    <stat.icon size={24} stroke={1.5} />
                                </ThemeIcon>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>

                {/* Quick Actions */}
                <div>
                    <Title order={4} c="white" mb="md">
                        Quick Actions
                    </Title>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                        <Card
                            component={Link}
                            href="/admin/users"
                            padding="md"
                            radius="md"
                            style={{
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #333',
                                cursor: 'pointer',
                            }}
                        >
                            <Group>
                                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                                    <IconUsers size={18} />
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" fw={500} c="white">Manage Users</Text>
                                    <Text size="xs" c="dimmed">View and edit user accounts</Text>
                                </div>
                            </Group>
                        </Card>

                        <Card
                            component={Link}
                            href="/admin/loras"
                            padding="md"
                            radius="md"
                            style={{
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #333',
                                cursor: 'pointer',
                            }}
                        >
                            <Group>
                                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                                    <IconSparkles size={18} />
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" fw={500} c="white">Create LoRA</Text>
                                    <Text size="xs" c="dimmed">Add new custom characters</Text>
                                </div>
                            </Group>
                        </Card>

                        <Card
                            component={Link}
                            href="/admin/promo"
                            padding="md"
                            radius="md"
                            style={{
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #333',
                                cursor: 'pointer',
                            }}
                        >
                            <Group>
                                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                                    <IconTicket size={18} />
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" fw={500} c="white">Create Promo Code</Text>
                                    <Text size="xs" c="dimmed">Generate promotional codes</Text>
                                </div>
                            </Group>
                        </Card>

                        <Card
                            component={Link}
                            href="/"
                            padding="md"
                            radius="md"
                            style={{
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #333',
                                cursor: 'pointer',
                            }}
                        >
                            <Group>
                                <ThemeIcon size="lg" radius="md" color="gray" variant="light">
                                    <IconTrendingUp size={18} />
                                </ThemeIcon>
                                <div>
                                    <Text size="sm" fw={500} c="white">View Site</Text>
                                    <Text size="xs" c="dimmed">Go to main website</Text>
                                </div>
                            </Group>
                        </Card>
                    </SimpleGrid>
                </div>
            </Stack>
        </Box>
    );
}
