"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Badge,
  Button,
  Group,
  Stack,
  Image,
  Modal,
  Divider,
  Box,
  SegmentedControl,
  Overlay,
  ActionIcon,
  TextInput,
  NumberInput,
  Select,
  MultiSelect,
  Textarea,
  rem,
  Loader,
  Center,
  FileButton,
  Paper,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUsers, IconX, IconEdit, IconTrash, IconPlus, IconUpload, IconLock, IconPhoto } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';

interface MarketplaceCharacter {
  id: string;
  name: string;
  age: number;
  tier: 'Classic' | 'Signature';
  tags: string[];
  image: string;
  galleryImages?: string[];
  licensesSold: number;
  maxLicenses: number;
  about: string;
  fullClaimPrice: number;
  licensePrice: number;
  fullyClaimed?: boolean;
  claimedBy?: string;
  claimedAt?: any;
}



const tagOptions = [
  'Blonde',
  'Brunette',
  'Redhead',
  'Slim',
  'Athletic',
  'Curvy',
  'Professional',
  'Elegant',
  'Sporty',
  'Natural',
  'Classic',
  'Modern',
  'Sophisticated',
  'Energetic',
  'Chic',
];

function AdminCharacterCard({ 
  character, 
  onView, 
  onEdit, 
  onDelete 
}: { 
  character: MarketplaceCharacter; 
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card 
      radius="md" 
      style={{ 
        position: 'relative',
        backgroundImage: `url(${character.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '400px',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      onClick={onView}
    >
      <Overlay opacity={0.55} zIndex={0} />
      
      {/* Admin Controls */}
      <Group 
        style={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          zIndex: 2 
        }}
        gap={4}
      >
        <ActionIcon 
          variant="filled" 
          color="blue" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <IconEdit size={14} />
        </ActionIcon>
        <ActionIcon 
          variant="filled" 
          color="red" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>

      {/* Fully Claimed Badge */}
      {character.fullyClaimed && (
        <Badge 
          style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}
          color="red"
          variant="filled"
          size="sm"
          leftSection={<IconLock size={12} />}
        >
          SOLD
        </Badge>
      )}

      {/* Tier Badge */}
      <Badge 
        style={{ position: 'absolute', top: character.fullyClaimed ? 40 : 10, left: 10, zIndex: 1 }}
        color={character.tier === 'Signature' ? 'violet' : 'blue'}
        variant="filled"
        size="sm"
      >
        {character.tier}
      </Badge>

      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: '1rem',
        zIndex: 1,
      }}>
        <div>
          <Text size="lg" fw={700} c="white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {character.name}, {character.age}
          </Text>
          
          <Group gap={4} mt={4}>
            {character.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} size="xs" variant="light" color="gray">
                {tag}
              </Badge>
            ))}
          </Group>
        </div>

        <div style={{ marginTop: '0.75rem' }}>
          <Group justify="space-between" align="center">
            <Group gap={6}>
              <IconUsers size={14} color="white" />
              <Text size="xs" c="white" fw={500}>
                {character.licensesSold}/{character.maxLicenses}
              </Text>
            </Group>
            <Text size="sm" c="white" fw={600}>
              {character.fullyClaimed ? 'SOLD OUT' : `${character.licensePrice} tokens`}
            </Text>
          </Group>
        </div>
      </div>
    </Card>
  );
}

export default function AdminMarketplacePage() {
  const [characters, setCharacters] = useState<MarketplaceCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortFilter, setSortFilter] = useState('All');
  const [selectedCharacter, setSelectedCharacter] = useState<MarketplaceCharacter | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<MarketplaceCharacter | null>(null);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const db = getFirestore(app);

  // Load characters from Firestore with real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    try {
      unsubscribe = onSnapshot(
        collection(db, 'marketplace-characters'),
        (snapshot) => {
          const characterData: MarketplaceCharacter[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data) {
              characterData.push({ id: doc.id, ...data } as MarketplaceCharacter);
            }
          });
          setCharacters(characterData);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching characters:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to load characters from database.',
            color: 'red',
          });
          setCharacters([]);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up listener:', error);
      setCharacters([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [db]);

  // Form state
  const [formData, setFormData] = useState<Partial<MarketplaceCharacter>>({
    name: '',
    age: 18,
    tier: 'Classic',
    tags: [],
    image: '',
    galleryImages: [],
    licensesSold: 0,
    maxLicenses: 5,
    about: '',
    fullClaimPrice: 2000,
    licensePrice: 300,
  });
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleView = (character: MarketplaceCharacter) => {
    setSelectedCharacter(character);
    openView();
  };

  const handleEdit = (character: MarketplaceCharacter) => {
    setEditingCharacter(character);
    setFormData(character);
    openEdit();
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      age: 18,
      tier: 'Classic',
      tags: [],
      image: '',
      licensesSold: 0,
      maxLicenses: 5,
      about: '',
      fullClaimPrice: 2000,
      licensePrice: 300,
    });
    openCreate();
  };

  const handleDelete = async (character: MarketplaceCharacter) => {
    if (confirm(`Are you sure you want to delete ${character.name}?`)) {
      try {
        await deleteDoc(doc(db, 'marketplace-characters', character.id));
        notifications.show({
          title: 'Character Deleted',
          message: `${character.name} has been removed from the marketplace.`,
          color: 'red',
        });
      } catch (error) {
        console.error('Error deleting character:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete character.',
          color: 'red',
        });
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCharacter || !formData.name) return;

    try {
      const characterRef = doc(db, 'marketplace-characters', editingCharacter.id);
      await updateDoc(characterRef, {
        name: formData.name,
        age: formData.age,
        tier: formData.tier,
        tags: formData.tags,
        image: formData.image,
        licensesSold: formData.licensesSold,
        maxLicenses: formData.maxLicenses,
        about: formData.about,
        fullClaimPrice: formData.fullClaimPrice,
        licensePrice: formData.licensePrice,
      });
      
      notifications.show({
        title: 'Character Updated',
        message: `${formData.name} has been successfully updated.`,
        color: 'green',
      });
      
      closeEdit();
      setEditingCharacter(null);
    } catch (error) {
      console.error('Error updating character:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update character.',
        color: 'red',
      });
    }
  };

  const handleCreateNew = async () => {
    if (!formData.name) {
      notifications.show({
        title: 'Error',
        message: 'Please fill in all required fields.',
        color: 'red',
      });
      return;
    }

    try {
      const newCharacter = {
        name: formData.name,
        age: formData.age || 18,
        tier: formData.tier || 'Classic',
        tags: formData.tags || [],
        image: formData.image || `https://placehold.co/400x600/8B5CF6/white?text=${formData.name}`,
        licensesSold: formData.licensesSold || 0,
        maxLicenses: formData.maxLicenses || 5,
        about: formData.about || '',
        fullClaimPrice: formData.fullClaimPrice || 2000,
        licensePrice: formData.licensePrice || 300,
        fullyClaimed: false,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'marketplace-characters'), newCharacter);
      
      notifications.show({
        title: 'Character Created',
        message: `${newCharacter.name} has been added to the marketplace.`,
        color: 'green',
      });
      
      closeCreate();
    } catch (error) {
      console.error('Error creating character:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create character.',
        color: 'red',
      });
    }
  };

  const CharacterForm = () => (
    <Stack gap="md">
      <TextInput
        label="Name"
        placeholder="Character name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <NumberInput
        label="Age"
        placeholder="Age"
        value={formData.age}
        onChange={(value) => setFormData({ ...formData, age: value as number })}
        min={18}
        max={99}
        required
      />

      <Select
        label="Tier"
        placeholder="Select tier"
        value={formData.tier}
        onChange={(value) => setFormData({ ...formData, tier: value as 'Classic' | 'Signature' })}
        data={['Classic', 'Signature']}
        required
      />

      <MultiSelect
        label="Tags"
        placeholder="Select tags"
        value={formData.tags}
        onChange={(value) => setFormData({ ...formData, tags: value })}
        data={tagOptions}
        searchable
        required
      />

      <TextInput
        label="Image URL"
        placeholder="https://..."
        value={formData.image}
        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
      />

      <Textarea
        label="About"
        placeholder="Description of the character..."
        value={formData.about}
        onChange={(e) => setFormData({ ...formData, about: e.target.value })}
        minRows={3}
        required
      />

      <Group grow>
        <NumberInput
          label="Max Licenses"
          placeholder="5"
          value={formData.maxLicenses}
          onChange={(value) => setFormData({ ...formData, maxLicenses: value as number })}
          min={1}
          max={100}
        />

        <NumberInput
          label="Licenses Sold"
          placeholder="0"
          value={formData.licensesSold}
          onChange={(value) => setFormData({ ...formData, licensesSold: value as number })}
          min={0}
        />
      </Group>

      <Group grow>
        <NumberInput
          label="License Price (tokens)"
          placeholder="300"
          value={formData.licensePrice}
          onChange={(value) => setFormData({ ...formData, licensePrice: value as number })}
          min={0}
        />

        <NumberInput
          label="Full Claim Price (tokens)"
          placeholder="2000"
          value={formData.fullClaimPrice}
          onChange={(value) => setFormData({ ...formData, fullClaimPrice: value as number })}
          min={0}
        />
      </Group>
    </Stack>
  );

  const filteredCharacters = characters;

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="violet" />
          <Text size="lg" c="dimmed">Loading marketplace...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box style={{ padding: '0.75rem', height: '100%' }}>
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2} c="white" mb="xs">
              Marketplace Management
            </Title>
            <Text c="dimmed">
              Manage character cards in the marketplace. Create, edit, or delete characters.
            </Text>
          </div>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={handleCreate}
            color="violet"
            size="md"
          >
            Create Character
          </Button>
        </Group>

        {/* Stats */}
        <Group gap="md">
          <Card padding="md" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
            <Text size="sm" c="dimmed">Total Characters</Text>
            <Text size="xl" fw={700} c="white">{characters.length}</Text>
          </Card>
          <Card padding="md" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
            <Text size="sm" c="dimmed">Signature Tier</Text>
            <Text size="xl" fw={700} c="violet">{characters.filter(c => c.tier === 'Signature').length}</Text>
          </Card>
          <Card padding="md" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
            <Text size="sm" c="dimmed">Classic Tier</Text>
            <Text size="xl" fw={700} c="blue">{characters.filter(c => c.tier === 'Classic').length}</Text>
          </Card>
          <Card padding="md" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
            <Text size="sm" c="dimmed">Exclusively Sold</Text>
            <Text size="xl" fw={700} c="red">{characters.filter(c => c.fullyClaimed).length}</Text>
          </Card>
        </Group>

        {/* Sorting Options */}
        <SegmentedControl
          value={sortFilter}
          onChange={setSortFilter}
          data={[
            'All',
            'Blonde',
            'Brunette',
            'Slim',
            'Athletic',
            'Classic',
            'Signature'
          ]}
          color="violet"
        />

        {/* Character Grid */}
        <SimpleGrid
          cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 4 }}
          spacing="lg"
        >
          {filteredCharacters.map((character) => (
            <AdminCharacterCard
              key={character.id}
              character={character}
              onView={() => handleView(character)}
              onEdit={() => handleEdit(character)}
              onDelete={() => handleDelete(character)}
            />
          ))}
        </SimpleGrid>
      </Stack>

      {/* View Character Modal */}
      <Modal
        opened={viewOpened}
        onClose={closeView}
        size="xl"
        padding={0}
        withCloseButton={false}
        centered
      >
        {selectedCharacter && (
          <div>
            <ActionIcon
              style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}
              onClick={closeView}
              variant="subtle"
              color="gray"
            >
              <IconX size={20} />
            </ActionIcon>

            <Group align="flex-start" gap={0} wrap="nowrap">
              <Box style={{ width: '50%', height: '600px' }}>
                <Image
                  src={selectedCharacter.image}
                  alt={selectedCharacter.name}
                  fit="cover"
                  h="100%"
                />
              </Box>

              <Box style={{ width: '50%', padding: '2rem' }}>
                <Stack gap="md">
                  <div>
                    <Group justify="space-between" align="flex-start" mb="xs">
                      <Title order={2}>{selectedCharacter.name}</Title>
                      <Badge 
                        color={selectedCharacter.tier === 'Signature' ? 'violet' : 'blue'}
                        variant="filled"
                        size="lg"
                      >
                        {selectedCharacter.tier}
                      </Badge>
                    </Group>
                    
                    <Group gap="xs" mb="sm">
                      {selectedCharacter.fullyClaimed ? (
                        <Badge color="red" variant="filled" size="md" leftSection={<IconLock size={14} />}>
                          Exclusively Sold
                        </Badge>
                      ) : (
                        <Badge color="green" variant="light" size="md">
                          Live
                        </Badge>
                      )}
                      <Group gap={6}>
                        <IconUsers size={16} />
                        <Text size="sm" fw={500}>
                          {selectedCharacter.licensesSold}/{selectedCharacter.maxLicenses} licenses sold
                        </Text>
                      </Group>
                    </Group>

                    <Group gap={6}>
                      {selectedCharacter.tags.map((tag, index) => (
                        <Badge key={index} variant="light" size="md">
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  </div>

                  <Divider />

                  <div>
                    <Text size="sm" fw={600} mb="xs">
                      About
                    </Text>
                    <Text size="sm" c="dimmed">
                      {selectedCharacter.about}
                    </Text>
                  </div>

                  <Divider />

                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>License Price</Text>
                      <Text size="lg" fw={700} c="blue">{selectedCharacter.licensePrice} tokens</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>Full Claim Price</Text>
                      <Text size="lg" fw={700} c="violet">{selectedCharacter.fullClaimPrice} tokens</Text>
                    </Group>
                  </Stack>

                  <Group grow mt="md">
                    <Button 
                      variant="light" 
                      color="blue"
                      onClick={() => {
                        closeView();
                        handleEdit(selectedCharacter);
                      }}
                    >
                      Edit Character
                    </Button>
                    <Button 
                      variant="light" 
                      color="red"
                      onClick={() => {
                        closeView();
                        handleDelete(selectedCharacter);
                      }}
                    >
                      Delete
                    </Button>
                  </Group>
                </Stack>
              </Box>
            </Group>
          </div>
        )}
      </Modal>

      {/* Edit Character Modal */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        size="lg"
        title={<Text fw={600} size="lg">Edit Character</Text>}
        centered
      >
        <CharacterForm />
        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" onClick={closeEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} color="blue">Save Changes</Button>
        </Group>
      </Modal>

      {/* Create Character Modal */}
      <Modal
        opened={createOpened}
        onClose={closeCreate}
        size="lg"
        title={<Text fw={600} size="lg">Create New Character</Text>}
        centered
      >
        <CharacterForm />
        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" onClick={closeCreate}>Cancel</Button>
          <Button onClick={handleCreateNew} color="violet">Create Character</Button>
        </Group>
      </Modal>
    </Box>
  );
}
