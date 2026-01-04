"use client"

import { useState } from 'react';
import { 
    Grid, 
    Card, 
    Stack, 
    Button, 
    Textarea,
    Box,
    Text,
    Title,
    Image,
    Container,
    FileButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { useUserJobs } from '@/hooks/useUserJobs';
import { IconPhoto, IconUpload } from '@tabler/icons-react';

// Add CSS for pulse animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
        }
    `;
    if (!document.querySelector('[data-pulse-animation]')) {
        style.setAttribute('data-pulse-animation', 'true');
        document.head.appendChild(style);
    }
}

export default function UndressPage() {
    const form = useForm({
        initialValues: {
            prompt: '',
        },
    });

    const { jobs: userJobs } = useUserJobs();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBlur, setImageBlur] = useState(0);

    const handleImageUpload = (file: File | null) => {
        if (file) {
            setUploadedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUndress = async () => {
        if (!uploadedImage) {
            notifications.show({
                title: 'Error',
                message: 'Please upload an image first',
                color: 'red'
            });
            return;
        }

        setLoading(true);

        // Simulate processing
        setTimeout(() => {
            notifications.show({
                title: 'Processing',
                message: 'Image undressing in progress...',
                color: 'blue'
            });
            
            // Simulate completion after a delay
            setTimeout(() => {
                setLoading(false);
                notifications.show({
                    title: 'Success',
                    message: 'Image processing completed!',
                    color: 'green'
                });
            }, 8000);
        }, 1000);
    };

    // Get completed jobs with images
    const completedJobs = userJobs.filter(job => job.status === 'completed' && job.imageUrls && job.imageUrls.length > 0);
    const latestJob = completedJobs[0];
    const previousJobs = completedJobs.slice(1);

    return (
        <Container size="xl" py={{ base: 'md', md: 'xl' }}>
            <Grid gutter="md">
                {/* Left Column - Input Data */}
                <Grid.Col span={{ base: 12, md: 8 }} style={{ height: 'calc(100vh - 120px)' }}>
                    <Card p="lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Stack gap="md" style={{ flex: 1 }}>
                            <Title size="h3" c="white">Undress Image</Title>

                            {/* Image Upload */}
                            <Card p="md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}>
                                <Text size="sm" fw={500} mb="sm" c="white">Upload Image</Text>
                                <FileButton onChange={handleImageUpload} accept="image/png,image/jpeg,image/webp">
                                    {(props) => (
                                        <Box
                                            {...props}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '3/4',
                                                backgroundColor: '#1a1a1a',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px dashed #555',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {imagePreview ? (
                                                <img 
                                                    src={imagePreview} 
                                                    alt="Uploaded" 
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        objectFit: 'contain' 
                                                    }} 
                                                />
                                            ) : (
                                                <Stack align="center" gap="sm">
                                                    <IconUpload size={64} color="#4a7aba" />
                                                    <Text c="#4a7aba" size="lg" fw={500}>Click to Upload Image</Text>
                                                    <Text c="dimmed" size="sm">PNG, JPG, or WEBP</Text>
                                                </Stack>
                                            )}
                                        </Box>
                                    )}
                                </FileButton>
                            </Card>

                            {/* Prompt Input */}
                            <Textarea
                                label="Additional Instructions (Optional)"
                                placeholder="Add any specific instructions or preferences..."
                                minRows={4}
                                {...form.getInputProps('prompt')}
                            />
                        </Stack>

                        {/* Undress Button - Sticky at bottom */}
                        <Button
                            fullWidth
                            size="lg"
                            disabled={loading || !uploadedImage}
                            onClick={handleUndress}
                            mt="md"
                        >
                            {loading ? 'Processing...' : 'Undress (Costs Tokens)'}
                        </Button>
                    </Card>
                </Grid.Col>

                {/* Right Column - Output */}
                <Grid.Col span={{ base: 12, md: 4 }} style={{ height: 'calc(100vh - 120px)' }}>
                    <Card p="lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Stack gap="md" pb="md">
                            <Title size="h3" c="white">Result</Title>

                            {/* Current/Latest Image */}
                            <Card p="md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}>
                                <Box
                                    style={{
                                        width: '100%',
                                        aspectRatio: '3/4',
                                        backgroundColor: '#1a1a1a',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px dashed #555',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {loading ? (
                                        <Stack align="center" gap="sm">
                                            <IconPhoto size={64} color="#4a7aba" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                                            <Text c="#4a7aba" size="lg" fw={500}>Processing...</Text>
                                            <Text c="dimmed" size="sm">This may take a few moments</Text>
                                        </Stack>
                                    ) : !latestJob ? (
                                        <Stack align="center" gap="sm">
                                            <IconPhoto size={64} color="#666" />
                                            <Text c="dimmed" size="lg">No results yet</Text>
                                            <Text c="dimmed" size="sm">Your result will appear here</Text>
                                        </Stack>
                                    ) : (
                                        <Image
                                            src={latestJob.imageUrls[0].privateUrl}
                                            alt="Latest result"
                                            fit="contain"
                                            style={{ 
                                                width: '100%', 
                                                height: '100%',
                                                filter: `blur(${imageBlur}px)`,
                                                transition: 'none'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Card>

                            {/* Previous Results */}
                            {previousJobs.length > 0 && (
                                <>
                                    <Title size="h4" c="white" mt="md">Previous Results</Title>
                                    <Stack gap="md" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {previousJobs.map((job, index) => (
                                            <Card key={job.id} p="md" style={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}>
                                                <Image
                                                    src={job.imageUrls[0].privateUrl}
                                                    alt={`Result ${index + 2}`}
                                                    fit="contain"
                                                    style={{ width: '100%', maxHeight: 400 }}
                                                />
                                                {job.metadata?.prompt && (
                                                    <Text size="sm" c="dimmed" mt="sm" lineClamp={2}>
                                                        {job.metadata.prompt}
                                                    </Text>
                                                )}
                                            </Card>
                                        ))}
                                    </Stack>
                                </>
                            )}
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
