"use client"

import { useState } from 'react';
import { Grid, TextInput, Button, Group, FileInput, Loader, Modal, Image } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ImageGenCard } from '@/components/ImageGenCard';
import { useForm } from '@mantine/form';
import { useUserJobs } from '@/hooks/useUserJobs';
import { useUserProjects } from '@/hooks/useUserProjects';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';

export default function ImageGeneratorPage() {
    const form = useForm({
        initialValues: {
            prompt: '',
            negativePrompt: '',
            width: 720, // Default width for 720p portrait
            height: 1280, // Default height for 720p portrait
            selectedImage: null as File | null,
        },
    });

    const { jobs: userJobs } = useUserJobs();
    const { projects: userProjects } = useUserProjects();
    const [loading, setLoading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedJobImages, setSelectedJobImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);

    const handleGenerate = async () => {
        const { prompt, negativePrompt, width, height } = form.values;
        setLoading(true);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    negativePrompt,
                    width,
                    height,
                    ...(selectedImage !== null && { base_img: selectedImage }),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate image');
            }

            const data: RunPodsCompletedResponseData = await response.json();
            console.log(data);
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to generate image',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (jobId: string) => {
        const job = userJobs.find(job => job.id === jobId);
        if (job && job.imageUrls) {
            setSelectedJobImages(job.imageUrls);
            setEditModalOpen(true);
        }
    };

    const handleImageSelect = async (imageUrl: string) => {
        setImageLoading(true); // Set image loading to true
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
        } finally {
            setImageLoading(false); // Set image loading to false
        }
    };


    return (
        <>
            <Grid grow>
                <Grid.Col span={4}>
                    <form onSubmit={form.onSubmit(handleGenerate)}>
                        <TextInput
                            label="Image Prompt"
                            placeholder="Enter image prompt"
                            {...form.getInputProps('prompt')}
                            mb="md"
                        />
                        <TextInput
                            label="Negative Prompt"
                            placeholder="Enter negative prompt"
                            {...form.getInputProps('negativePrompt')}
                            mb="md"
                        />
                        <TextInput
                            label="Width"
                            placeholder="Enter width"
                            type="number"
                            {...form.getInputProps('width')}
                            mb="md"
                        />
                        <TextInput
                            label="Height"
                            placeholder="Enter height"
                            type="number"
                            {...form.getInputProps('height')}
                            mb="md"
                        />
                        <FileDropzonePreview
                            selectedImage={selectedImage}
                            setSelectedImage={setSelectedImage}
                            loading={imageLoading}
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader size="sm" /> : 'Generate Image'}
                        </Button>
                    </form>
                </Grid.Col>

                <Grid.Col span={8}>
                    <Group>
                        {userJobs.map((job, index) => (
                            <ImageGenCard
                                key={index}
                                jobId={job.id}
                                status={job.status}
                                prompt={job.metadata.prompt}
                                imageUrls={job.imageUrls ? job.imageUrls : []}
                                imageIds={job.imageIds ? job.imageIds : []}
                                generationTime={job.executionTime}
                                dimensions={{ width: job.metadata.width, height: job.metadata.height }}
                                userProjects={userProjects}
                                onEdit={handleEdit} // Pass the edit handler
                            />
                        ))}
                    </Group>
                </Grid.Col>
            </Grid>

            <Modal opened={editModalOpen} onClose={() => setEditModalOpen(false)} title="Select Image to Edit">
                <Grid>
                    {selectedJobImages.map((url, index) => (
                        <Grid.Col span={4} key={index}>
                            <Image
                                src={url}
                                alt={`Image ${index}`}
                                onClick={() => handleImageSelect(url)}
                                style={{ cursor: 'pointer' }}
                            />
                        </Grid.Col>
                    ))}
                </Grid>
            </Modal>
        </>
    );
}