import { useState } from 'react';
import { Image as MantineImage, TextInput, Button, Group, NumberInput, Slider, Select, Stack, Title, Paper, SegmentedControl, Tooltip, Text, ActionIcon, Accordion, Box, Tabs, Card, SimpleGrid, Collapse, UnstyledButton, Center, Badge } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';
import { IconBrandInstagram, IconCropLandscape, IconCropPortrait, IconSquare, IconTrash, IconChevronDown, IconChevronUp, IconSettings, IconWand, IconPhoto } from '@tabler/icons-react';

// Aspect ratio component
function AspectRatioLabel(props: { label: string, ratio: string, Icon: any }) {
    return (
        <Stack align='center' gap={0}>
            <props.Icon size={25} stroke={1.5} />
            <Text m={0} size='sm'>{props.label}</Text>
            <Text m={0} c="dimmed" size='xs'>{props.ratio}</Text>
        </Stack>
    )
}

// Aspect ratio presets with their dimensions
export const aspectRatios = [
    { value: 'portrait', label: (<AspectRatioLabel label='Portrait' Icon={IconCropPortrait} ratio='(2:3)' />), width: 800, height: 1200 },
    { value: 'instagram', label: (<AspectRatioLabel label='Instagram' Icon={IconBrandInstagram} ratio='(4:5)' />), width: 864, height: 1080 },
    { value: 'square', label: (<AspectRatioLabel label='Square' Icon={IconSquare} ratio='(1:1)' />), width: 1024, height: 1024 },
    { value: 'landscape', label: (<AspectRatioLabel label='Landscape' Icon={IconCropLandscape} ratio='(3:2)' />), width: 1200, height: 800 },
];

interface ImageGenerationFormProps {
    form: UseFormReturnType<{
        prompt: string;
        negative_prompt: string;
        aspectRatio: string;
        steps: number;
        cfg_scale: number;
        seed: string;
        batch_size: number;
        solver_order: 2 | 3;
        strength: number;
        model_name: 'lustify' | 'realism';
    }>;
    loading: boolean;
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    selectedImageDimensions: { width: number, height: number } | null;
    setSelectedImageDimensions: (dimensions: { width: number, height: number } | null) => void;
    maskImage: string | null;
    setMaskImage: (mask: string | null) => void;
    setMaskEditorOpen: (open: boolean) => void;
    onSubmit: () => void;
}

// Sample model images for the simple mode
const modelImages = [
    { id: 1, src: 'https://firebasestorage.googleapis.com/v0/b/influncer-gen.firebasestorage.app/o/generated-images%2FuQCRZ39xGZQiaWPEW4JZF56EorE3%2Fe4256731-0caf-4f87-9417-a81e86f9e7c7-e1-image_0.png?alt=media&token=701211ba-c27e-47e6-bedb-19ddefd32a24', title: 'Fashion Model' },
    { id: 2, src: 'https://firebasestorage.googleapis.com/v0/b/influncer-gen.firebasestorage.app/o/generated-images%2FRN3etXjphXOf4qhazofuJjPHOSl2%2F6c8969cb-ebde-487a-b83c-278c0d255e3d-u2-image_0.png?alt=media&token=fd55bf25-6a3d-468c-8ae8-bc42397728ca', title: 'Casual Style' },
    { id: 3, src: 'https://firebasestorage.googleapis.com/v0/b/influncer-gen.firebasestorage.app/o/generated-images%2FuQCRZ39xGZQiaWPEW4JZF56EorE3%2Fe4256731-0caf-4f87-9417-a81e86f9e7c7-e1-image_0.png?alt=media&token=701211ba-c27e-47e6-bedb-19ddefd32a24', title: 'Business Look' },
];

// Simple mode options
const genderOptions = ['Female', 'Male'];
const ethnicityOptions = ['Caucasian', 'Asian', 'African', 'Hispanic', 'Middle Eastern', 'Indian'];
const hairColorOptions = ['Black', 'Brown', 'Blonde', 'Red', 'Blue', 'Pink', 'Purple', 'Green'];
const hairstyleOptions = ['Long', 'Short', 'Curly', 'Straight', 'Wavy', 'Ponytail', 'Bun', 'Braided'];
const outfitOptions = ['Casual', 'Formal', 'Swimwear', 'Sportswear', 'Evening Gown', 'Business Attire'];
const poseOptions = ['Standing', 'Sitting', 'Walking', 'Running', 'Lying Down', 'Dancing'];
const backgroundOptions = ['Studio', 'Beach', 'City', 'Nature', 'Abstract', 'Gradient', 'Solid Color'];

// Nudify mode options
const ageOptions = Array.from({ length: 31 }, (_, i) => (i + 18).toString());
const breastSizeOptions = ['Small', 'Normal', 'Large', 'Extra Large'];
const bodyTypeOptions = ['Slim', 'Normal', 'Athletic', 'Curvy', 'Plus Size'];
const buttSizeOptions = ['Small', 'Normal', 'Large', 'Extra Large'];
const clothingOptions = ['Fully Clothed', 'Lingerie', 'Swimwear', 'Partially Nude', 'Nude'];
const nudifyPoseOptions = ['Standing', 'Sitting', 'Lying Down', 'Bending Over', 'Kneeling'];

