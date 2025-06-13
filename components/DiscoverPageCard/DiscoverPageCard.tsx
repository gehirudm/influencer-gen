import { ImagePost } from "@/app/(dashboard)/discover/page";
import { Card, Badge, ActionIcon, Box, Group, Image, Text } from "@mantine/core";
import { IconHeart, IconBookmark, IconShare } from "@tabler/icons-react";
import { Carousel } from '@mantine/carousel';
import { useState } from "react";

import classes from './DiscoverPageCard.module.css';

export default function DiscoverPageCard({ post }: { post: ImagePost }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Handle slide change
    const handleSlideChange = (index: number) => {
        setCurrentSlide(index);
    };

    // Prepare images array for carousel
    const images = post.isMultiImage && post.imageUrls ? 
        post.imageUrls : 
        [post.imageUrls[0]];

    return (
        <Card key={post.id} padding="sm" radius="md" className={classes.card} withBorder={false}>
            <Card.Section className={classes.imageContainer}>
                <Carousel
                    withIndicators
                    loop
                    onSlideChange={handleSlideChange}
                    initialSlide={post.currentImageIndex || 0}
                    classNames={{
                        root: classes.carouselRoot,
                        controls: classes.carouselControls,
                        indicator: classes.carouselIndicator,
                    }}
                >
                    {images.map((imageUrl, index) => (
                        <Carousel.Slide key={index}>
                            <Image
                                src={imageUrl}
                                alt={`${post.title} - image ${index + 1}`}
                                height={400}
                                className={classes.image}
                                radius="md"
                            />
                        </Carousel.Slide>
                    ))}
                </Carousel>

                {post.isMultiImage && (
                    <Badge
                        className={classes.imageCounter}
                        variant="filled"
                    >
                        {currentSlide + 1} of {images.length}
                    </Badge>
                )}

                {post.nsfw && (
                    <Badge
                        color="red"
                        className={classes.nsfwBadge}
                        variant="filled"
                    >
                        NSFW
                    </Badge>
                )}
            </Card.Section>

            <Box py={10}>
                <Text fw={500} size="lg" mb="xs" lineClamp={1}>
                    {post.title}
                </Text>

                <Group justify="space-between" mt="md">
                    <Group gap="xs">
                        <ActionIcon variant="subtle" aria-label="Like">
                            <IconHeart size={20} />
                        </ActionIcon>
                        <Text size="sm">{post.likes}</Text>
                    </Group>

                    <Group gap="xs">
                        <ActionIcon variant="subtle" aria-label="Bookmark">
                            <IconBookmark size={20} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" aria-label="Share">
                            <IconShare size={20} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Box>
        </Card>
    );
}