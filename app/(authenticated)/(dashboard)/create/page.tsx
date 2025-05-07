"use client"

import { useState } from 'react';
import { Container, Grid, TextInput, Button, Image, Modal, Group, FileInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';

export default function ImageGeneratorPage() {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    negativePrompt,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate image');
            }

            const data = await response.json();
            console.log(data);
            // Assuming the response contains a URL to the generated image
            // setGeneratedImages([...generatedImages, data.imageUrl]);
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to generate image',
                color: 'red',
            });
        }
    };

    const handleImageClick = (image: string) => {
        setEnlargedImage(image);
    };

    const handleCloseModal = () => {
        setEnlargedImage(null);
    };

    return (
        <>
            <Grid grow>
                <Grid.Col span={4}>
                    <TextInput
                        label="Image Prompt"
                        placeholder="Enter image prompt"
                        value={prompt}
                        onChange={(event) => setPrompt(event.currentTarget.value)}
                        mb="md"
                    />
                    <TextInput
                        label="Negative Prompt"
                        placeholder="Enter negative prompt"
                        value={negativePrompt}
                        onChange={(event) => setNegativePrompt(event.currentTarget.value)}
                        mb="md"
                    />
                    <FileInput
                        label="Image Picker"
                        placeholder="Select an image"
                        value={selectedImage}
                        onChange={setSelectedImage}
                        mb="md"
                    />
                    <Button onClick={handleGenerate}>Generate Image</Button>
                </Grid.Col>

                <Grid.Col span={8}>
                    <Group>
                        {generatedImages.map((image, index) => (
                            <Image
                                key={index}
                                radius="md"
                                h={200}
                                w="auto"
                                fit="contain"
                                src={image}
                                onClick={() => handleImageClick(image)}
                                style={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Group>
                </Grid.Col>
            </Grid>

            <Modal opened={!!enlargedImage} onClose={handleCloseModal}>
                {enlargedImage && (
                    <div>
                        <Image src={enlargedImage} alt="Enlarged" width="100%" mb="md" />
                        <Button fullWidth mb="sm">Delete Image</Button>
                        <Button fullWidth mb="sm">Image to Image Generate</Button>
                        <Button fullWidth mb="sm">Add to Project</Button>
                        <Button fullWidth>Create Character</Button>
                    </div>
                )}
            </Modal>
        </>
    );
}