'use client';

import {
    Stack,
    TextInput,
    Select,
    Textarea,
    Title,
    Text,
    Group,
    Badge,
    SimpleGrid,
} from '@mantine/core';
import { CharacterWizardData } from '../CharacterCreationWizard';

interface StepBasicsProps {
    data: CharacterWizardData;
    onUpdate: (updates: Partial<CharacterWizardData>) => void;
}

const GENDER_OPTIONS = [
    { value: 'FEMALE', label: 'Female' },
    { value: 'MALE', label: 'Male' },
    { value: 'OTHER', label: 'Other' },
];

const AGE_RANGE_OPTIONS = [
    { value: '18-21', label: '18-21' },
    { value: '22-25', label: '22-25' },
    { value: '26-30', label: '26-30' },
    { value: '31-35', label: '31-35' },
    { value: '36-40', label: '36-40' },
    { value: '40+', label: '40+' },
];

const BODY_TYPE_OPTIONS = [
    { value: 'petite', label: 'Petite' },
    { value: 'athletic', label: 'Athletic' },
    { value: 'curvy', label: 'Curvy' },
    { value: 'average', label: 'Average' },
    { value: 'tall', label: 'Tall' },
    { value: 'busty', label: 'Busty' },
];

export function StepBasics({ data, onUpdate }: StepBasicsProps) {
    return (
        <Stack gap="md">
            <div>
                <Title order={2} size="h3" mb="xs">
                    Basic Character Information
                </Title>
                <Text c="dimmed" size="sm" mb="md">
                    Define the core attributes of your character
                </Text>
            </div>

            <TextInput
                label="Character Name"
                placeholder="e.g., Sophia, Alex, Luna"
                required
                value={data.name}
                onChange={(e) => onUpdate({ name: e.currentTarget.value })}
                description="Choose a memorable name for your character"
            />

            <SimpleGrid cols={2} spacing="md">
                <Select
                    label="Gender"
                    placeholder="Select gender"
                    data={GENDER_OPTIONS}
                    required
                    value={data.gender}
                    onChange={(value) =>
                        onUpdate({ gender: (value as 'FEMALE' | 'MALE' | 'OTHER') || 'FEMALE' })
                    }
                    searchable
                />

                <Select
                    label="Age Range"
                    placeholder="Select age range"
                    data={AGE_RANGE_OPTIONS}
                    required
                    value={data.ageRange}
                    onChange={(value) => onUpdate({ ageRange: value || '' })}
                    searchable
                />
            </SimpleGrid>

            <Select
                label="Body Type"
                placeholder="Select body type"
                data={BODY_TYPE_OPTIONS}
                required
                value={data.bodyType}
                onChange={(value) => onUpdate({ bodyType: value || '' })}
                searchable
            />

            <Textarea
                label="Description"
                placeholder="Describe your character's personality, background, or any other details..."
                minRows={3}
                value={data.description}
                onChange={(e) => onUpdate({ description: e.currentTarget.value })}
                description="Optional: Add more context about your character"
            />

            <div>
                <Group gap="xs" mb="sm">
                    <Badge color="red" size="sm">
                        Required
                    </Badge>
                    <Text size="sm" c="dimmed">
                        Fill in all fields to continue to the next step
                    </Text>
                </Group>
            </div>
        </Stack>
    );
}
