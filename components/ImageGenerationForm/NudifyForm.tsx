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
    Paper,
    UnstyledButton,
    Collapse,
    Switch
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconAlertCircle, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';
import { aspectRatios } from './ImageGenerationForm';
import { useImageToDataUrl } from '@/hooks/useImgToDataUrl';
import { COST_MAP } from '@/lib/cost';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';

interface NudifyFormProps {
    form: UseFormReturnType<any>;
    loading: boolean;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    onSubmit: () => void;
    setFormValue: (name: string, value: any) => void;
}

const nudifyOptions: Record<string, { label: string, values: string[] }> = {
    age: {
        label: "Age",
        values: ["18", "20", "30", "40", "50"]
    },
    breast_size: {
        label: "Breast Size",
        values: ["Small", "Normal", "Big"]
    },
    body_type: {
        label: "Body Type",
        values: ["Skinny", "Normal", "Curvy", "Muscular"]
    },
    butt_size: {
        label: "Butt Size",
        values: ["Small", "Normal", "Big"]
    },
    cloth: {
        label: "Cloth",
        values: [
            "Naked",
            "Bikini",
            "Lingerie",
            "Sport Wear",
            "Bdsm",
            "Latex",
            "Teacher",
            "Schoolgirl",
            "Bikini Leopard",
            "Naked Cum",
            "Naked Tatoo",
            "Witch",
            "Sexy Witch",
            "Sexy Maid",
            "Christmas Underwear",
            "Pregnant"
        ]
    },
    pose: {
        label: "Pose",
        values: [
            "Standing",
            "Missionary POV",
            "Anal Fuck",
            "Legs up presenting",
            "Spreading legs",
            "Tit Fuck",
            "TGirl",
            "Tits On Glass",
            "Cumshot",
            "Ahegao",
            "Ahegao cum",
            "Holding tits",
            "Cumshot POV",
            "Blowjob",
            "Doggy Style",
            "Shower Room",
            "Shibari",
            "Christmas",
            "Cowgirl POV"
        ]
    }
};

export function NudifyForm({
    form,
    selectedImage,
    setSelectedImage,
    onSubmit,
    setFormValue
}: NudifyFormProps) {
    const { dataUrl, loading: dataUrlLoading } = useImageToDataUrl(selectedImage);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [useFaceId, setUseFaceId] = useState(true);

    const router = useRouter();

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({
        age: "18",
        breast_size: "Normal",
        body_type: "Normal",
        butt_size: "Normal",
        cloth: "Naked",
        pose: "Standing"
    });

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

    const AccordionSection = ({ title, options, value, onChange }: { title: string, options: string[], value: string | null, onChange: (value: string) => void }) => {
        const isExpanded = expandedSection === title;

        return (
            <Paper
                withBorder
                p="md"
                radius="md"
                bg="dark.7"
                mb="md"
                style={{ overflow: 'hidden' }}
            >
                <UnstyledButton
                    onClick={() => setExpandedSection(title)}
                    style={{ width: '100%' }}
                >
                    <Group justify="space-between" mb={isExpanded ? 'md' : 0}>
                        <Text fw={500}>{title}</Text>
                        {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </Group>
                </UnstyledButton>

                <Collapse in={isExpanded}>
                    <Group>
                        {options.map((option) => (
                            <Button
                                key={option}
                                variant={value === option ? "filled" : "outline"}
                                onClick={() => onChange(option)}
                                radius="xl"
                            >
                                {option}
                            </Button>
                        ))}
                    </Group>
                </Collapse>
            </Paper>
        );
    };

    const handleSubmit = async () => {
        if (!dataUrl) return;

        const prompt = [
            `${selectedOptions.age} years old woman`,
            `${selectedOptions.body_type.toLowerCase()} body type`,
            `${selectedOptions.breast_size.toLowerCase()} breasts`,
            `${selectedOptions.butt_size.toLowerCase()} butt`,
            `${selectedOptions.cloth}`,
            `${selectedOptions.pose} pose`,
            "high quality, detailed, realistic, match the image as closely as possible, match the lighting",
        ].join(", ");

        // Set the base image and prompt for nudify processing
        form.setFieldValue('base_img', dataUrl.split(',')[1]); // Remove the data:image/... prefix
        form.setFieldValue('prompt', prompt); // Set the constructed prompt
        form.setFieldValue('model_name', 'nudify'); // Force nudify model
        form.setFieldValue('nudify', true);

        // Get dimensions based on selected aspect ratio
        const selectedRatio = aspectRatios.find(ratio => ratio.value === form.values.aspectRatio);
        const dimensions = selectedRatio ? { width: selectedRatio.width, height: selectedRatio.height } : { width: 800, height: 1200 };

        setLoading(true);

        try {
            // Prepare request payload
            const payload = {
                prompt: prompt,
                negative_prompt: "ugly, distorted, low quality, blurry, deformed features, drawing",
                width: dimensions.width,
                height: dimensions.height,
                model_name: "lustify",
                generation_type: 'nudify',
                base_img: dataUrl,
                cfg_scale: 9,
                steps: 100,
                auto_mask_clothes: true,
                use_face_id: useFaceId
            };

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
        <Stack gap="md">
            <Title order={3}>Upload Image</Title>
            <Text size="sm" c="dimmed">Upload an image of anyone fully clothed and we can remove them. Customize them to look however you want!</Text>

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

            {Object.entries(nudifyOptions).map(([key, options]) => (
                <AccordionSection
                    title={options.label}
                    key={key}
                    options={options.values}
                    value={selectedOptions[key]}
                    onChange={(value: string) => setSelectedOptions({ ...selectedOptions, [key]: value })}
                />
            ))}

            <Group mt="md">
                <Switch
                    label="Use Face ID"
                    description="Keep the face from the original image"
                    checked={useFaceId}
                    onChange={(event) => setUseFaceId(event.currentTarget.checked)}
                    size="md"
                />
            </Group>

            {renderImageFormatSelector()}

            <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Pro Tip"
                color="blue"
                variant="light"
                mt="md"
            >
                For better results than Undress AI, use Character Engine to create custom characters.
            </Alert>


            <Button
                onClick={handleSubmit}
                loading={loading || dataUrlLoading}
                size="lg"
                fullWidth
                mt="md"
                color="indigo"
                disabled={!selectedImage}
            >
                Undress AI | {COST_MAP.nudify} tokens
            </Button>
        </Stack>
    );
}