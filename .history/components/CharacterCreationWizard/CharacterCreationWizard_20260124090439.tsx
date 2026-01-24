'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Stepper,
    Button,
    Group,
    Container,
    Card,
    Stack,
    Progress,
    Text,
    ThemeIcon,
    Center,
    Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCharacters } from '@/hooks/useUserCharacters';
import { StepBasics } from './steps/StepBasics';
import { StepFaceImage } from './steps/StepFaceImage';
import { StepPersonality } from './steps/StepPersonality';
import { StepStylePlatform } from './steps/StepStylePlatform';

export interface CharacterWizardData {
    // Step 1: Basics
    name: string;
    gender: 'FEMALE' | 'MALE' | 'OTHER';
    ageRange: string;
    bodyType: string;
    description: string;

    // Step 2: Face Image
    baseImage?: File;

    // Step 3: Personality & Vibe (optional)
    personality?: {
        confidence: number;
        seduction: number;
        dominance: number;
    };

    // Step 4: Style & Platform Intent (optional)
    style?: {
        platforms: ('INSTAGRAM' | 'TIKTOK' | 'ONLYFANS')[];
        clothingStyle: string;
        poses: string[];
    };
}

const TOTAL_STEPS = 4;
const OPTIONAL_STEPS = [2, 3]; // Steps 3 and 4 are optional (0-indexed)

export function CharacterCreationWizard() {
    const router = useRouter();
    const { createCharacter } = useCharacters();

    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CharacterWizardData>({
        name: '',
        gender: 'FEMALE',
        ageRange: '',
        bodyType: '',
        description: '',
    });

    const [completedSteps, setCompletedSteps] = useState<boolean[]>(
        new Array(TOTAL_STEPS).fill(false)
    );

    // Auto-save draft to localStorage
    useEffect(() => {
        const draftKey = 'character_creation_draft';
        const draft = {
            formData,
            currentStep,
            completedSteps,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
    }, [formData, currentStep, completedSteps]);

    // Load draft from localStorage on mount
    useEffect(() => {
        const draftKey = 'character_creation_draft';
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setFormData(draft.formData);
                setCurrentStep(draft.currentStep);
                setCompletedSteps(draft.completedSteps);
            } catch (e) {
                console.error('Failed to load draft:', e);
            }
        }
    }, []);

    const updateFormData = useCallback((updates: Partial<CharacterWizardData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    }, []);

    const validateStep = useCallback((step: number): boolean => {
        switch (step) {
            case 0: // Basics
                return !!(
                    formData.name.trim() &&
                    formData.gender &&
                    formData.ageRange &&
                    formData.bodyType
                );
            case 1: // Face Image
                return !!formData.baseImage;
            case 2: // Personality (optional)
            case 3: // Style (optional)
                return true; // Optional steps always valid
            default:
                return false;
        }
    }, [formData]);

    const handleNext = useCallback(() => {
        if (validateStep(currentStep)) {
            const newCompletedSteps = [...completedSteps];
            newCompletedSteps[currentStep] = true;
            setCompletedSteps(newCompletedSteps);

            // If next step is optional and user wants to skip, jump to next required or submit
            if (currentStep < TOTAL_STEPS - 1) {
                setCurrentStep(currentStep + 1);
            }
        } else {
            notifications.show({
                title: 'Missing Required Fields',
                message: 'Please fill in all required fields on this step',
                color: 'red',
                autoClose: 3000,
            });
        }
    }, [currentStep, validateStep, completedSteps]);

    const handleSkip = useCallback(() => {
        // Only allow skipping optional steps
        if (OPTIONAL_STEPS.includes(currentStep)) {
            if (currentStep < TOTAL_STEPS - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                handleSubmit();
            }
        }
    }, [currentStep]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    const handleSubmit = useCallback(async () => {
        if (!validateStep(currentStep)) {
            notifications.show({
                title: 'Missing Required Fields',
                message: 'Please fill in all required fields',
                color: 'red',
                autoClose: 3000,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const images = formData.baseImage ? [formData.baseImage] : [];

            const characterFormData = {
                name: formData.name,
                gender: formData.gender,
                age: formData.ageRange,
                bodyType: formData.bodyType,
                description: formData.description || '',
                ethnicity: '',
                hair: '',
                images,
            };

            // Pass additional wizard-specific data
            const wizardData = {
                personality: formData.personality,
                style: formData.style,
                baseImageId: formData.baseImage?.name, // Temporary identifier
            };

            const characterId = await createCharacter(characterFormData as any, wizardData as any);

            if (characterId) {
                // Clear draft
                localStorage.removeItem('character_creation_draft');

                notifications.show({
                    title: 'Character Created!',
                    message: 'Your new character has been created successfully',
                    color: 'green',
                    autoClose: 3000,
                });

                // Redirect to character view/edit page
                setTimeout(() => {
                    router.push(`/dashboard/character/view/${characterId}`);
                }, 1000);
            }
        } catch (error) {
            console.error('Error creating character:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to create character. Please try again.',
                color: 'red',
                autoClose: 3000,
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateStep, currentStep, createCharacter, router]);

    const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;
    const isLastStep = currentStep === TOTAL_STEPS - 1;
    const isOptionalStep = OPTIONAL_STEPS.includes(currentStep);

    return (
        <Container size="sm" py="xl">
            <Stack gap="xl">
                {/* Header */}
                <div>
                    <Text size="sm" c="dimmed" mb="sm">
                        Step {currentStep + 1} of {TOTAL_STEPS}
                        {isOptionalStep && <span> — Optional</span>}
                    </Text>
                    <Progress value={progressPercent} mb="md" color="blue" />
                </div>

                {/* Step Content */}
                <Card p="lg" withBorder>
                    {currentStep === 0 && (
                        <StepBasics
                            data={formData}
                            onUpdate={updateFormData}
                        />
                    )}
                    {currentStep === 1 && (
                        <StepFaceImage
                            data={formData}
                            onUpdate={updateFormData}
                        />
                    )}
                    {currentStep === 2 && (
                        <StepPersonality
                            data={formData}
                            onUpdate={updateFormData}
                        />
                    )}
                    {currentStep === 3 && (
                        <StepStylePlatform
                            data={formData}
                            onUpdate={updateFormData}
                        />
                    )}
                </Card>

                {/* Navigation */}
                <Group justify="space-between">
                    <Button
                        variant="default"
                        onClick={handlePrevious}
                        disabled={currentStep === 0 || isSubmitting}
                    >
                        Previous
                    </Button>

                    <Group gap="xs">
                        {isOptionalStep && (
                            <Button
                                variant="light"
                                onClick={handleSkip}
                                disabled={isSubmitting}
                            >
                                {isLastStep ? 'Finish' : 'Skip'}
                            </Button>
                        )}
                        <Button
                            onClick={isLastStep ? handleSubmit : handleNext}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        >
                            {isLastStep ? 'Create Character' : 'Next'}
                        </Button>
                    </Group>
                </Group>

                {/* Auto-save indicator */}
                <Center>
                    <Text size="xs" c="dimmed">
                        ✓ Draft auto-saved
                    </Text>
                </Center>
            </Stack>
        </Container>
    );
}
