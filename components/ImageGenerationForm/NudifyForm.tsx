import { useState } from 'react';
import {
    Stack,
    Title,
    Button,
    Text,
    Alert,
    Group,
    Box,
    SimpleGrid,
    Center,
    Paper
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconAlertCircle, IconChevronUp } from '@tabler/icons-react';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';
import { aspectRatios } from './ImageGenerationForm';
import { useImageToDataUrl } from '@/hooks/useImgToDataUrl';

interface NudifyFormProps {
    form: UseFormReturnType<any>;
    loading: boolean;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    onSubmit: () => void;
}

export function NudifyForm({
    form,
    loading,
    selectedImage,
    setSelectedImage,
    onSubmit
}: NudifyFormProps) {
    const { dataUrl, loading: dataUrlLoading } = useImageToDataUrl(selectedImage);

    // Render the image format selector
    const renderImageFormatSelector = () => {
        return (
            <Box mt="md">
                <Text mb="md">Image Format</Text>
                <SimpleGrid cols={4} spacing="xs">
                    {aspectRatios.map((ratio) => (
                        <Paper
                            key={ratio.value}
                            withBorder
                            p="md"
                            radius="md"
                            style={{
                                borderColor: form.values.aspectRatio === ratio.value ? 'var(--mantine-color-blue-6)' : undefined,
                                cursor: 'pointer',
                                backgroundColor: form.values.aspectRatio === ratio.value ? 'var(--mantine-color-blue-9)' : undefined,
                            }}
                            onClick={() => form.setFieldValue('aspectRatio', ratio.value)}
                        >
                            {ratio.label}
                        </Paper>
                    ))}
                </SimpleGrid>
            </Box>
        );
    };

    const handleSubmit = () => {
        if (dataUrl) {
            // Set the base image for nudify processing
            form.setFieldValue('base_img', dataUrl.split(',')[1]); // Remove the data:image/... prefix
            form.setFieldValue('model_name', 'nudify'); // Force nudify model
            form.setFieldValue('nudify', true);
            onSubmit();
        }
    };

    return (
        <Stack gap="md">
            <Title order={3}>Upload Image</Title>
            <Text size="sm" c="dimmed">Upload an image to transform. For best results, use a clear image with good lighting.</Text>
            
            <FileDropzonePreview
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                label="Drag and drop an image here or click to select a file"
            />

            {selectedImage && (
                <Group grow>
                    <Button 
                        variant="light" 
                        color="red" 
                        onClick={() => setSelectedImage(null)}
                    >
                        Remove Image
                    </Button>
                </Group>
            )}

            {renderImageFormatSelector()}

            <Button
                onClick={handleSubmit}
                loading={loading || dataUrlLoading}
                size="lg"
                fullWidth
                mt="md"
                color="indigo"
                disabled={!selectedImage}
            >
                Nudify | 20 tokens
            </Button>
        </Stack>
    );
}