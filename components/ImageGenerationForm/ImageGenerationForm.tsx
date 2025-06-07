import { useState } from 'react';
import { Stack, Paper, Text, Tabs } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { IconBrandInstagram, IconCropLandscape, IconCropPortrait, IconSquare, IconSettings, IconWand, IconPhoto } from '@tabler/icons-react';
import { SimpleForm } from './SimpleForm';
import { AdvancedForm } from './AdvancedForm';
import { NudifyForm } from './NudifyForm';

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
    { value: 'portrait', label: (<AspectRatioLabel label='Portrait' Icon={IconCropPortrait} ratio='(2:3)' />), width: 800, height: 1200, ratio: "(2:3)" },
    { value: 'instagram', label: (<AspectRatioLabel label='Instagram' Icon={IconBrandInstagram} ratio='(4:5)' />), width: 864, height: 1080, ratio: "(4:5)" },
    { value: 'square', label: (<AspectRatioLabel label='Square' Icon={IconSquare} ratio='(1:1)' />), width: 1024, height: 1024, ratio: "(1:1)" },
    { value: 'landscape', label: (<AspectRatioLabel label='Landscape' Icon={IconCropLandscape} ratio='(3:2)' />), width: 1200, height: 800, ratio: "(3:2)" },
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
    const [mode, setMode] = useState<'simple' | 'advanced' | 'nudify'>('simple');

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
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="simple">
                    <SimpleForm
                        form={form}
                        loading={loading}
                        onSubmit={onSubmit}
                    />
                </Tabs.Panel>
                <Tabs.Panel value="advanced">
                    <AdvancedForm
                        form={form}
                        loading={loading}
                        selectedImage={selectedImage}
                        setSelectedImage={setSelectedImage}
                        selectedImageDimensions={selectedImageDimensions}
                        setSelectedImageDimensions={setSelectedImageDimensions}
                        maskImage={maskImage}
                        setMaskImage={setMaskImage}
                        setMaskEditorOpen={setMaskEditorOpen}
                        onSubmit={onSubmit}
                    />
                </Tabs.Panel>
                <Tabs.Panel value="nudify">
                    <NudifyForm
                        form={form}
                        loading={loading}
                        selectedImage={selectedImage}
                        setSelectedImage={setSelectedImage}
                        // selectedImageDimensions={selectedImageDimensions}
                        // setSelectedImageDimensions={setSelectedImageDimensions}
                        onSubmit={onSubmit}
                    />
                </Tabs.Panel>
            </Tabs>
        </Paper>
    );
}                                 