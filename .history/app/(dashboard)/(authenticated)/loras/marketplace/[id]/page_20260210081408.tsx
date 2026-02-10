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
    Badge,
    Loader,
    Image,
    ActionIcon,
    Divider,
    SimpleGrid,
    Paper,
    ThemeIcon,
    Breadcrumbs,
    Anchor,
    AspectRatio,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconPhoto,
    IconShoppingCart,
    IconCheck,
    IconSparkles,
    IconTag,
    IconPackage,
    IconUsers,
} from '@tabler/icons-react';
import { useUserLoras, LoRAData } from '@/hooks/useUserLoras';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { notifications } from '@mantine/notifications';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '@/lib/firebase';

export default function LoRADetailPage() {
    const params = useParams();
    const router = useRouter();
    const loraId = params.id as string;

    const { purchaseLora, hasLora, fetchUserLoras } = useUserLoras();

    const [lora, setLora] = useState<LoRAData | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Fetch LoRA data
    useEffect(() => {
        const fetchLora = async () => {
            try {
                setLoading(true);
                const db = getFirestore(app);
                const loraDoc = await getDoc(doc(db, 'loras', loraId));

                if (loraDoc.exists()) {
                    setLora({
                        id: loraDoc.id,
                        ...loraDoc.data()
                    } as LoRAData);
                } else {
                    router.push('/loras/marketplace');
                }
            } catch (err) {
                console.error('Error fetching LoRA:', err);
                router.push('/loras/marketplace');
            } finally {
                setLoading(false);
            }
        };

        if (loraId) {
            fetchLora();
            fetchUserLoras();
        }
    }, [loraId, router, fetchUserLoras]);

    // Handle purchase
    const handlePurchase = async () => {
        if (!lora) return;

        try {
            setPurchasing(true);
            const result = await purchaseLora(lora.id);

            if (!result.success) {
                throw new Error(result.error);
            }

            notifications.show({
                title: 'Success!',
                message: `You now own "${lora.displayName}"!`,
                color: 'green',
            });

            // Refresh to update ownership status
            fetchUserLoras();
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

    const owned = lora ? hasLora(lora.id) : false;
    const allImages = lora ? [lora.thumbnailUrl, ...(lora.displayImageUrls || [])] : [];
    const displayImage = selectedImage || (lora?.thumbnailUrl ?? null);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py="xl">
                    <Loader size="xl" />
                </Group>
            </Container>
        );
    }

    if (!lora) {
        return null;
    }

    return (
        <Container size="xl" py={{ base: 'md', md: 'xl' }}>
            {/* Breadcrumbs */}
            <Breadcrumbs mb="lg" separator="→">
                <Anchor component={Link} href="/loras" c="dimmed" size="sm">
                    My LoRAs
                </Anchor>
                <Anchor component={Link} href="/loras/marketplace" c="dimmed" size="sm">
                    Marketplace
                </Anchor>
                <Text size="sm" c="white">{lora.displayName}</Text>
            </Breadcrumbs>

            {/* Back Button (Mobile) */}
            <ActionIcon
                component={Link}
                href="/loras/marketplace"
                variant="subtle"
                size="lg"
                mb="md"
                hiddenFrom="sm"
            >
                <IconArrowLeft size={24} />
            </ActionIcon>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {/* Left Column - Images */}
                <Stack gap="md">
                    {/* Main Image */}
                    <Card p={0} radius="lg" style={{ overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
                        <AspectRatio ratio={3 / 4}>
                            {displayImage ? (
                                <Image
                                    src={displayImage}
                                    alt={lora.displayName}
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <Stack align="center" justify="center" style={{ height: '100%' }}>
                                    <IconPhoto size={64} color="gray" />
                                </Stack>
                            )}
                        </AspectRatio>
                    </Card>

                    {/* Image Gallery */}
                    {allImages.length > 1 && (
                        <SimpleGrid cols={4} spacing="xs">
                            {allImages.map((img, index) => (
                                <Card
                                    key={index}
                                    p={0}
                                    radius="sm"
                                    style={{
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: displayImage === img ? '2px solid var(--mantine-color-violet-filled)' : '2px solid transparent',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <AspectRatio ratio={1}>
                                        <Image
                                            src={img}
                                            alt={`${lora.displayName} ${index + 1}`}
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </AspectRatio>
                                </Card>
                            ))}
                        </SimpleGrid>
                    )}
                </Stack>

                {/* Right Column - Details & CTA */}
                <Stack gap="lg">
                    {/* Title & Badges */}
                    <div>
                        <Group gap="sm" mb="xs">
                            {owned && (
                                <Badge color="green" size="lg" leftSection={<IconCheck size={14} />}>
                                    Owned
                                </Badge>
                            )}
                            {lora.isLimitedEdition && (
                                <Badge color="orange" size="lg" leftSection={<IconPackage size={14} />}>
                                    Limited Edition
                                </Badge>
                            )}
                            {lora.isFree && !owned && (
                                <Badge color="green" size="lg">
                                    Free
                                </Badge>
                            )}
                        </Group>
                        <Title order={1} c="white" size={36}>
                            {lora.displayName}
                        </Title>
                    </div>

                    {/* Price Card / CTA */}
                    <Paper
                        p="lg"
                        radius="md"
                        style={{
                            background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                            border: '1px solid #333',
                        }}
                    >
                        {owned ? (
                            <Stack align="center" gap="md">
                                <ThemeIcon size={60} radius="xl" color="green" variant="light">
                                    <IconCheck size={32} />
                                </ThemeIcon>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="xl" fw={600} c="white">You Own This LoRA</Text>
                                    <Text size="sm" c="dimmed">
                                        Use the keyword "{lora.keyword}" in your prompts
                                    </Text>
                                </div>
                                <Button
                                    component={Link}
                                    href="/generate-images"
                                    size="lg"
                                    variant="gradient"
                                    gradient={{ from: 'violet', to: 'grape' }}
                                    fullWidth
                                    leftSection={<IconSparkles size={20} />}
                                >
                                    Start Creating
                                </Button>
                            </Stack>
                        ) : (
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Price</Text>
                                    <Text size="xl" fw={700} c="white">
                                        {lora.isFree ? 'FREE' : `${lora.price} tokens`}
                                    </Text>
                                </Group>

                                {lora.isLimitedEdition && (
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Availability</Text>
                                        <Text size="lg" fw={600} c="orange">
                                            {lora.availableQuantity! - lora.purchasedCount} / {lora.availableQuantity} remaining
                                        </Text>
                                    </Group>
                                )}

                                <Divider color="dark.5" />

                                <Button
                                    size="xl"
                                    variant="gradient"
                                    gradient={lora.isFree ? { from: 'teal', to: 'green' } : { from: 'violet', to: 'grape' }}
                                    fullWidth
                                    onClick={handlePurchase}
                                    loading={purchasing}
                                    leftSection={<IconShoppingCart size={22} />}
                                >
                                    {lora.isFree ? 'Get for Free' : 'Purchase Now'}
                                </Button>
                            </Stack>
                        )}
                    </Paper>

                    {/* Description */}
                    <Card p="lg" radius="md" style={{ backgroundColor: '#2a2a2a' }}>
                        <Title order={4} c="white" mb="sm">About This LoRA</Title>
                        <Text c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                            {lora.description}
                        </Text>
                    </Card>

                    {/* Details Card */}
                    <Card p="lg" radius="md" style={{ backgroundColor: '#2a2a2a' }}>
                        <Title order={4} c="white" mb="md">Details</Title>
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <IconTag size={18} color="gray" />
                                    <Text size="sm" c="dimmed">Trigger Keyword</Text>
                                </Group>
                                <Badge variant="light" color="violet" size="lg">
                                    {lora.keyword}
                                </Badge>
                            </Group>

                            <Divider color="dark.5" />

                            <Group justify="space-between">
                                <Group gap="xs">
                                    <IconSparkles size={18} color="gray" />
                                    <Text size="sm" c="dimmed">LoRA File</Text>
                                </Group>
                                <Text size="sm" c="white" ff="monospace">
                                    {lora.loraName}
                                </Text>
                            </Group>

                            {lora.isLimitedEdition && (
                                <>
                                    <Divider color="dark.5" />
                                    <Group justify="space-between">
                                        <Group gap="xs">
                                            <IconUsers size={18} color="gray" />
                                            <Text size="sm" c="dimmed">Total Purchased</Text>
                                        </Group>
                                        <Text size="sm" c="white">
                                            {lora.purchasedCount} owners
                                        </Text>
                                    </Group>
                                </>
                            )}
                        </Stack>
                    </Card>
                </Stack>
            </SimpleGrid>
        </Container>
    );
}
