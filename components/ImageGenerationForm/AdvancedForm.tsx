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
import { useForm, UseFormReturnType } from '@mantine/form';
import { IconRefresh, IconEraser, IconChevronUp } from '@tabler/icons-react';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';
import { aspectRatios } from './ImageGenerationForm';
import { COST_MAP } from '@/lib/cost';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';

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
    selectedImage,
    setSelectedImage,
    selectedImageDimensions,
    setSelectedImageDimensions,
    maskImage,
    setMaskImage,
    setMaskEditorOpen,
    setFormValue
}: AdvancedFormProps) {
    const generationMode = "advanced";
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    // Function to get dimensions based on selected aspect ratio
    const getDimensions = () => {
        // If we have an image and we're doing img2img, use its dimensions
        if (selectedImage && selectedImageDimensions) {
            return selectedImageDimensions;
        }

        // Otherwise use the selected aspect ratio
        const ratio = aspectRatios.find(r => r.value === form.values.aspectRatio);
        if (!ratio) {
            return { width: 512, height: 768 }; // Default to portrait if not found
        }
        
        return {
            width: ratio.width,
            height: ratio.height
        };
    };

    const form = useForm({
        initialValues: {
            prompt: '',
            negative_prompt: '',
            aspectRatio: 'portrait',
            steps: 30,
            cfg_scale: 3,
            seed: '',
            batch_size: 1,
            solver_order: 2 as 2 | 3,
            strength: 0.75,
            model_name: 'realism' as 'lustify' | 'realism',
            nudify: false
        },
        validate: {
            prompt: (value) => value.trim().length === 0 ? 'Prompt is required' : null,
            batch_size: (value) => value < 1 || value > 4 ? 'Batch size must be between 1 and 4' : null,
            strength: (value) => value < 0 || value > 1 ? 'Strength must be between 0 and 1' : null,
        }
    });

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

    const handleGenerate = async () => {
        const { width, height } = getDimensions();
        console.log(width, height);
        setLoading(true);

        try {
            // Prepare request payload
            const payload: Partial<ImageGenerationRequestInput> = {
                prompt: form.values.prompt,
                negative_prompt: form.values.negative_prompt || undefined,
                width,
                height,
                steps: form.values.steps,
                cfg_scale: form.values.cfg_scale,
                seed: form.values.seed ? Number(form.values.seed) : undefined,
                batch_size: form.values.batch_size,
                solver_order: form.values.solver_order,
                model_name: form.values.model_name,
                auto_mask_clothes: form.values.nudify,
                generation_type: generationMode,
            };

            // Add base image if selected
            if (selectedImage) {
                payload.base_img = selectedImage;
                payload.strength = form.values.strength;
            }

            // Add mask image if selected
            if (maskImage && selectedImage) {
                payload.mask_img = maskImage;
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 401) {
                notifications.show({
                    title: 'Session Expired',
                    message: 'Please log in again to continue generating images.',
                    color: 'blue'
                });
                router.push('/auth');
                setLoading(false);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate image');
            }

            notifications.show({
                title: 'Success',
                message: 'Image generation started successfully!',
                color: 'green'
            });

            // Reset form if needed
            // form.reset();
            // setSelectedImage(null);
            // setMaskImage(null);
        } catch (error: any) {
            console.error('Error generating image:', error);
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to generate image',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form>
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
                    loading={loading}
                    size="lg"
                    fullWidth
                    mt="md"
                    color="indigo"
                    onClick={handleGenerate}
                >
                    Generate | {COST_MAP.image_generation_advanced} tokens
                </Button>
            </Stack>
        </form>
    );
}