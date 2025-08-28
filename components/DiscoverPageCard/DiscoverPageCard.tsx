import { ImagePost } from "@/app/(dashboard)/discover/page";
import { Card, Badge, ActionIcon, Box, Group, Image, Text, Modal, Button, Switch, Code, ScrollArea } from "@mantine/core";
import { IconHeart, IconBookmark, IconShare, IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { Carousel } from '@mantine/carousel';
import { useState } from "react";

import classes from './DiscoverPageCard.module.css';

export default function DiscoverPageCard({ post }: { post: ImagePost }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [withSeed, setWithSeed] = useState(false);
    const [showParams, setShowParams] = useState(false);

    // Handle slide change
    const handleSlideChange = (index: number) => {
        setCurrentSlide(index);
    };

    // Prepare images array for carousel
    const images = post.isMultiImage && post.imageUrls ?
        post.imageUrls :
        [post.imageUrls[0]];

    // Mock image parameters for demonstration
    const imageParams = {
        seed: 1583768832,
        width: 512,
        height: 768,
        cfg_scale: 8,
        negative_prompt: "NG_DeepNegative_V1_75T,(greyscale:1.2), cross-eye, paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acne, skin blemishes, age spot, glans",
        ...post.params
    };

    // Navigate between images in the preview modal
    const goToNextImage = () => {
        if (images.length <= 1) return;
        setCurrentSlide((prevIndex) => (prevIndex + 1) % images.length);
    };

    const goToPreviousImage = () => {
        if (images.length <= 1) return;
        setCurrentSlide((prevIndex) => prevIndex === 0 ? images.length - 1 : prevIndex - 1);
    };

    // Open the preview modal
    const handleOpenPreview = () => {
        setPreviewOpen(true);
    };

    return (
        <>
            <Card key={post.id} padding="sm" radius="md" className={classes.card} withBorder={false}>
                <Card.Section className={classes.imageContainer} onClick={handleOpenPreview}>
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

                    {/* <Group justify="space-between" mt="md">
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
                    </Group> */}
                </Box>
            </Card>

            {/* Image Preview Modal */}
            <Modal
                opened={previewOpen}
                onClose={() => {
                    setPreviewOpen(false);
                    setShowParams(false);
                }}
                size="auto"
                padding={0}
                withCloseButton={false}
                classNames={{
                    content: classes.modalContent,
                    body: classes.modalBody,
                    inner: classes.modalInner
                }}
                centered
            >
                <div className={classes.previewContainer}>
                    <Text fw={500} size="lg" mb="xs" px={10} pt={10} style={{ position: "absolute", top: 0, zIndex: 10 }}>
                        {post.title}
                    </Text>
                    {showParams ? (
                        <ScrollArea w="100%" type="auto" p="10">
                            <Code block className={classes.paramsCode}>
                                {JSON.stringify(imageParams, null, 2)}
                            </Code>
                        </ScrollArea>
                    ) : (
                        <div className={classes.imagePreview}>
                            {images.length > 1 && (
                                <ActionIcon
                                    className={classes.navButton}
                                    variant="transparent"
                                    color="white"
                                    size="lg"
                                    style={{ left: 10 }}
                                    onClick={goToPreviousImage}
                                >
                                    <IconChevronLeft size={30} />
                                </ActionIcon>
                            )}

                            <Image
                                src={images[currentSlide]}
                                alt={`${post.title} - image preview`}
                                className={classes.previewImage}
                            />

                            {images.length > 1 && (
                                <ActionIcon
                                    className={classes.navButton}
                                    variant="transparent"
                                    color="white"
                                    size="lg"
                                    style={{ right: 10 }}
                                    onClick={goToNextImage}
                                >
                                    <IconChevronRight size={30} />
                                </ActionIcon>
                            )}

                            {images.length > 1 && (
                                <div className={classes.pagination}>
                                    {currentSlide + 1} of {images.length}
                                </div>
                            )}
                        </div>
                    )}

                    <Group className={classes.modalActions} justify="space-between">
                        <Group>
                            <Button
                                variant="light"
                                color="indigo"
                                radius="xl"
                                onClick={() => setShowParams(!showParams)}
                            >
                                {showParams ? "Image" : "Params"}
                            </Button>
                            <Button
                                variant="light"
                                color="indigo"
                                radius="xl"
                            >
                                Inpaint
                            </Button>
                            <Button
                                variant="light"
                                color="indigo"
                                radius="xl"
                            >
                                Img2Img
                            </Button>
                            <Button
                                variant="light"
                                color="indigo"
                                radius="xl"
                            >
                                ReMake
                            </Button>
                        </Group>
                        <Group>
                            <Switch
                                checked={withSeed}
                                onChange={(event) => setWithSeed(event.currentTarget.checked)}
                                label="with seed"
                                labelPosition="left"
                                color="indigo"
                            />
                            <ActionIcon
                                variant="filled"
                                color="blue"
                                size="lg"
                                radius="xl"
                                onClick={() => setPreviewOpen(false)}
                            >
                                <IconX size={20} />
                            </ActionIcon>
                        </Group>
                    </Group>
                </div>
            </Modal>
        </>
    );
}