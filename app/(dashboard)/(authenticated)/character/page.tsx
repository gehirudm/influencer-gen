"use client"

import { useState } from 'react';
import {
    Container,
    Grid,
    Card,
    Text,
    TextInput,
    Select,
    Button,
    Group,
    Stack,
    Image,
    Textarea,
    ActionIcon,
    Box,
    Title,
    Badge,
    Chip,
    Avatar,
    SimpleGrid,
    Modal,
} from '@mantine/core';
import { IconTrash, IconPhoto, IconPhotoSpark, IconWoman } from '@tabler/icons-react';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';
import classes from './CharacterCreationPage.module.css';
import { useCharacters } from '@/hooks/useUserCharacters';
import { notifications } from '@mantine/notifications';

interface FormData {
    name: string;
    gender: 'FEMALE' | 'MALE' | 'OTHER';
    age: string;
    hair: string;
    bodyType: string;
    ethnicity: string;
    description: string;
}

type AttributeCategory = 'hair' | 'bodyType' | 'ethnicity';

interface CharacterCardProps {
    character: {
        id: string;
        name: string;
        imageUrls: string[];
    };
    onDelete: (id: string) => void;
    onUse: (id: string) => void;
}

function CharacterCard({ character, onDelete, onUse }: CharacterCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        setDeleteModalOpen(false);
        onDelete(character.id);
    };

    return (
        <Card
            key={character.id}
            padding={0}
            radius="md"
            w={{ base: 200, md: 250 }}
            className={classes.characterCard}
        >
            <Box style={{ position: 'relative' }}>
                <Image
                    src={character.imageUrls[0]}
                    alt={character.name}
                    style={{
                        width: '100%',
                        height: "auto",
                        objectFit: 'cover',
                        objectPosition: 'center'
                    }}
                    className={classes.characterImage}
                    fallbackSrc="/placeholder-character.png"
                />
            </Box>

            <Text size="xl" fw={700} c="white">
                {character.name}
            </Text>

            <Group
                justify="space-between"
            >
                <Button
                    variant="filled"
                    radius="sm"
                    size="sm"
                    rightSection={<IconPhotoSpark size={20} />}
                    p={10}
                    style={{
                        fontWeight: 700
                    }}
                    onClick={() => onUse(character.id)}
                    disabled={isDeleting}
                >
                    USE
                </Button>

                <ActionIcon
                    color="gray"
                    variant="transparent"
                    size="xl"
                    onClick={() => setDeleteModalOpen(true)}
                    loading={isDeleting}
                >
                    <IconTrash size={24} />
                </ActionIcon>
            </Group>

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Character"
                centered
                size="sm"
            >
                <Text size="sm" mb="lg">
                    Are you sure you want to delete "{character.name}"? This action cannot be undone.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={handleDelete}
                        loading={isDeleting}
                    >
                        Delete
                    </Button>
                </Group>
            </Modal>
        </Card>
    );
}

