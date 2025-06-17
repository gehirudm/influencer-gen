"use client"

import { useState } from 'react';
import { Grid } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useUserJobs } from '@/hooks/useUserJobs';
import { useUserProjects } from '@/hooks/useUserProjects';
import EditImageModel from '@/components/Models/EditImageModel';
import ImageMaskEditor from '@/components/ImageMaskEditor';
import { useRouter, useSearchParams } from 'next/navigation';
import { ImageGenerationForm, aspectRatios } from '@/components/ImageGenerationForm/ImageGenerationForm';
import { UserJobsExplorer } from '@/components/UserJobsExplorer/UserJobsExplorer';
import { parseAsStringLiteral, useQueryState } from 'nuqs'

export default function ImageGeneratorPage() {
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

    const setFormValue = (field: string, value: any) => {
        console.log({ field, value });
        form.setFieldValue(field, value, { forceUpdate: true });
    };

    const { jobs: userJobs } = useUserJobs();
    const { projects: userProjects } = useUserProjects();
    const [loading, setLoading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedJobImages, setSelectedJobImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedImageDimentions, setSelectedImageDimensions] = useState<{ width: number, height: number } | null>(null);
    const [maskImage, setMaskImage] = useState<string | null>(null);
    const [generationMode, setGenerationMode] = useQueryState('gen_type', parseAsStringLiteral(["simple", "advanced", "nudify"] as const).withDefault("simple"))
    const [maskEditorOpen, setMaskEditorOpen] = useState(false);

    const router = useRouter();

    // Get dimensions based on selected aspect ratio
    const getDimensions = () => {
        if (selectedImageDimentions != null) {
            return selectedImageDimentions;
        }

        const selected = aspectRatios.find(ratio => ratio.value === form.values.aspectRatio);
        return selected ? { width: selected.width, height: selected.height } : { width: 800, height: 1200 };
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

    const handleEdit = (jobId: string) => {
        const job = userJobs.find(job => job.id === jobId);
        if (job && job.imageUrls) {
            setSelectedJobImages(job.imageUrls.map(url => url.privateUrl));
            setEditModalOpen(true);
        }
    };

    const handleImageSelect = async (imageUrl: string) => {
        setEditModalOpen(false);
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setSelectedImage(dataUrl);
            };

            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error fetching image data URL:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to load image data.',
                color: 'red',
            });
        }
    };

    const handleRecreate = (job: any) => {
        // Pre-fill form with job settings
        if (job && job.metadata) {
            const { prompt, negative_prompt, width, height, steps, cfg_scale, batch_size, model_name } = job.metadata;

            // Find matching aspect ratio or default to portrait
            let aspectRatio = 'portrait';
            for (const ratio of aspectRatios) {
                if (ratio.width === width && ratio.height === height) {
                    aspectRatio = ratio.value;
                    break;
                }
            }

            form.setValues({
                prompt,
                negative_prompt: negative_prompt || '',
                aspectRatio,
                steps,
                cfg_scale,
                batch_size,
                model_name: model_name || 'realism',
                seed: '',
                solver_order: job.metadata.solver_order || 2,
                strength: 0.75,
            });

            // Scroll to form
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleInpaint = async (job: any) => {
        if (job && job.imageUrls && job.imageUrls.length > 0) {
            // Set the first image as base image
            await handleImageSelect(job.imageUrls[0]);

            // Pre-fill form with job settings
            if (job.metadata) {
                const { prompt, negative_prompt, width, height, steps, cfg_scale, batch_size, model_name } = job.metadata;

                // Find matching aspect ratio or default to portrait
                let aspectRatio = 'portrait';
                for (const ratio of aspectRatios) {
                    if (ratio.width === width && ratio.height === height) {
                        aspectRatio = ratio.value;
                        break;
                    }
                }

                form.setValues({
                    prompt,
                    negative_prompt: negative_prompt || '',
                    aspectRatio,
                    steps,
                    cfg_scale,
                    batch_size,
                    model_name: model_name || 'realism',
                    seed: '',
                    solver_order: job.metadata.solver_order || 2,
                    strength: 0.5, // Set a moderate strength for inpainting
                });

                // Scroll to form
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const handleAddToProject = (job: any) => {
        // Implementation would be similar to the ImageGenCard's project modal
        // For now, just show a notification
        notifications.show({
            title: 'Feature Coming Soon',
            message: 'Add to project functionality will be available soon.',
            color: 'blue'
        });
    };

    const handleRecheckStatus = (jobId: string) => {
        notifications.show({
            title: 'Checking Status',
            message: 'Rechecking job status...',
            loading: true,
            autoClose: 2000,
        });

        // Actual implementation would involve checking the job status from the server
    };

    return (
        <>
            <Grid>
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <ImageGenerationForm
                        form={form}
                        loading={loading}
                        selectedImage={selectedImage}
                        setSelectedImage={setSelectedImage}
                        selectedImageDimensions={selectedImageDimentions}
                        setSelectedImageDimensions={setSelectedImageDimensions}
                        maskImage={maskImage}
                        setMaskImage={setMaskImage}
                        setMaskEditorOpen={setMaskEditorOpen}
                        onSubmit={handleGenerate}
                        generationMode={generationMode}
                        setGenerationMode={setGenerationMode}
                        setFormValue={setFormValue}
                    />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 7 }}>
                    <UserJobsExplorer
                        userProjects={userProjects}
                        onEdit={handleEdit}
                        onRecreate={handleRecreate}
                        onInpaint={handleInpaint}
                        onAddToProject={handleAddToProject}
                        onRecheckStatus={handleRecheckStatus}
                    />
                </Grid.Col>
            </Grid>

            <EditImageModel
                selectedJobImages={selectedJobImages}
                editModalOpen={editModalOpen}
                setEditModalOpen={setEditModalOpen}
                handleImageSelect={handleImageSelect}
            />

            {selectedImage && (
                <ImageMaskEditor
                    imageUrl={selectedImage}
                    width={getDimensions().width}
                    height={getDimensions().height}
                    opened={maskEditorOpen}
                    onClose={() => setMaskEditorOpen(false)}
                    onConfirm={(maskDataURL) => {
                        setMaskImage(maskDataURL);
                        setMaskEditorOpen(false);
                        notifications.show({
                            title: 'Mask Created',
                            message: 'Mask has been created successfully',
                            color: 'green'
                        });
                    }}
                    title="Create Image Mask"
                />
            )}
        </>
    );
}