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
    Box,
    Modal,
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

interface CharacterCreationWizardProps {
    opened: boolean;
    onClose: () => void;
}

export function CharacterCreationWizard({ opened, onClose }: CharacterCreationWizardProps) {
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
            const characterFormData: any = {
                name: formData.name,
                gender: formData.gender,
                age: formData.ageRange,
                ageRange: formData.ageRange,
                bodyType: formData.bodyType,
                description: formData.description || '',
                ethnicity: '',
                hair: '',
                images: [],
                baseImage: formData.baseImage,
                personality: formData.personality,
                style: formData.style,
                isDraft: false,
            };

            const characterId = await createCharacter(characterFormData);

            if (characterId) {
                // Clear draft
                localStorage.removeItem('character_creation_draft');

                notifications.show({
                    title: 'Character Created!',
                    message: 'Your new character has been created successfully',
                    color: 'green',
                    autoClose: 3000,
                });

                // Close modal and reset form
                onClose();
                setCurrentStep(0);
                setFormData({
                    name: '',
                    gender: 'FEMALE',
                    ageRange: '',
                    bodyType: '',
                    description: '',
                });
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
        <Modal
            opened={opened}
            onClose={onClose}
            size="xl"
            title="Create New Character"
            centered
            overlayProps={{
                backgroundOpacity: 0.55,
                blur: 3,
            }}
            styles={{
                body: {
                    padding: 0,
                },
                content: {
                    maxHeight: '90vh',
                },
            }}
        >
            <Box style={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
                <Stack gap="md" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box px="lg" pt="md">
                        <Text size="sm" c="dimmed" mb="sm">
                            Step {currentStep + 1} of {TOTAL_STEPS}
                            {isOptionalStep && <span> — Optional</span>}
                        </Text>
                        <Progress value={progressPercent} color="blue" />
                    </Box>

                    {/* Scrollable Content Area */}
                    <Box 
                        px="lg"
                        style={{
                            flex: 1,
                            overflow: 'auto',
                            minHeight: 0,
                        }}
                        sx={{
                            '&::-webkit-scrollbar': {
                                width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '10px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: 'rgba(255, 255, 255, 0.3)',
                            },
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                        }}
                    >
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
                    </Box>

                    {/* Sticky Navigation */}
                    <Box 
                        px="lg"
                        py="md"
                        style={{
                            borderTop: '1px solid var(--mantine-color-dark-4)',
                            backgroundColor: 'var(--mantine-color-dark-7)',
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 10,
                        }}
                    >
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
                    </Box>
                </Stack>
            </Box>
        </Modal>
    );
}
