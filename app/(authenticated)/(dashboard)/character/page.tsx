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
} from '@mantine/core';
import { IconTrash, IconPhoto, IconPhotoSpark } from '@tabler/icons-react';
import { FileDropzonePreview } from '@/components/FileDropzonePreview';
import classes from './CharacterCreationPage.module.css';

interface Character {
    id: number;
    name: string;
    image: string;
    isActive: boolean;
}

interface FormData {
    name: string;
    gender: 'FEMALE' | 'MALE' | 'OTHER';
    age: string;
    hair: string[];
    bodyType: string[];
    ethnicity: string[];
    description: string;
}

type AttributeCategory = 'hair' | 'bodyType' | 'ethnicity';

export default function CharacterCreationPage() {
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        gender: 'FEMALE',
        age: '24',
        hair: ['Blonde'],
        bodyType: ['Perfect'],
        ethnicity: ['Caucasian'],
        description: 'A 24 year old Caucasian, girl, Blonde hair, perfect body'
    });

    const [characters, setCharacters] = useState<Character[]>([
        {
            id: 1,
            name: 'Laura',
            image: '/character/dj.png',
            isActive: true
        },
        {
            id: 2,
            name: 'Laura',
            image: '/character/dj.png',
            isActive: true
        },
        {
            id: 3,
            name: 'Laura',
            image: '/character/dj.png',
            isActive: true
        }
    ]);

    const handleChipToggle = (category: AttributeCategory, value: string): void => {
        setFormData(prev => ({
            ...prev,
            [category]: prev[category].includes(value)
                ? prev[category].filter(item => item !== value)
                : [...prev[category], value]
        }));
    };

    const hairOptions = ['Blonde', 'Brunette', 'White', 'Red', 'Black', 'Curly', 'Wavy', 'Straight'];
    const bodyTypeOptions = ['Busty', 'Fit', 'Athletic', 'Muscular', 'Thick', 'Chubby', 'Perfect'];
    const ethnicityOptions = ['Caucasian', 'Asian', 'Latin', 'Black', 'Arabic', 'Indian'];

    const renderChipGroup = (options: string[], category: AttributeCategory, selectedValues: string[]) => (
        <Group gap="xs" style={{ flexWrap: 'wrap' }}>
            {options.map((option) => (
                <Chip
                    key={option}
                    checked={selectedValues.includes(option)}
                    onChange={() => handleChipToggle(category, option)}
                    variant={selectedValues.includes(option) ? 'filled' : 'outline'}
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
                                <Text size="sm" mb="xs" color="white">Hair</Text>
                                {renderChipGroup(hairOptions, 'hair', formData.hair)}
                            </Box>

                            {/* Body Type */}
                            <Box>
                                <Text size="sm" mb="xs" color="white">Body Type</Text>
                                {renderChipGroup(bodyTypeOptions, 'bodyType', formData.bodyType)}
                            </Box>

                            {/* Ethnicity */}
                            <Box>
                                <Text size="sm" mb="xs" color="white">Ethnicity</Text>
                                {renderChipGroup(ethnicityOptions, 'ethnicity', formData.ethnicity)}
                            </Box>

                            {/* Description */}
                            <Box>
                                <Text size="sm" mb="xs" color="white">
                                    Write your own...
                                    <Text component="span" size="xs" color="#888" ml="md">
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
                                >
                                    Save Character
                                </Button>
                                <Button
                                    variant="outline"
                                    color="gray"
                                    size="md"
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
                                {characters.map((character) => (
                                    <Card
                                        key={character.id}
                                        padding={0}
                                        radius="md"
                                        w={{  base: 200, md: 250 }}
                                        className={classes.characterCard}
                                    >
                                        <Box style={{ position: 'relative' }}>
                                            <Image
                                                src={character.image}
                                                alt={character.name}
                                                style={{
                                                    width: '100%',
                                                    height: "auto",
                                                    objectFit: 'cover',
                                                    objectPosition: 'center'
                                                }}
                                                className={classes.characterImage}
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
                                                rightSection={<IconPhotoSpark size={20}/>}
                                                p={10}
                                                style={{
                                                    fontWeight: 700
                                                }}
                                            >
                                                USE
                                            </Button>

                                            <ActionIcon
                                                color="gray"
                                                variant="transparent"
                                                size="xl"
                                            >
                                                <IconTrash size={24} />
                                            </ActionIcon>
                                        </Group>
                                    </Card>
                                ))}
                            </Group>
                        </Card>
                    </Card>
                </Grid.Col>
            </Grid>
        </Container>
    );
}