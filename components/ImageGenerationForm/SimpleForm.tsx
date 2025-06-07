import { useState } from 'react';
import {
    Image as MantineImage,
    Button,
    Group,
    Stack,
    Text,
    Paper,
    Collapse,
    UnstyledButton,
    SimpleGrid,
    Center,
    Box
} from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { aspectRatios } from './ImageGenerationForm';

// Sample model images for the simple mode
const modelImages = [
    { id: 1, title: 'Fashion Model', src: 'https://firebasestorage.googleapis.com/v0/b/influncer-gen.firebasestorage.app/o/generated-images%2FuQCRZ39xGZQiaWPEW4JZF56EorE3%2Fe4256731-0caf-4f87-9417-a81e86f9e7c7-e1-image_0.png?alt=media&token=701211ba-c27e-47e6-bedb-19ddefd32a24',  },
    { id: 2, title: 'Casual Style', src: 'https://firebasestorage.googleapis.com/v0/b/influncer-gen.firebasestorage.app/o/generated-images%2FRN3etXjphXOf4qhazofuJjPHOSl2%2F6c8969cb-ebde-487a-b83c-278c0d255e3d-u2-image_0.png?alt=media&token=fd55bf25-6a3d-468c-8ae8-bc42397728ca',  },
    { id: 3, title: 'Business Look', src: 'https://firebasestorage.googleapis.com/v0/b/influncer-gen.firebasestorage.app/o/generated-images%2FuQCRZ39xGZQiaWPEW4JZF56EorE3%2Fe4256731-0caf-4f87-9417-a81e86f9e7c7-e1-image_0.png?alt=media&token=701211ba-c27e-47e6-bedb-19ddefd32a24',  },
];

// Simple mode options
const genderOptions = ['Female', 'Male'];
const ethnicityOptions = ['Caucasian', 'Asian', 'African', 'Hispanic', 'Middle Eastern', 'Indian'];
const hairColorOptions = ['Black', 'Brown', 'Blonde', 'Red', 'Blue', 'Pink', 'Purple', 'Green'];
const hairstyleOptions = ['Long', 'Short', 'Curly', 'Straight', 'Wavy', 'Ponytail', 'Bun', 'Braided'];
const outfitOptions = ['Casual', 'Formal', 'Swimwear', 'Sportswear', 'Evening Gown', 'Business Attire'];
const poseOptions = ['Standing', 'Sitting', 'Walking', 'Running', 'Lying Down', 'Dancing'];
const backgroundOptions = ['Studio', 'Beach', 'City', 'Nature', 'Abstract', 'Gradient', 'Solid Color'];

interface SimpleFormProps {
    form: UseFormReturnType<any>;
    loading: boolean;
    onSubmit: () => void;
}

