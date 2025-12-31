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
    SegmentedControl,
    ActionIcon,
    Modal,
    Divider,
} from '@mantine/core';
import {
    IconSparkles,
    IconArrowLeft,
    IconPhoto,
    IconShoppingCart,
    IconCheck,
    IconCurrencyDollar,
} from '@tabler/icons-react';
import { useUserLoras, LoRAData } from '@/hooks/useUserLoras';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

// Filter type
type FilterType = 'all' | 'free' | 'paid';

// LoRA Card for Marketplace
function MarketplaceLoRACard({
    lora,
    owned,
}: {
    lora: LoRAData;
    owned: boolean;
}) {
    return (
        <Card
            component={Link}
            href={`/loras/marketplace/${lora.id}`}
            p="md"
            style={{
                backgroundColor: '#2a2a2a',
                border: owned ? '2px solid #40c057' : '1px solid #444',
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s',
                textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = owned ? '#40c057' : '#666';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = owned ? '#40c057' : '#444';
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
                            justifyContent: 'space-between',
                        }}
                    >
                        {owned ? (
                            <Badge variant="filled" color="green" size="sm" leftSection={<IconCheck size={12} />}>
                                Owned
                            </Badge>
                        ) : lora.isFree ? (
                            <Badge variant="filled" color="green" size="sm">
                                Free
                            </Badge>
                        ) : (
                            <Badge variant="filled" color="blue" size="sm" leftSection={<IconCurrencyDollar size={12} />}>
                                {lora.price} tokens
                            </Badge>
                        )}

                        {lora.isLimitedEdition && (
                            <Badge variant="filled" color="orange" size="sm">
                                {lora.availableQuantity! - lora.purchasedCount} left
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

                {!owned && (
                    <Button
                        variant="light"
                        color={lora.isFree ? "green" : "blue"}
                        fullWidth
                        leftSection={<IconShoppingCart size={16} />}
                    >
                        {lora.isFree ? 'Get for Free' : `Buy for ${lora.price} tokens`}
                    </Button>
                )}
            </Stack>
        </Card>
    );
}

export default function LoRAMarketplacePage() {
    const {
        marketplaceLoras,
        loadingMarketplace,
        fetchMarketplaceLoras,
        purchaseLora,
        hasLora,
    } = useUserLoras();

    const [filter, setFilter] = useState<FilterType>('all');
    const [purchasing, setPurchasing] = useState(false);
    const [selectedLora, setSelectedLora] = useState<LoRAData | null>(null);
    const [confirmModalOpen, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);

    useEffect(() => {
        fetchMarketplaceLoras();
    }, [fetchMarketplaceLoras]);

    // Filter LoRAs
    const filteredLoras = marketplaceLoras.filter(lora => {
        if (filter === 'free') return lora.isFree;
        if (filter === 'paid') return !lora.isFree;
        return true;
    });

    // Handle purchase click
    const handlePurchaseClick = (lora: LoRAData) => {
        if (hasLora(lora.id)) return;
        setSelectedLora(lora);
        openConfirmModal();
    };

    // Handle purchase confirmation
    const handleConfirmPurchase = async () => {
        if (!selectedLora) return;

        try {
            setPurchasing(true);
            const result = await purchaseLora(selectedLora.id);

            if (!result.success) {
                throw new Error(result.error);
            }

            notifications.show({
                title: 'Success!',
                message: `You now own "${selectedLora.displayName}"!`,
                color: 'green',
            });

            closeConfirmModal();
            setSelectedLora(null);
        } catch (err: any) {
            notifications.show({
                title: 'Purchase Failed',
                message: err.message || 'Failed to purchase LoRA',
                color: 'red',
            });
        } finally {
            setPurchasing(false);
        }
    };

    return (
        <Container size="xl" py={{ base: 'md', md: 'xl' }}>
            {/* Header */}
            <Group mb="xl">
                <ActionIcon
                    component={Link}
                    href="/loras"
                    variant="subtle"
                    size="lg"
                >
                    <IconArrowLeft size={24} />
                </ActionIcon>
                <div>
                    <Title size={40} c="white">
                        LoRA Marketplace
                    </Title>
                    <Text c="dimmed">
                        Browse and purchase custom trained character models
                    </Text>
                </div>
            </Group>

            {/* Filters */}
            <Group mb="xl">
                <SegmentedControl
                    value={filter}
                    onChange={(value) => setFilter(value as FilterType)}
                    data={[
                        { label: 'All', value: 'all' },
                        { label: 'Free', value: 'free' },
                        { label: 'Paid', value: 'paid' },
                    ]}
                />
            </Group>

            {/* LoRAs Grid */}
            {loadingMarketplace ? (
                <Group justify="center" py="xl">
                    <Loader size="lg" />
                </Group>
            ) : filteredLoras.length === 0 ? (
                <Card p="xl" style={{ backgroundColor: '#2a2a2a', border: 'none' }}>
                    <Stack align="center" py="xl" gap="sm">
                        <IconSparkles size={48} color="gray" />
                        <Text ta="center" c="dimmed" size="lg">
                            No LoRAs available in the marketplace
                        </Text>
                        <Text ta="center" c="dimmed" size="sm">
                            Check back later for new custom character models
                        </Text>
                    </Stack>
                </Card>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {filteredLoras.map((lora) => (
                        <MarketplaceLoRACard
                            key={lora.id}
                            lora={lora}
                            owned={hasLora(lora.id)}
                        />
                    ))}
                </SimpleGrid>
            )}

            {/* Purchase Confirmation Modal */}
            <Modal
                opened={confirmModalOpen}
                onClose={closeConfirmModal}
                title={<Text fw={600}>Confirm Purchase</Text>}
                centered
            >
                {selectedLora && (
                    <Stack>
                        <Group>
                            <Image
                                src={selectedLora.thumbnailUrl}
                                alt={selectedLora.displayName}
                                width={80}
                                height={100}
                                radius="sm"
                                fit="cover"
                            />
                            <div>
                                <Text fw={600}>{selectedLora.displayName}</Text>
                                <Text size="sm" c="dimmed" lineClamp={2}>
                                    {selectedLora.description}
                                </Text>
                            </div>
                        </Group>

                        <Divider />

                        <Group justify="space-between">
                            <Text>Price:</Text>
                            <Badge
                                color={selectedLora.isFree ? "green" : "blue"}
                                size="lg"
                            >
                                {selectedLora.isFree ? 'Free' : `${selectedLora.price} tokens`}
                            </Badge>
                        </Group>

                        {selectedLora.isLimitedEdition && (
                            <Group justify="space-between">
                                <Text>Availability:</Text>
                                <Badge color="orange" size="lg">
                                    {selectedLora.availableQuantity! - selectedLora.purchasedCount} remaining
                                </Badge>
                            </Group>
                        )}

                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeConfirmModal}>
                                Cancel
                            </Button>
                            <Button
                                color={selectedLora.isFree ? "green" : "blue"}
                                onClick={handleConfirmPurchase}
                                loading={purchasing}
                                leftSection={<IconShoppingCart size={16} />}
                            >
                                {selectedLora.isFree ? 'Get LoRA' : 'Purchase'}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Container>
    );
}
