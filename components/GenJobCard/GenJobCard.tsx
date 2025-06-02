import { useEffect, useState } from 'react';
import { IconAlertTriangle, IconAspectRatio, IconBookmark, IconClock, IconDotsVertical, IconEditCircle, IconHeart, IconPencil, IconPhoto, IconPlus, IconRefresh, IconRefreshAlert, IconShare, IconStack2, IconStarFilled, IconTrash } from '@tabler/icons-react';
import { Carousel } from '@mantine/carousel';
import { ActionIcon, Anchor, Avatar, Badge, Button, Card, Group, Image, Loader, Menu, Skeleton, Stack, Text, Tooltip } from '@mantine/core';
import classes from './GenJobCard.module.css';
import { useRouter } from 'next/navigation';

interface GenJobCardProps {
    prompt: string;
    status: string;
    jobId: string;  // Added jobId prop
    character?: {
        name: string;
        image: string;
    };
    imageUrls?: string[];
    imageIds?: string[];
    generationTime?: number;
    dimensions: { width: number; height: number };
    aspectRatio: string;
    batchSize: number;
    userProjects: Project[];
    onEdit?: (jobId: string) => void;
    onRecreate?: () => void;
    onInpaint?: () => void;
    onAddToProject?: () => void;
    onRecheckStatus?: (jobId: string, newStatus: string) => void;
    onDelete?: () => void;
}

interface Project {
    id: string;
    name: string;
}

export function GenJobCard({
    prompt,
    status,
    jobId,  // Added jobId parameter
    character,
    imageUrls,
    generationTime,
    dimensions,
    aspectRatio,
    batchSize,
    userProjects,
    onEdit,
    onRecreate,
    onInpaint,
    onAddToProject,
    onRecheckStatus,
    onDelete,
}: GenJobCardProps) {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!imageUrls || imageUrls.length === 0) {
            const timer = setInterval(() => {
                setElapsedTime((prev) => prev + 0.1);
            }, 100);

            return () => clearInterval(timer);
        }
    }, [imageUrls]);

    const handleRecheckStatus = async () => {
        if (!jobId) return;
        
        setIsCheckingStatus(true);
        try {
            const response = await fetch('/api/jobs/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobId
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Call the parent component's callback with the new status
                if (onRecheckStatus) {
                    onRecheckStatus(jobId, data.status);
                }
            } else {
                console.error('Failed to check job status:', data.error);
            }
        } catch (error) {
            console.error('Error checking job status:', error);
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const slides = (imageUrls && imageUrls.length > 0 ? imageUrls : Array(5).fill(null)).map((image, index) => (
        <Carousel.Slide key={index}>
            {image ? <Image src={image} width={300} className={classes.image} /> : <Skeleton width={300} height={200} />}
        </Carousel.Slide>
    ));

    return (
        <Card radius="md" withBorder padding="lg" className={classes.card} onClick={() => router.push("/create/view?jobId=" + jobId)}>
            <Card.Section mb={10}>
                <Anchor href="#">
                    <Carousel
                        withIndicators
                        loop={true}
                        classNames={{
                            root: classes.carousel,
                            controls: classes.carouselControls,
                            indicator: classes.carouselIndicator,
                        }}
                    >
                        {slides}
                    </Carousel>
                </Anchor>
            </Card.Section>

            <Badge autoContrast size="md" color="lime.4">{status}</Badge>
            <Text className={classes.title} lineClamp={4}>
                {prompt}
            </Text>
            <Badge autoContrast size="md" color="lime.4">{status}</Badge>
            <Text className={classes.title} lineClamp={4}>
                {prompt}
            </Text>

            {character && (
                <Group mt="lg">
                    <Avatar src={character?.image} radius="sm" />
                    <div>
                        <Text fw={500}>{character?.name}</Text>
                    </div>
                </Group>
            )}
            {character && (
                <Group mt="lg">
                    <Avatar src={character?.image} radius="sm" />
                    <div>
                        <Text fw={500}>{character?.name}</Text>
                    </div>
                </Group>
            )}

            <Card.Section className={classes.footer}>
                <Stack gap={5}>
                    <Group justify="space-between">
                        <Group gap={8}>
                            <Group gap={5}>
                                <IconClock size={16} color="var(--mantine-color-yellow-6)" />
                                <Text fz="sm" fw={600}>
                                    {imageUrls && imageUrls.length > 0 ? `${generationTime ? generationTime : "-"}s` : `${elapsedTime.toFixed(1)}s`}
                                </Text>
                            </Group>
                            <Group gap={5}>
                                <IconStack2 size={16} color="var(--mantine-color-blue-6)" />
                                <Text fz="sm" fw={600}>
                                    {batchSize}
                                </Text>
                            </Group>
                            <Group gap={5}>
                                <IconAspectRatio size={16} color="var(--mantine-color-gray-4)" />
                                <Text fz="sm" fw={600}>
                                    {aspectRatio}
                                </Text>
                            </Group>
                        </Group>
                        <Group gap={0}>
                            <Menu withArrow shadow="md" width={200}>
                                <Menu.Target>
                                    <Tooltip label="Options">
                                        <ActionIcon variant="subtle" color="gray">
                                            <IconDotsVertical size={20} color="var(--mantine-color-gray-6)" stroke={1.5} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Label>Actions</Menu.Label>
                                    <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => onEdit && onEdit(jobId)}>
                                        Edit
                                    </Menu.Item>
                                    <Menu.Item leftSection={<IconRefresh size={14} />} onClick={onRecreate}>
                                        Re-create
                                    </Menu.Item>
                                    <Menu.Item leftSection={<IconEditCircle size={14} />} onClick={onInpaint}>
                                        Inpaint
                                    </Menu.Item>
                                    <Menu.Item leftSection={<IconPhoto size={14} />}>
                                        Gallery
                                    </Menu.Item>
                                    <Menu.Item leftSection={<IconPlus size={14} />} onClick={onAddToProject}>
                                        Add to Project
                                    </Menu.Item>
                                    
                                    <Menu.Divider />

                                    <Menu.Item 
                                        leftSection={isCheckingStatus ? <Loader size={14} /> : <IconRefreshAlert size={14} />} 
                                        onClick={handleRecheckStatus}
                                        disabled={isCheckingStatus}
                                    >
                                        {isCheckingStatus ? 'Checking...' : 'Recheck Status'}
                                    </Menu.Item>
                                    <Menu.Item 
                                        leftSection={isCheckingStatus ? <Loader size={14} /> : <IconRefreshAlert size={14} />} 
                                        onClick={handleRecheckStatus}
                                        disabled={isCheckingStatus}
                                    >
                                        {isCheckingStatus ? 'Checking...' : 'Recheck Status'}
                                    </Menu.Item>

                                    <Menu.Divider />
                                    <Menu.Divider />

                                    <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={onDelete}>
                                        Delete
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    </Group>
                    {elapsedTime > 30 && (
                        <Group gap={5}>
                            <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
                            <Text mt={0} size='sm' c="dimmed">
                                Taking too long?{' '}
                                {isCheckingStatus ? (
                                    <span>
                                        <Loader size="xs" display="inline" mr={5} /> Checking...
                                    </span>
                                ) : (
                                    <Anchor href="#" fw={500} onClick={handleRecheckStatus}>
                                        Recheck Status
                                    </Anchor>
                                )}
                            </Text>
                        </Group>
                    )}
                </Stack>
            </Card.Section>
        </Card>
    );
}