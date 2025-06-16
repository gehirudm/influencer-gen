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
    Collapse
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconAlertCircle, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';
import { aspectRatios } from './ImageGenerationForm';
import { useImageToDataUrl } from '@/hooks/useImgToDataUrl';
import { COST_MAP } from '@/lib/cost';

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
    loading,
    selectedImage,
    setSelectedImage,
    onSubmit,
    setFormValue
}: NudifyFormProps) {
    const { dataUrl, loading: dataUrlLoading } = useImageToDataUrl(selectedImage);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

    const handleSubmit = () => {
        if (dataUrl) {
            const promptParts = [
                `${selectedOptions.age} years old woman`,
                `${selectedOptions.body_type.toLowerCase()} body type`,
                `${selectedOptions.breast_size.toLowerCase()} breasts`,
                `${selectedOptions.butt_size.toLowerCase()} butt`,
                `${selectedOptions.cloth}`,
                `${selectedOptions.pose} pose`,
                "high quality, detailed, realistic"
            ];

            const prompt = promptParts.join(", ");

            // Set the base image and prompt for nudify processing
            form.setFieldValue('base_img', dataUrl.split(',')[1]); // Remove the data:image/... prefix
            form.setFieldValue('prompt', prompt); // Set the constructed prompt
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

            {Object.entries(nudifyOptions).map(([key, options]) => (
                <AccordionSection
                    title={options.label}
                    key={key}
                    options={options.values}
                    value={selectedOptions[key]}
                    onChange={(value: string) => setSelectedOptions({ ...selectedOptions, [key]: value })}
                />
            ))}

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
                Undress AI | {COST_MAP.nudify} tokens
            </Button>
        </Stack>
    );
}