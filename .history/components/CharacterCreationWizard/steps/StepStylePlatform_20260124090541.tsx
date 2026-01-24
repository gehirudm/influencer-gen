'use client';

import {
    Stack,
    Title,
    Text,
    Group,
    Checkbox,
    MultiSelect,
    Select,
    Box,
    Chip,
    Badge,
} from '@mantine/core';
import { CharacterWizardData } from '../CharacterCreationWizard';

interface StepStylePlatformProps {
    data: CharacterWizardData;
    onUpdate: (updates: Partial<CharacterWizardData>) => void;
}

const PLATFORM_OPTIONS = [
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'ONLYFANS', label: 'OnlyFans' },
];

const CLOTHING_STYLE_OPTIONS = [
    { value: 'casual', label: 'Casual' },
    { value: 'sporty', label: 'Sporty' },
    { value: 'elegant', label: 'Elegant' },
    { value: 'gothic', label: 'Gothic' },
    { value: 'cute', label: 'Cute/Kawaii' },
    { value: 'sexy', label: 'Sexy' },
    { value: 'bohemian', label: 'Bohemian' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'streetwear', label: 'Streetwear' },
];

const POSE_OPTIONS = [
    { value: 'standing', label: 'Standing Pose' },
    { value: 'sitting', label: 'Sitting Pose' },
    { value: 'laying', label: 'Laying Down' },
    { value: 'dancing', label: 'Dancing' },
    { value: 'workout', label: 'Workout/Fitness' },
    { value: 'selfie', label: 'Selfie' },
    { value: 'against_wall', label: 'Against Wall' },
    { value: 'bed', label: 'On Bed' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'professional', label: 'Professional' },
];

export function StepStylePlatform({ data, onUpdate }: StepStylePlatformProps) {
    const style = data.style || {
        platforms: [],
        clothingStyle: '',
        poses: [],
    };

    const handlePlatformsChange = (platforms: ('INSTAGRAM' | 'TIKTOK' | 'ONLYFANS')[]) => {
        onUpdate({
            style: {
                ...style,
                platforms,
            },
        });
    };

    const handleClothingStyleChange = (clothingStyle: string) => {
        onUpdate({
            style: {
                ...style,
                clothingStyle,
            },
        });
    };

    const handlePosesChange = (poses: string[]) => {
        onUpdate({
            style: {
                ...style,
                poses: poses as string[],
            },
        });
    };

    return (
        <Stack gap="lg">
            <div>
                <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                        <Title order={2} size="h3" mb="xs">
                            Style & Platform Intent
                        </Title>
                        <Text c="dimmed" size="sm">
                            Define where and how your character will be used
                        </Text>
                    </div>
                    <Badge color="blue" variant="light">
                        Optional
                    </Badge>
                </Group>
            </div>

            <Box style={{ backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                <Text size="sm" c="dimmed">
                    This information helps optimize content generation for your chosen platforms. You can update these settings anytime.
                </Text>
            </Box>

            {/* Platform Selection */}
            <div>
                <Text size="sm" fw={500} mb="xs">
                    Target Platforms
                </Text>
                <Group gap="xs">
                    {PLATFORM_OPTIONS.map((platform) => (
                        <Checkbox
                            key={platform.value}
                            label={platform.label}
                            checked={style.platforms.includes(platform.value as any)}
                            onChange={(e) => {
                                if (e.currentTarget.checked) {
                                    handlePlatformsChange([
                                        ...style.platforms,
                                        platform.value as 'INSTAGRAM' | 'TIKTOK' | 'ONLYFANS',
                                    ]);
                                } else {
                                    handlePlatformsChange(
                                        style.platforms.filter((p) => p !== platform.value)
                                    );
                                }
                            }}
                        />
                    ))}
                </Group>
                <Text size="xs" c="dimmed" mt="xs">
                    {style.platforms.length === 0
                        ? 'No platforms selected'
                        : `Selected: ${style.platforms.join(', ')}`}
                </Text>
            </div>

            {/* Clothing Style Selection */}
            <div>
                <Text size="sm" fw={500} mb="xs">
                    Preferred Clothing Style
                </Text>
                <Select
                    placeholder="Choose a clothing style"
                    data={CLOTHING_STYLE_OPTIONS}
                    value={style.clothingStyle}
                    onChange={(value) => handleClothingStyleChange(value || '')}
                    searchable
                    clearable
                />
                {style.clothingStyle && (
                    <Text size="xs" c="dimmed" mt="xs">
                        Style: {style.clothingStyle}
                    </Text>
                )}
            </div>

            {/* Pose Selection */}
            <div>
                <Text size="sm" fw={500} mb="xs">
                    Preferred Poses
                </Text>
                <MultiSelect
                    placeholder="Select one or more poses"
                    data={POSE_OPTIONS}
                    value={style.poses}
                    onChange={handlePosesChange}
                    searchable
                    clearable
                    maxSelectedValues={5}
                    description="Select up to 5 poses"
                />
                {style.poses.length > 0 && (
                    <Stack gap="xs" mt="xs">
                        <Text size="xs" fw={500}>
                            Selected poses:
                        </Text>
                        <Group gap="xs">
                            {style.poses.map((pose) => (
                                <Badge key={pose} variant="light">
                                    {pose}
                                </Badge>
                            ))}
                        </Group>
                    </Stack>
                )}
            </div>

            {/* Summary */}
            <Box style={{ backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '8px' }}>
                <Text size="sm" fw={500} mb="xs">
                    Content Profile:
                </Text>
                <Stack gap={4} size="xs">
                    <Text c="dimmed">
                        <Text component="span" fw={500}>
                            Platforms:
                        </Text>{' '}
                        {style.platforms.length > 0 ? style.platforms.join(', ') : 'Not specified'}
                    </Text>
                    <Text c="dimmed">
                        <Text component="span" fw={500}>
                            Style:
                        </Text>{' '}
                        {style.clothingStyle || 'Not specified'}
                    </Text>
                    <Text c="dimmed">
                        <Text component="span" fw={500}>
                            Poses:
                        </Text>{' '}
                        {style.poses.length > 0 ? style.poses.join(', ') : 'Not specified'}
                    </Text>
                </Stack>
            </Box>
        </Stack>
    );
}