export default function CharacterCreationPage() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        gender: 'FEMALE',
        age: '24',
        hair: 'Blonde',
        bodyType: 'Perfect',
        ethnicity: 'Caucasian',
        description: 'A 24 year old Caucasian, girl, Blonde hair, perfect body'
    });

    const {
        characters,
        loading,
        error,
        createCharacter,
        deleteCharacter
    } = useCharacters();

    const handleChipSelect = (category: AttributeCategory, value: string): void => {
        setFormData(prev => ({
            ...prev,
            [category]: value
        }));

        // Update description when attributes change
        updateDescription({
            ...formData,
            [category]: value
        });
    };

    // Function to update description based on selected attributes
    const updateDescription = (data: FormData) => {
        const newDescription = `A ${data.age} year old ${data.ethnicity}, ${data.gender.toLowerCase()}, ${data.hair} hair, ${data.bodyType} body`;

        setFormData(prev => ({
            ...prev,
            description: newDescription
        }));
    };

    const handleCreateCharacter = async () => {
        // Validate form data
        if (!formData.name.trim()) {
            notifications.show({
                title: 'Error',
                message: 'Please enter a character name',
                color: 'red',
            });
            return;
        }

        if (!selectedImageFile) {
            notifications.show({
                title: 'Error',
                message: 'Please upload a character image',
                color: 'red',
            });
            return;
        }

        // Prepare character data for creation
        const characterData = {
            ...formData,
            images: selectedImageFile ? [selectedImageFile] : []
        };

        // Create character using the hook
        const characterId = await createCharacter(characterData);

        if (characterId) {
            // Reset form after successful creation
            setFormData({
                name: '',
                gender: 'FEMALE',
                age: '24',
                hair: 'Blonde',
                bodyType: 'Perfect',
                ethnicity: 'Caucasian',
                description: 'A 24 year old Caucasian, girl, Blonde hair, perfect body'
            });
            setSelectedImage(null);
            setSelectedImageFile(null);

            // Show success message
            notifications.show({
                title: 'Success',
                message: 'Character created successfully!',
                color: 'green',
            });
        } else {
            console.error('Error creating character:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to create character. Please try again.',
                color: 'red',
            });
        }
    }

    const handleDeleteCharacter = async (characterId: string) => {
        try {
            const success = await deleteCharacter(characterId);

            if (success) {
                notifications.show({
                    title: 'Success',
                    message: 'Character deleted successfully!',
                    color: 'green',
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to delete character. Please try again.',
                    color: 'red',
                });
            }
        } catch (error) {
            console.error('Error deleting character:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to delete character. Please try again.',
                color: 'red',
            });
        }
    }

    const handleUseCharacter = (characterId: string) => {
        // Redirect to create page with character ID
        window.location.href = `/create?ucid=${characterId}`;
    }

    const handleReset = () => {
        // Reset form to default values
        setFormData({
            name: '',
            gender: 'FEMALE',
            age: '24',
            hair: 'Blonde',
            bodyType: 'Perfect',
            ethnicity: 'Caucasian',
            description: 'A 24 year old Caucasian, girl, Blonde hair, perfect body'
        });
        setSelectedImage(null);
        setSelectedImageFile(null);
    }


    const hairOptions = ['Blonde', 'Brunette', 'White', 'Red', 'Black', 'Curly', 'Wavy', 'Straight'];
    const bodyTypeOptions = ['Busty', 'Fit', 'Athletic', 'Muscular', 'Thick', 'Chubby', 'Perfect'];
    const ethnicityOptions = ['Caucasian', 'Asian', 'Latin', 'Black', 'Arabic', 'Indian'];

    const renderChipGroup = (options: string[], category: AttributeCategory, selectedValue: string) => (
        <Group gap="xs" style={{ flexWrap: 'wrap' }}>
            {options.map((option) => (
                <Chip
                    key={option}
                    checked={selectedValue === option}
                    onChange={() => handleChipSelect(category, option)}
                    variant={selectedValue === option ? 'filled' : 'outline'}
                    size="sm"
                >
                    {option}
                </Chip>
            ))}
        </Group>
    );

    return (
        <Container size="xl" py={{ base: 'md', md: 'xl' }}>
            <Title ta="center" size={60} mb={{ base: 'md', md: 'xl' }} c="white">
                Character
            </Title>

            <Grid gutter={{ base: 'md', md: 'xl' }}>
                {/* Design Character Section */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card p={{ base: 'md', md: 'lg' }} withBorder={false}>
                        <Title size="30" mb={{ base: 'md', md: 'lg' }} c="white">
                            Design Character
                        </Title>

                        <Stack gap="md">
                            {/* Face Photo */}
                            <Box>
                                <Text size="lg" mb="xs" c="white" fw={400}>Face Photo</Text>
                                <FileDropzonePreview
                                    selectedImage={selectedImage}
                                    setSelectedImage={setSelectedImage}
                                    setSelectedImageFile={setSelectedImageFile}
                                    label="Drag and drop an image here or click to select a file"
                                    bg="#3a3a3a"
                                />
                            </Box>


                            {/* Name */}
                            <Box>
                                <Text size="sm" mb="xs" c="white">What is the name?</Text>
                                <TextInput
                                    placeholder="Name here"
                                    value={formData.name}
                                    radius="xl"
                                    size='md'
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    styles={{
                                        input: { backgroundColor: '#3a3a3a', border: '1px solid #555', color: 'white' }
                                    }}
                                />
                            </Box>

                            {/* Gender & Age */}
                            <Box>
                                <Text size="sm" mb="xs" c="white">Gender & Age</Text>
                                <Group grow>
                                    <Select
                                        value={formData.gender}
                                        onChange={(value: string | null) => setFormData(prev => ({ ...prev, gender: (value as FormData['gender']) || 'FEMALE' }))}
                                        data={[
                                            { value: 'FEMALE', label: 'FEMALE' },
                                            { value: 'MALE', label: 'MALE' },
                                            { value: 'OTHER', label: 'OTHER' }
                                        ]}
                                        styles={{
                                            input: { backgroundColor: '#3a3a3a', border: '1px solid #555', color: 'white' }
                                        }}
                                        radius="xl"
                                        size='md'
                                    />
                                    <TextInput
                                        value={formData.age}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                                        styles={{
                                            input: { backgroundColor: '#3a3a3a', border: '1px solid #555', color: 'white' }
                                        }}
                                        radius="xl"
                                        size='md'
                                    />
                                </Group>
                            </Box>

                            {/* Hair */}
                            <Box>
                                <Text size="sm" mb="xs" c="white">Hair</Text>
                                {renderChipGroup(hairOptions, 'hair', formData.hair)}
                            </Box>

                            {/* Body Type */}
                            <Box>
                                <Text size="sm" mb="xs" c="white">Body Type</Text>
                                {renderChipGroup(bodyTypeOptions, 'bodyType', formData.bodyType)}
                            </Box>

                            {/* Ethnicity */}
                            <Box>
                                <Text size="sm" mb="xs" c="white">Ethnicity</Text>
                                {renderChipGroup(ethnicityOptions, 'ethnicity', formData.ethnicity)}
                            </Box>

                            {/* Description */}
                            <Box>
                                <Text size="sm" mb="xs" c="white">
                                    Write your own...
                                    <Text component="span" size="xs" c="#888" ml="md">
                                        Appearance Description (you can edit)
                                    </Text>
                                </Text>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    minRows={4}
                                    styles={{
                                        input: { backgroundColor: '#3a3a3a', border: '1px solid #555', color: 'white' }
                                    }}
                                    radius="xl"
                                    size='sm'
                                />
                            </Box>

                            {/* Action Buttons */}
                            <Group justify="space-between" mt="lg">
                                <Button
                                    variant="filled"
                                    size='md'
                                    fullWidth={false}
                                    onClick={handleCreateCharacter}
                                >
                                    Save Character
                                </Button>
                                <Button
                                    variant="outline"
                                    color="gray"
                                    size="md"
                                    onClick={handleReset}
                                >
                                    Reset
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                </Grid.Col>

                {/* Your Characters Section */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Card p={{ base: 'md', md: 'lg' }} withBorder={false}>
                        <Title size={30} mb={{ base: 'md', md: 'lg' }} c="white">
                            Your Characters
                        </Title>

                        <Card p={{ base: 'md', md: 'lg' }} style={{ backgroundColor: '#2a2a2a', border: 'none' }}>
                            <Group gap="md" justify='center'>
                                {characters.length === 0 && !loading && (
                                    <Stack align="center" py="xl" gap="sm">
                                        <IconWoman size={48} color="gray" />
                                        <Text ta="center" c="dimmed" size="lg">You don't have any characters yet</Text>
                                        <Text ta="center" c="dimmed" size="sm">
                                            Create your first character using the form on the left
                                        </Text>
                                    </Stack>
                                )}
                                {loading && (
                                    <Text ta="center" c="dimmed" py="xl">Loading your characters...</Text>
                                )}
                                {characters.map((character) => (
                                    <CharacterCard
                                        key={character.id}
                                        character={character}
                                        onDelete={handleDeleteCharacter}
                                        onUse={handleUseCharacter}
                                    />
                                ))}
                            </Group>
                        </Card>
                    </Card>
                </Grid.Col>
            </Grid>
        </Container>
    );
}