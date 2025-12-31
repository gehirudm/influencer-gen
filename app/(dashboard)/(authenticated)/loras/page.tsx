"use client";

import {
    Container,
    Card,
    Text,
    Button,
    Group,
    Stack,
    Box,
    Title,
    SimpleGrid,
    Badge,
    Loader,
    Image,
    Tabs,
    Skeleton,
} from '@mantine/core';
import { IconSparkles, IconShoppingCart, IconPhoto } from '@tabler/icons-react';
import { useUserLoras, LoRAData } from '@/hooks/useUserLoras';
import { useEffect } from 'react';
import Link from 'next/link';

// LoRA Card Component
function LoRACard({ lora, owned = false }: { lora: LoRAData; owned?: boolean }) {
    return (
        <Card
            p="md"
            style={{
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#666';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#444';
            }}
        >
            <Stack gap="sm">
                <Box
                    style={{
                        width: '100%',
                        aspectRatio: '3/4',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    {lora.thumbnailUrl ? (
                        <Image
                            src={lora.thumbnailUrl}
                            alt={lora.displayName}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <Stack align="center" justify="center" style={{ height: '100%' }}>
                            <IconPhoto size={48} color="gray" />
                        </Stack>
                    )}

                    {/* Badges */}
                    <Group
                        gap="xs"
                        style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            right: '8px',
                        }}
                    >
                        {owned && (
                            <Badge variant="filled" color="green" size="sm">
                                Owned
                            </Badge>
                        )}
                        {lora.isLimitedEdition && !owned && (
                            <Badge variant="filled" color="orange" size="sm">
                                Limited: {lora.availableQuantity! - lora.purchasedCount} left
                            </Badge>
                        )}
                    </Group>
                </Box>

                <Text size="lg" c="white" ta="center" fw={600}>
                    {lora.displayName}
                </Text>

                <Text size="sm" c="dimmed" ta="center" lineClamp={2}>
                    {lora.description}
                </Text>

                {!owned && lora.isPublic && (
                    <Badge
                        color={lora.isFree ? "green" : "blue"}
                        size="lg"
                        style={{ alignSelf: 'center' }}
                    >
                        {lora.isFree ? 'Free' : `${lora.price} tokens`}
                    </Badge>
                )}
            </Stack>
        </Card>
    );
}

export default function UserLoRAsPage() {
    const {
        userLoras,
        purchasedLoras,
        loading,
        error,
        fetchUserLoras
    } = useUserLoras();

    useEffect(() => {
        fetchUserLoras();
    }, [fetchUserLoras]);

    const allMyLoras = [...userLoras, ...purchasedLoras];

    return (
        <Container size="xl" py={{ base: 'md', md: 'xl' }}>
            <Title ta="center" size={60} mb="md" c="white">
                My LoRAs
            </Title>

            <Text ta="center" size="lg" c="dimmed" mb={{ base: 'md', md: 'xl' }} maw={800} mx="auto">
                Your custom trained character models. Use them in image generation to create
                consistent characters based on real people or custom designs.
            </Text>

            <Stack gap="xl">
                {/* My LoRAs Section */}
                <Card p={{ base: 'md', md: 'lg' }} withBorder={false}>
                    <Group justify="space-between" mb={{ base: 'md', md: 'lg' }}>
                        <Title size={30} c="white">
                            Your LoRAs
                        </Title>
                        <Button
                            component={Link}
                            href="/loras/marketplace"
                            variant="light"
                            leftSection={<IconShoppingCart size={18} />}
                        >
                            Browse Marketplace
                        </Button>
                    </Group>

                    <Card p={{ base: 'md', md: 'lg' }} style={{ backgroundColor: '#2a2a2a', border: 'none' }}>
                        {loading ? (
                            <Group justify="center" py="xl">
                                <Loader size="lg" />
                            </Group>
                        ) : error ? (
                            <Text ta="center" c="red" py="xl">
                                {error}
                            </Text>
                        ) : allMyLoras.length === 0 ? (
                            <Stack align="center" py="xl" gap="sm">
                                <IconSparkles size={48} color="gray" />
                                <Text ta="center" c="dimmed" size="lg">
                                    You don't have any LoRAs yet
                                </Text>
                                <Text ta="center" c="dimmed" size="sm">
                                    Browse the marketplace to find custom character models
                                </Text>
                                <Button
                                    component={Link}
                                    href="/loras/marketplace"
                                    variant="filled"
                                    size="md"
                                    mt="md"
                                    leftSection={<IconShoppingCart size={18} />}
                                >
                                    Browse Marketplace
                                </Button>
                            </Stack>
                        ) : (
                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                                {allMyLoras.map((lora) => (
                                    <LoRACard
                                        key={lora.id}
                                        lora={lora}
                                        owned={true}
                                    />
                                ))}
                            </SimpleGrid>
                        )}
                    </Card>
                </Card>
            </Stack>
        </Container>
    );
}
