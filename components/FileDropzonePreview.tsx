import { Group, Text, Image, Box, ActionIcon, Stack, Paper } from '@mantine/core';
import { IconUpload, IconPhoto, IconX, IconTrash } from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { ReactEventHandler, useState } from 'react';

interface FileDropzonePreviewProps extends Partial<DropzoneProps> {
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    setSelectedImageFile?: (file: File | null) => void;
    label?: string;
    onImageLoad?: ReactEventHandler<HTMLImageElement>;
}

export function FileDropzonePreview({ 
    selectedImage, 
    setSelectedImage, 
    setSelectedImageFile,
    label = "Upload Image",
    onImageLoad,
    ...props 
}: FileDropzonePreviewProps) {
    const [loading, setLoading] = useState(false);
    
    const handleDrop = (files: File[]) => {
        setLoading(true);
        const file = files[0];
        const reader = new FileReader();

        reader.onloadend = () => {
            const base64String = reader.result as string;
            console.log(base64String);
            setSelectedImage(base64String);
            setSelectedImageFile?.(file);
            setLoading(false);
        };

        reader.readAsDataURL(file);
    };

    const handleClearImage = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering dropzone click
        setSelectedImage(null);
    };

    return (
        <Box pos="relative">            
            <Dropzone
                onDrop={handleDrop}
                onReject={(files) => console.log('rejected files', files)}
                maxSize={5 * 1024 ** 2}
                accept={['image/png', 'image/jpeg', 'image/jpg']}
                maxFiles={1}
                loading={loading || props.loading}
                {...props}
            >
                <Group justify="center" gap="md" mih={220} style={{ pointerEvents: 'none' }}>
                    {!selectedImage && (
                        <>
                            <Dropzone.Accept>
                                <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
                            </Dropzone.Accept>
                            <Dropzone.Reject>
                                <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
                            </Dropzone.Reject>
                            <Dropzone.Idle>
                                <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
                            </Dropzone.Idle>
                            <Stack align="center" gap="xs">
                                <Text fz={{base: 15, md: 20}} inline ta="center">
                                    {label}
                                </Text>
                                <Text size="sm" c="dimmed" ta="center">
                                    Drag & drop or click to select an image.<br />
                                    Accepts PNG, JPEG, and JPG formats.
                                </Text>
                            </Stack>
                        </>
                    )}
                    
                    {selectedImage && (
                        <Paper p="xs" withBorder shadow="sm" radius="md" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                            <Image 
                                src={selectedImage} 
                                alt="Selected Image" 
                                fit="contain" 
                                h={300}
                                radius="sm"
                                style={{ maxWidth: '100%' }}
                                onLoad={onImageLoad}
                            />
                        </Paper>
                    )}
                </Group>
            </Dropzone>

            {selectedImage && (
                <ActionIcon 
                    color="red" 
                    variant="filled" 
                    radius="xl"
                    size="md"
                    pos="absolute" 
                    top={5} 
                    right={5} 
                    onClick={handleClearImage}
                    aria-label="Clear image"
                >
                    <IconTrash size={16} />
                </ActionIcon>
            )}
        </Box>
    );
}