export function ImageGenerationForm({
    form,
    loading,
    selectedImage,
    setSelectedImage,
    selectedImageDimensions,
    setSelectedImageDimensions,
    maskImage,
    setMaskImage,
    setMaskEditorOpen,
    onSubmit
}: ImageGenerationFormProps) {
    const [imageLoading, setImageLoading] = useState(false);
    const [mode, setMode] = useState<'simple' | 'advanced' | 'nudify'>('simple');
    const [selectedModelId, setSelectedModelId] = useState<number | null>(1);
    const [selectedGender, setSelectedGender] = useState<string>('Female');

    // Simple mode state
    const [expandedSection, setExpandedSection] = useState<string | null>('1. Fashion Model');
    const [ethnicity, setEthnicity] = useState<string | null>(null);
    const [hairColor, setHairColor] = useState<string | null>(null);
    const [hairstyle, setHairstyle] = useState<string | null>(null);
    const [outfit, setOutfit] = useState<string | null>(null);
    const [pose, setPose] = useState<string | null>(null);
    const [background, setBackground] = useState<string | null>(null);

    // Nudify mode state
    const [age, setAge] = useState<string>('20');
    const [breastSize, setBreastSize] = useState<string>('Normal');
    const [bodyType, setBodyType] = useState<string>('Normal');
    const [buttSize, setButtSize] = useState<string>('Normal');
    const [clothing, setClothing] = useState<string>('Nude');
    const [nudifyPose, setNudifyPose] = useState<string>('None');

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

    // Build prompt based on selected options in nudify mode
    const buildNudifyPrompt = () => {
        let prompt = `A ${age} year old ${selectedGender.toLowerCase()}`;

        if (bodyType !== 'Normal') prompt += ` with ${bodyType.toLowerCase()} body type`;
        if (breastSize !== 'Normal') prompt += `, ${breastSize.toLowerCase()} breasts`;
        if (buttSize !== 'Normal') prompt += `, ${buttSize.toLowerCase()} butt`;
        if (clothing !== 'Fully Clothed') prompt += `, ${clothing.toLowerCase()}`;
        if (nudifyPose !== 'None') prompt += `, in a ${nudifyPose.toLowerCase()} pose`;

        return prompt;
    };

    // Handle form submission based on current mode
    const handleSubmit = () => {
        if (mode === 'simple') {
            form.setFieldValue('prompt', buildSimplePrompt());
        } else if (mode === 'nudify') {
            form.setFieldValue('prompt', buildNudifyPrompt());
            form.setFieldValue('model_name', 'lustify');
        }

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
                            <Center>
                                <Stack align="center" gap={5}>
                                    <ratio.label.props.Icon size={20} />
                                    <Text size="xs">{ratio.label.props.label}</Text>
                                    <Text size="xs" c="dimmed">{ratio.label.props.ratio}</Text>
                                </Stack>
                            </Center>
                        </Paper>
                    ))}
                </SimpleGrid>
            </Box>
        );
    };

    // Render the nudify mode form
    const renderNudifyForm = () => {
        return (
            <Stack gap="md">
                <Title order={4}>Upload Image</Title>
                <FileDropzonePreview
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    loading={imageLoading}
                    onImageLoad={(e) => {
                        setSelectedImageDimensions({
                            width: e.currentTarget.naturalWidth,
                            height: e.currentTarget.naturalHeight
                        });
                    }}
                    label="Upload base image for transformation"
                />

                <Group justify="right">
                    <Button
                        variant="subtle"
                        size="sm"
                        leftSection={<IconSettings size={16} />}
                        onClick={() => setMode('advanced')}
                    >
                        Hide Options
                    </Button>
                </Group>

                <Select
                    label="👤 Age"
                    data={ageOptions}
                    value={age}
                    onChange={(value) => setAge(value || '20')}
                    searchable
                />

                <Select
                    label="🍈 Breast Size"
                    data={breastSizeOptions}
                    value={breastSize}
                    onChange={(value) => setBreastSize(value || 'Normal')}
                />

                <Select
                    label="👤 Body Type"
                    data={bodyTypeOptions}
                    value={bodyType}
                    onChange={(value) => setBodyType(value || 'Normal')}
                />

                <Select
                    label="🍑 Butt Size"
                    data={buttSizeOptions}
                    value={buttSize}
                    onChange={(value) => setButtSize(value || 'Normal')}
                />

                <Select
                    label="👚 Clothing"
                    data={clothingOptions}
                    value={clothing}
                    onChange={(value) => setClothing(value || 'Nude')}
                />

                <Select
                    label="🧍 Pose"
                    data={nudifyPoseOptions}
                    value={nudifyPose}
                    onChange={(value) => setNudifyPose(value || 'None')}
                />

                <Button
                    type="submit"
                    loading={loading}
                    size="lg"
                    fullWidth
                    onClick={handleSubmit}
                    mt="md"
                >
                    GENERATE
                </Button>
            </Stack>
        );
    };

    // Render the simple mode form
    const renderSimpleForm = () => {
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
                    Generate | 2 tokens
                </Button>
            </Stack>
        );
    };

    // Render the advanced mode form (original form)
    const renderAdvancedForm = () => {
        return (
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Stack gap="md">
                    <Title order={3}>Image Generation</Title>

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

                    <SegmentedControl
                        fullWidth
                        disabled={!!selectedImage}
                        data={aspectRatios.map(ratio => ({
                            value: ratio.value,
                            label: ratio.label
                        }))}
                        {...form.getInputProps('aspectRatio')}
                    />

                    {/* Advanced Settings */}
                    <Title order={4}>Advanced Settings</Title>

                    <NumberInput
                        label="Batch Size"
                        description="Number of images to generate (1-4)"
                        min={1}
                        max={4}
                        {...form.getInputProps('batch_size')}
                    />

                    <Tooltip label="Higher values make the image follow the prompt more closely">
                        <Stack gap={0}>
                            <Text size="sm">CFG Scale ({form.values.cfg_scale})</Text>
                            <Slider
                                min={1}
                                max={15}
                                step={0.5}
                                {...form.getInputProps('cfg_scale')}
                            />
                        </Stack>
                    </Tooltip>

                    <Tooltip label="More steps generally produce higher quality images but take longer">
                        <Stack gap={0}>
                            <Text size="sm">Steps ({form.values.steps})</Text>
                            <Slider
                                min={10}
                                max={50}
                                step={1}
                                {...form.getInputProps('steps')}
                            />
                        </Stack>
                    </Tooltip>

                    <TextInput
                        label="Seed"
                        description="Leave empty for random seed"
                        placeholder="e.g. 42"
                        {...form.getInputProps('seed')}
                    />

                    <Select
                        label="Solver Order"
                        data={[
                            { value: '2', label: 'DPM++ 2M' },
                            { value: '3', label: 'DPM++ 3M' }
                        ]}
                        {...form.getInputProps('solver_order')}
                    />

                    {/* Image to Image Settings */}
                    {selectedImage && (
                        <Tooltip label="How much to transform the base image (0 = no change, 1 = complete change)">
                            <Stack gap={0}>
                                <Text size="sm">Transformation Strength ({form.values.strength.toFixed(2)})</Text>
                                <Slider
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    {...form.getInputProps('strength')}
                                />
                            </Stack>
                        </Tooltip>
                    )}

                    <Title order={4}>Base Image</Title>
                    <FileDropzonePreview
                        selectedImage={selectedImage}
                        setSelectedImage={setSelectedImage}
                        loading={imageLoading}
                        onImageLoad={(e) => {
                            setSelectedImageDimensions({
                                width: e.currentTarget.naturalWidth,
                                height: e.currentTarget.naturalHeight
                            });
                        }}
                        label="Upload base image for img2img generation"
                    />

                    {selectedImage && (
                        <>
                            <Group justify="space-between" align="center">
                                <Title order={4}>Mask Image</Title>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onClick={() => setMaskEditorOpen(true)}
                                    disabled={!selectedImage}
                                >
                                    Create Mask
                                </Button>
                            </Group>

                            {maskImage ? (
                                <Paper p="xs" withBorder shadow="sm" radius="md" style={{ position: 'relative' }}>
                                    <Group justify="center">
                                        <MantineImage
                                            src={maskImage}
                                            alt="Mask Preview"
                                            fit="contain"
                                            mah={200}
                                        />
                                    </Group>
                                    <ActionIcon
                                        color="red"
                                        variant="filled"
                                        radius="xl"
                                        size="md"
                                        pos="absolute"
                                        top={5}
                                        right={5}
                                        onClick={() => setMaskImage(null)}
                                        aria-label="Clear mask"
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Paper>
                            ) : (
                                <Text c="dimmed" size="sm" ta="center" py="md">
                                    No mask created yet. Click "Create Mask" to define areas to be modified.
                                </Text>
                            )}
                        </>
                    )}

                    <Button
                        type="submit"
                        loading={loading}
                        size="lg"
                        fullWidth
                    >
                        Generate Image
                    </Button>
                </Stack>
            </form>
        );
    };

    return (
        <Paper withBorder p="md" radius="md">
            <Tabs value={mode} onChange={(value) => setMode(value as 'simple' | 'advanced' | 'nudify')}>
                <Tabs.List grow mb="md">
                    <Tabs.Tab value="simple" leftSection={<IconWand size={16} />}>
                        Simple
                    </Tabs.Tab>
                    <Tabs.Tab value="advanced" leftSection={<IconSettings size={16} />}>
                        Advanced
                    </Tabs.Tab>
                    <Tabs.Tab value="nudify" leftSection={<IconPhoto size={16} />}>
                        Nudify
                        <Badge ml={5} size="xs" variant="filled" color="red">18+</Badge>
                    </Tabs.Tab>
                </Tabs.List>

                {mode === 'simple' && renderSimpleForm()}
                {mode === 'advanced' && renderAdvancedForm()}
                {mode === 'nudify' && renderNudifyForm()}
            </Tabs>
        </Paper>
    );
}                                 