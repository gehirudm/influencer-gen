'use client';

import {
    Stack,
    Title,
    Text,
    Box,
    Group,
    Button,
    Alert,
    Image,
    ActionIcon,
    Center,
    Loader,
} from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { IconPhoto, IconUpload, IconX, IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';
import { CharacterWizardData } from '../CharacterCreationWizard';

interface StepFaceImageProps {
    data: CharacterWizardData;
    onUpdate: (updates: Partial<CharacterWizardData>) => void;
}

export function StepFaceImage({ data, onUpdate }: StepFaceImageProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleDrop = (files: FileWithPath[]) => {
        if (files.length > 0) {
            const file = files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size should not exceed 10MB');
                return;
            }

            setLoading(true);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
                onUpdate({ baseImage: file });
                setLoading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setPreview(null);
        onUpdate({ baseImage: undefined });
    };

    return (
        <Stack gap="lg">
            <div>
                <Title order={2} size="h3" mb="md">
                    Face Base Image
                </Title>
                <Text c="dimmed" size="sm" mb="lg">
                    Upload a clear face image - this will be the base face of the model you are training
                </Text>
            </div>

            {/* Warning Alert */}
            <Alert
                icon={<IconAlertTriangle size={16} />}
                title="Important"
                color="yellow"
                variant="light"
            >
                <Stack gap="xs">
                    <Text size="sm">
                        This image will serve as the base face for your character model training. 
                        Make sure to choose a clear, well-lit image where the face is clearly visible.
                    </Text>
                    <Text size="sm">
                        The quality of this base image will directly impact the training results.
                    </Text>
                </Stack>
            </Alert>

            {/* Image Preview */}
            {preview ? (
                <Box>
                    <Box
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '300px',
                            aspectRatio: '3/4',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#1a1a1a',
                            border: '2px solid #4a4a4a',
                        }}
                    >
                        <Image
                            src={preview}
                            alt="Face preview"
                            fit="cover"
                            width="100%"
                            height="100%"
                        />
                        <ActionIcon
                            color="red"
                            variant="filled"
                            size="lg"
                            radius="xl"
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                            }}
                            onClick={removeImage}
                        >
                            <IconX size={16} />
                        </ActionIcon>
                    </Box>
                    <Text size="sm" c="dimmed" mt="sm">
                        {data.baseImage?.name}
                    </Text>
                    <Button
                        variant="subtle"
                        color="blue"
                        size="sm"
                        mt="sm"
                        onClick={() => removeImage()}
                    >
                        Change Image
                    </Button>
                </Box>
            ) : (
                <Dropzone
                    onDrop={handleDrop}
                    maxSize={10 * 1024 * 1024}
                    accept={{
                        'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
                    }}
                    multiple={false}
                    disabled={loading}
                >
                    <Center py={40} style={{ pointerEvents: 'none' }}>
                        <Stack gap="md" align="center">
                            {loading ? (
                                <>
                                    <Loader size="lg" color="blue" />
                                    <Text size="sm">Processing image...</Text>
                                </>
                            ) : (
                                <>
                                    <Box
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            width: '80px',
                                            height: '80px',
                                            backgroundColor: '#2a2a2a',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <IconUpload size={40} color="#4a4a4a" />
                                    </Box>
                                    <Stack gap={0}>
                                        <Text size="lg" fw={500}>
                                            Drag image here or click to select
                                        </Text>
                                        <Text size="sm" c="dimmed">
                                            Supported formats: JPEG, PNG, WebP, GIF (Max 10MB)
                                        </Text>
                                    </Stack>
                                </>
                            )}
                        </Stack>
                    </Center>
                </Dropzone>
            )}

            {/* Requirements */}
            <Stack gap="xs" style={{ backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '8px' }}>
                <Text size="sm" fw={600}>
                    Recommended for Best Results:
                </Text>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                    <li>Clear, frontal face view</li>
                    <li>Good lighting (avoid shadows on face)</li>
                    <li>Eyes open and visible</li>
                    <li>Neutral or natural expression</li>
                    <li>Image size: at least 512x512 pixels</li>
                </ul>
            </Stack>

            {data.baseImage && (
                <Text size="sm" c="green" fw={500}>
                    ✓ Face image selected
                </Text>
            )}
        </Stack>
    );
}