export function SimpleForm({ form, loading, onSubmit }: SimpleFormProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>('1. Model');
    const [selectedModelId, setSelectedModelId] = useState<number | null>(1);
    const [selectedGender, setSelectedGender] = useState<string>('Female');
    const [ethnicity, setEthnicity] = useState<string | null>(null);
    const [hairColor, setHairColor] = useState<string | null>(null);
    const [hairstyle, setHairstyle] = useState<string | null>(null);
    const [outfit, setOutfit] = useState<string | null>(null);
    const [pose, setPose] = useState<string | null>(null);
    const [background, setBackground] = useState<string | null>(null);

    // Toggle section expansion for simple mode
    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Build prompt based on selected options in simple mode
    const buildSimplePrompt = () => {
        // Get the selected model title
        const selectedModel = modelImages.find(model => model.id === selectedModelId);
        let modelType = selectedModel ? selectedModel.title.toLowerCase() : 'fashion model';

        let prompt = `A ${selectedGender.toLowerCase()} ${modelType}`;

        if (ethnicity) prompt += ` with ${ethnicity.toLowerCase()} ethnicity`;
        if (hairColor) prompt += `, ${hairColor.toLowerCase()} hair`;
        if (hairstyle) prompt += ` styled in a ${hairstyle.toLowerCase()}`;
        if (outfit) prompt += `, wearing ${outfit.toLowerCase()} outfit`;
        if (pose) prompt += `, ${pose.toLowerCase()} pose`;
        if (background) prompt += `, with ${background.toLowerCase()} background`;

        // Add high quality descriptors
        prompt += `, high quality, professional photography, detailed features, perfect lighting`;

        return prompt;
    };

    // Handle form submission
    const handleSubmit = () => {
        form.setFieldValue('prompt', buildSimplePrompt());
        onSubmit();
    };

    // Render accordion section for simple mode
    const renderAccordionSection = (title: string, options: string[], value: string | null, onChange: (value: string) => void) => {
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
                    onClick={() => toggleSection(title)}
                    style={{ width: '100%' }}
                >
                    <Group justify="space-between" mb={isExpanded ? 'md' : 0}>
                        <Text fw={500}>{title}</Text>
                        {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </Group>
                </UnstyledButton>

                <Collapse in={isExpanded}>
                    {title === '1. Model' ? (
                        <div>
                            <Group gap="md" wrap="nowrap" style={{ overflowX: 'auto', padding: '10px 0' }}>
                                {modelImages.map((model) => (
                                    <div
                                        key={model.id}
                                        style={{
                                            width: '180px',
                                            flexShrink: 0,
                                            cursor: 'pointer',
                                            position: 'relative'
                                        }}
                                        onClick={() => setSelectedModelId(model.id)}
                                    >
                                        <Paper
                                            withBorder
                                            radius="md"
                                            style={{
                                                borderColor: selectedModelId === model.id ? 'var(--mantine-color-blue-6)' : undefined,
                                                borderWidth: selectedModelId === model.id ? '2px' : '1px',
                                                overflow: 'hidden',
                                                height: '240px',
                                                width: '100%'
                                            }}
                                        >
                                            <MantineImage
                                                src={model.src}
                                                h={240}
                                                w={180}
                                                alt={model.title}
                                                fit='cover'
                                            />
                                        </Paper>
                                        <Text fw={500} ta="center" mt="xs" size="sm">
                                            {model.title}
                                        </Text>
                                    </div>
                                ))}
                            </Group>
                        </div>
                    ) : title === '2. Gender' ? (
                        <Group>
                            {genderOptions.map((gender) => (
                                <Button
                                    key={gender}
                                    variant={selectedGender === gender ? "filled" : "outline"}
                                    onClick={() => setSelectedGender(gender)}
                                    radius="xl"
                                >
                                    {gender}
                                </Button>
                            ))}
                        </Group>
                    ) : (
                        <SimpleGrid cols={2} spacing="xs">
                            {options.map((option) => (
                                <Button
                                    key={option}
                                    variant={value === option ? "filled" : "outline"}
                                    onClick={() => onChange(option)}
                                    size="sm"
                                    mb="xs"
                                >
                                    {option}
                                </Button>
                            ))}
                        </SimpleGrid>
                    )}
                </Collapse>
            </Paper>
        );
    };

    // Render the image format selector for simple mode
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
        <Stack gap="md">
            {renderAccordionSection('1. Model', [], null, () => { })}
            {renderAccordionSection('2. Gender', [], null, () => { })}
            {renderAccordionSection('3. Ethnicity', ethnicityOptions, ethnicity, setEthnicity)}
            {renderAccordionSection('4. Hair Color', hairColorOptions, hairColor, setHairColor)}
            {renderAccordionSection('5. Hairstyle', hairstyleOptions, hairstyle, setHairstyle)}
            {renderAccordionSection('6. Outfit', outfitOptions, outfit, setOutfit)}
            {renderAccordionSection('7. Pose', poseOptions, pose, setPose)}
            {renderAccordionSection('8. Background', backgroundOptions, background, setBackground)}

            {renderImageFormatSelector()}

            <Button
                type="submit"
                loading={loading}
                size="lg"
                fullWidth
                onClick={handleSubmit}
                mt="md"
                color="indigo"
            >
                Generate | 10 tokens
            </Button>
        </Stack>
    );
}