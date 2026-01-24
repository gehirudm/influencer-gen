'use client';

import {
    Stack,
    Title,
    Text,
    Group,
    Slider,
    Box,
    ThemeIcon,
    Badge,
} from '@mantine/core';
import { IconMoodSmile, IconHeart, IconCrown } from '@tabler/icons-react';
import { CharacterWizardData } from '../CharacterCreationWizard';

interface StepPersonalityProps {
    data: CharacterWizardData;
    onUpdate: (updates: Partial<CharacterWizardData>) => void;
}

export function StepPersonality({ data, onUpdate }: StepPersonalityProps) {
    const personality = data.personality || {
        confidence: 50,
        seduction: 50,
        dominance: 50,
    };

    const handleSliderChange = (key: 'confidence' | 'seduction' | 'dominance', value: number) => {
        onUpdate({
            personality: {
                ...personality,
                [key]: value,
            },
        });
    };

    const getSliderLabel = (value: number, lowLabel: string, highLabel: string) => {
        return `${lowLabel} ← ${value}% → ${highLabel}`;
    };

    return (
        <Stack gap="lg">
            <div>
                <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                        <Title order={2} size="h3" mb="xs">
                            Personality & Vibe
                        </Title>
                        <Text c="dimmed" size="sm">
                            Customize how your character feels and presents herself
                        </Text>
                    </div>
                    <Badge color="blue" variant="light">
                        Optional
                    </Badge>
                </Group>
            </div>

            <Box style={{ backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                <Text size="sm" c="dimmed">
                    These sliders help define your character's personality traits. You can always adjust these later.
                </Text>
            </Box>

            {/* Confidence Slider */}
            <Box>
                <Group gap="sm" mb="xs">
                    <ThemeIcon color="blue" variant="light" size="lg" radius="md">
                        <IconMoodSmile size={18} />
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                            Confidence Level
                        </Text>
                        <Text size="xs" c="dimmed">
                            {getSliderLabel(personality.confidence, 'Shy & Reserved', 'Confident & Bold')}
                        </Text>
                    </div>
                </Group>
                <Slider
                    value={personality.confidence}
                    onChange={(value) => handleSliderChange('confidence', value)}
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                        { value: 0, label: 'Shy' },
                        { value: 50, label: 'Balanced' },
                        { value: 100, label: 'Bold' },
                    ]}
                    color="blue"
                />
            </Box>

            {/* Seduction Slider */}
            <Box>
                <Group gap="sm" mb="xs">
                    <ThemeIcon color="pink" variant="light" size="lg" radius="md">
                        <IconHeart size={18} />
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                            Appeal Style
                        </Text>
                        <Text size="xs" c="dimmed">
                            {getSliderLabel(personality.seduction, 'Cute & Innocent', 'Seductive & Alluring')}
                        </Text>
                    </div>
                </Group>
                <Slider
                    value={personality.seduction}
                    onChange={(value) => handleSliderChange('seduction', value)}
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                        { value: 0, label: 'Cute' },
                        { value: 50, label: 'Balanced' },
                        { value: 100, label: 'Seductive' },
                    ]}
                    color="pink"
                />
            </Box>

            {/* Dominance Slider */}
            <Box>
                <Group gap="sm" mb="xs">
                    <ThemeIcon color="grape" variant="light" size="lg" radius="md">
                        <IconCrown size={18} />
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                            Personality Dynamic
                        </Text>
                        <Text size="xs" c="dimmed">
                            {getSliderLabel(personality.dominance, 'Soft & Gentle', 'Dominant & Commanding')}
                        </Text>
                    </div>
                </Group>
                <Slider
                    value={personality.dominance}
                    onChange={(value) => handleSliderChange('dominance', value)}
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                        { value: 0, label: 'Soft' },
                        { value: 50, label: 'Balanced' },
                        { value: 100, label: 'Dominant' },
                    ]}
                    color="grape"
                />
            </Box>

            {/* Summary */}
            <Box style={{ backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '8px' }}>
                <Text size="sm" fw={500} mb="xs">
                    Character Summary:
                </Text>
                <Text size="sm" c="dimmed">
                    Your character is{' '}
                    <Text component="span" fw={500} c="blue">
                        {personality.confidence >= 75 ? 'very confident' : personality.confidence >= 50 ? 'moderately confident' : 'somewhat shy'}
                    </Text>
                    , has a{' '}
                    <Text component="span" fw={500} c="pink">
                        {personality.seduction >= 75 ? 'seductive' : personality.seduction >= 50 ? 'balanced' : 'cute'}
                    </Text>{' '}
                    appeal, and presents a{' '}
                    <Text component="span" fw={500} c="grape">
                        {personality.dominance >= 75 ? 'dominant' : personality.dominance >= 50 ? 'balanced' : 'soft'}
                    </Text>{' '}
                    personality dynamic.
                </Text>
            </Box>
        </Stack>
    );
}
