import { useState } from 'react';
import {
    TextInput,
    Select,
    NumberInput,
    Stack,
    Title,
    Button,
    Group,
    Text,
    Slider,
    ActionIcon,
    Tooltip,
    Box,
    SimpleGrid,
    Center,
    Paper
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconRefresh, IconEraser, IconChevronUp } from '@tabler/icons-react';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';
import { aspectRatios } from './ImageGenerationForm';
import { COST_MAP } from '@/lib/cost';

interface AdvancedFormProps {
    form: UseFormReturnType<any>;
    loading: boolean;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    selectedImageDimensions: { width: number, height: number } | null;
    setSelectedImageDimensions: (dimensions: { width: number, height: number } | null) => void;
    maskImage: string | null;
    setMaskImage: (mask: string | null) => void;
    setMaskEditorOpen: (open: boolean) => void;
    onSubmit: () => void;
    setFormValue: (name: string, value: any) => void;
}

export function AdvancedForm({
    form,
    loading,
    selectedImage,
    setSelectedImage,
    selectedImageDimensions,
    setSelectedImageDimensions,
    maskImage,
    setMaskImage,
    setMaskEditorOpen,
    onSubmit,
    setFormValue
}: AdvancedFormProps) {
    // Generate a random seed
    const generateRandomSeed = () => {
        const randomSeed = Math.floor(Math.random() * 1000000000).toString();
        form.setFieldValue('seed', randomSeed);
    };

    // Clear the seed field
    const clearSeed = () => {
        form.setFieldValue('seed', '');
    };

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

    return (
        <form onSubmit={onSubmit}>
            <Stack gap="md">

                {/* Basic Settings */}
                <TextInput
                    label="Image Prompt"
                    placeholder="A beautiful portrait of a woman with long hair"
                    required
                    {...form.getInputProps('prompt')}
                />

                <TextInput
                    label="Negative Prompt"
                    placeholder="ugly, distorted, low quality"
                    {...form.getInputProps('negative_prompt')}
                />

                <Select
                    label="Model"
                    data={[
                        { value: 'realism', label: 'Realism' },
                        { value: 'lustify', label: 'Lustify' }
                    ]}
                    {...form.getInputProps('model_name')}
                />

                {/* Image Upload for img2img */}
                <Title order={4}>Upload Image (Optional)</Title>
                <Text size="sm" c="dimmed">Upload an image to transform it rather than generating from scratch</Text>

                <FileDropzonePreview
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    onImageLoad={(e) => {
                        setSelectedImageDimensions({
                            width: e.currentTarget.naturalWidth,
                            height: e.currentTarget.naturalHeight
                        });
                    }}
                    label="Drag and drop an image here or click to select a file"
                />

                {selectedImage && (
                    <>
                        <Group grow>
                            <Button
                                variant="light"
                                onClick={() => setMaskEditorOpen(true)}
                                disabled={!selectedImage}
                            >
                                Edit Mask
                            </Button>
                            <Button
                                variant="light"
                                color="red"
                                onClick={() => {
                                    setSelectedImage(null);
                                    setMaskImage(null);
                                    setSelectedImageDimensions(null);
                                }}
                            >
                                Remove Image
                            </Button>
                        </Group>

                        {maskImage && (
                            <Paper withBorder={false} p="xs" mt="xs">
                                <Text size="sm" fw={500} mb="xs">Current Mask:</Text>
                                <Group justify="center">
                                    <Paper withBorder style={{ position: 'relative', maxWidth: '100%' }}>
                                        <img
                                            src={maskImage}
                                            alt="Mask"
                                            style={{
                                                maxWidth: '200px',
                                                borderRadius: 'var(--mantine-radius-md)'
                                            }}
                                            onLoad={e => {
                                                console.log({
                                                    width: e.currentTarget.naturalWidth,
                                                    height: e.currentTarget.naturalHeight
                                                })
                                            }}
                                        />
                                    </Paper>
                                </Group>
                            </Paper>
                        )}

                        <Text size="sm" c="dimmed">Transformation Strength</Text>

                        <Slider
                            label={`Transformation Strength: ${form.values.strength}`}
                            pb={20}
                            px={20}
                            min={0}
                            max={1}
                            step={0.05}
                            marks={[
                                { value: 0, label: 'Subtle' },
                                { value: 0.5, label: 'Balanced' },
                                { value: 1, label: 'Complete' },
                            ]}
                            {...form.getInputProps('strength')}
                        />
                    </>
                )}

                {/* Advanced Settings */}
                <Title order={4}>Advanced Settings</Title>

                <Group grow>
                    <NumberInput
                        label="Steps"
                        min={10}
                        max={150}
                        {...form.getInputProps('steps')}
                    />
                    <NumberInput
                        label="CFG Scale"
                        min={1}
                        max={30}
                        step={0.5}
                        {...form.getInputProps('cfg_scale')}
                    />
                </Group>

                <Group align="flex-end">
                    <TextInput
                        label="Seed"
                        placeholder="Leave empty for random"
                        style={{ flex: 1 }}
                        {...form.getInputProps('seed')}
                    />
                    <Group>
                        <Tooltip label="Generate random seed">
                            <ActionIcon onClick={generateRandomSeed} variant="light">
                                <IconRefresh size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Clear seed">
                            <ActionIcon onClick={clearSeed} variant="light" color="red">
                                <IconEraser size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                {renderImageFormatSelector()}

                <Button
                    type="submit"
                    loading={loading}
                    size="lg"
                    fullWidth
                    mt="md"
                    color="indigo"
                >
                    Generate | {COST_MAP.image_generation_advanced} tokens
                </Button>
            </Stack>
        </form>
    );
}