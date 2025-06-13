'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import {
    Container,
    Title,
    TextInput,
    Textarea,
    Select,
    Text,
    Button,
    Group,
    Stack,
    Grid,
    Card,
    Image,
    ActionIcon,
    Paper,
    rem,
    SimpleGrid,
} from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { IconX, IconUpload, IconPlus, IconPhoto } from '@tabler/icons-react';
import { ChipSelectionWithLineClamp } from '@/components/ChipSelectionWithLineClamp/ChipSelectionWithLineClamp';
import { CharacterImageUploadPreviewCard } from '@/components/CharacterImageUploadPreviewCard/CharacterImageUploadPreviewCard';

// Character feature options - easily editable
const FEATURE_OPTIONS = {
    'Hair Style': [
        'Afro',
        'Buzz Cut',
        'Bob',
        'Dreadlocks',
        'Long Straight',
        'Mohawk',
        'Pixie Cut',
        'Ponytail',
        'Undercut',
        'Wavy'
    ],
    'Skin Color': [
        'Fair',
        'Light',
        'Medium',
        'Olive',
        'Tan',
        'Brown',
        'Dark Brown',
        'Deep'
    ],
    'Ethnicity': [
        'African',
        'Asian',
        'Caucasian',
        'Hispanic/Latino',
        'Middle Eastern',
        'Native American',
        'Pacific Islander',
        'Mixed'
    ]
};

// Define TypeScript interfaces
interface CharacterFeatures {
    'Hair Style': string;
    'Skin Color': string;
    'Ethnicity': string;
}

interface CharacterData {
    name: string;
    description: string;
    features: CharacterFeatures;
}

