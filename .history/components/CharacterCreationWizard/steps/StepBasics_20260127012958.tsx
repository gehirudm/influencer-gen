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
    NumberInput,
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

                <NumberInput
                    label="Age"
                    placeholder="Enter age"
                    required
                    min={18}
                    max={99}
                    value={data.age}
                    onChange={(value) => onUpdate({ age: value })}
                    description="Must be 18 or older"
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
        </Stack>
    );
}