export default function CharacterCreation() {
    const router = useRouter();
    const [characterData, setCharacterData] = useState<CharacterData>({
        name: '',
        description: '',
        features: {
            'Hair Style': '',
            'Skin Color': '',
            'Ethnicity': ''
        }
    });
    const [images, setImages] = useState<FileWithPath[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const MAX_IMAGES = 20;

    const handleInputChange = (name: string, value: string) => {
        setCharacterData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFeatureChange = (feature: keyof CharacterFeatures, value: string | null) => {
        setCharacterData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [feature]: value || ''
            }
        }));
    };

    const handleImageUpload = (files: FileWithPath[]) => {
        if (images.length + files.length > MAX_IMAGES) {
            notifications.show({
                title: 'Maximum images reached',
                message: `You can only upload up to ${MAX_IMAGES} images.`,
                color: 'red',
            });
            return;
        }

        // Create preview URLs for display
        const filePreviewUrls = files.map(file => URL.createObjectURL(file));

        setImages(prev => [...prev, ...files]);
        setPreviewImages(prev => [...prev, ...filePreviewUrls]);
    };

    const removeImage = (index: number) => {
        // Free memory for removed preview URL
        URL.revokeObjectURL(previewImages[index]);

        setImages(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });

        setPreviewImages(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically handle form submission, potentially uploading images to a server
        // and saving character data

        console.log('Character data:', characterData);
        console.log('Images:', images);

        // Show a success notification
        notifications.show({
            title: 'Character created',
            message: 'Your character has been successfully created!',
            color: 'green',
        });

        // Navigate to the view page
        router.push('/character');
    };

    return (
        <Container size="md" py="xl">
            <Title order={1} ta="center" mb="xl">Create Your Character</Title>

            <form onSubmit={handleSubmit}>
                <Stack gap="xl">
                    {/* Basic Character Information */}
                    <Paper shadow="xs" p="md" withBorder>
                        <Stack gap="md">
                            <TextInput
                                label="Character Name"
                                placeholder="Enter character name"
                                value={characterData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                required
                                size="md"
                            />

                            <Textarea
                                label="Character Description"
                                placeholder="Describe your character"
                                value={characterData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                minRows={4}
                                size="md"
                            />
                        </Stack>
                    </Paper>

                    {/* Character Features */}
                    <Paper shadow="xs" p="md" withBorder>
                        <Title order={3} mb="md">Character Features</Title>
                        <Stack gap={10}>
                            {Object.entries(FEATURE_OPTIONS).map(([category, options]) => (
                                <ChipSelectionWithLineClamp
                                    header={category}
                                    data={options.map(option => ({
                                        value: option, 
                                        label: option, 
                                        // image: "https://firebasestorage.googleapis.com/v0/b/influncer-gen.firebasestorage.app/o/generated-images%2FuQCRZ39xGZQiaWPEW4JZF56EorE3%2Fe4256731-0caf-4f87-9417-a81e86f9e7c7-e1-image_0.png?alt=media&token=701211ba-c27e-47e6-bedb-19ddefd32a24"
                                    }))}
                                    onChange={(value) => handleFeatureChange(
                                        category as keyof CharacterFeatures,
                                        value as string
                                    )}
                                />
                            ))}
                        </Stack>
                    </Paper>

                    {/* Image Upload Section */}
                    <Paper shadow="xs" p="md" withBorder>
                        <Title order={3} mb="xs">Character Images</Title>
                        <Text c="dimmed" size="sm" mb="md">Upload up to {MAX_IMAGES} images for your character.</Text>

                        <Dropzone
                            onDrop={handleImageUpload}
                            maxSize={5 * 1024 * 1024}
                            accept={['image/png', 'image/jpeg']}
                            disabled={images.length >= MAX_IMAGES}
                            mb="md"
                        >
                            <Group justify="center" gap="xl" style={{ minHeight: 100, pointerEvents: 'none' }}>
                                <Dropzone.Accept>
                                    <IconUpload
                                        size={50}
                                        stroke={1.5}
                                        color="var(--mantine-primary-color-6)"
                                    />
                                </Dropzone.Accept>
                                <Dropzone.Reject>
                                    <IconX size={50} stroke={1.5} color="var(--mantine-color-red-6)" />
                                </Dropzone.Reject>
                                <Dropzone.Idle>
                                    <IconPhoto size={50} stroke={1.5} />
                                </Dropzone.Idle>

                                <div>
                                    <Text size="xl" inline ta="center">
                                        Drag images here or click to select files
                                    </Text>
                                    <Text size="sm" c="dimmed" inline mt={7} ta="center">
                                        ({images.length}/{MAX_IMAGES}) - Attach up to {MAX_IMAGES} images, each up to 5MB
                                    </Text>
                                </div>
                            </Group>
                        </Dropzone>

                        {/* Preview of uploaded images */}
                        {previewImages.length > 0 && (
                            <SimpleGrid cols={{
                                base: 4,
                                lg: 4,
                                md: 3,
                                sm: 2,
                                xs: 1
                            }} spacing="sm">
                                {previewImages.map((src, index) => (
                                    <CharacterImageUploadPreviewCard
                                        image={src}
                                        onRemove={() => removeImage(index)}
                                        onRecrop={() => removeImage(index)}
                                    />
                                    // <Card key={index} shadow="sm" padding={0} radius="md" withBorder>
                                    //     <Card.Section>
                                    //         <Image
                                    //             src={src}
                                    //             height={160}
                                    //             alt={`Character image ${index + 1}`}
                                    //         />
                                    //     </Card.Section>
                                    //     <ActionIcon
                                    //         color="red"
                                    //         variant="filled"
                                    //         radius="xl"
                                    //         size="sm"
                                    //         style={{ position: 'absolute', top: 5, right: 5 }}
                                    //         onClick={() => removeImage(index)}
                                    //     >
                                    //         <IconX size={16} />
                                    //     </ActionIcon>
                                    // </Card>
                                ))}

                                {/* Add more image button */}
                                {images.length < MAX_IMAGES && (
                                    <Dropzone
                                        onDrop={handleImageUpload}
                                        maxSize={5 * 1024 * 1024}
                                        accept={['image/png', 'image/jpeg', 'image/gif']}
                                        style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}
                                    >
                                        <Group justify="center">
                                            <IconPlus size={24} stroke={1.5} color="gray" />
                                            <Text c="dimmed" size="sm">Add More</Text>
                                        </Group>
                                    </Dropzone>
                                )}
                            </SimpleGrid>
                        )}
                    </Paper>

                    {/* Submit Button */}
                    <Group justify="center" mt="xl">
                        <Button
                            type="submit"
                            size="lg"
                            radius="md"
                        >
                            Create Character
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Container>
    );
}