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
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconUsers, IconX, IconEdit, IconTrash, IconPlus, IconUpload, IconLock, IconPhoto, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
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
  loraUrl?: string;
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
      p="md" 
      style={{ backgroundColor: '#3a3a3a', border: '1px solid #555', cursor: 'pointer' }}
      onClick={onView}
    >
      <Stack gap="sm">
        <Box
          style={{
            width: '100%',
            aspectRatio: '3/4',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <img 
            src={character.image} 
            alt={character.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {/* Admin Controls */}
          <Group 
            style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              zIndex: 3
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

          <Group 
            gap="xs" 
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              justifyContent: 'flex-start',
              flexWrap: 'nowrap'
            }}
          >
            {character.fullyClaimed && (
              <Badge variant="filled" color="red" size="sm" leftSection={<IconLock size={12} />}>
                SOLD
              </Badge>
            )}
            <Badge variant="filled" color={character.tier === 'Signature' ? 'violet' : 'blue'} size="sm">
              {character.tier}
            </Badge>
          </Group>

          <Box
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              right: '8px'
            }}
          >
            <Group gap={6} justify="space-between">
              <Group gap={4}>
                <IconUsers size={14} color="white" />
                <Text size="xs" c="white" fw={500}>
                  {character.licensesSold}/{character.maxLicenses}
                </Text>
              </Group>
              <Text size="xs" c="white" fw={600}>
                {character.fullyClaimed ? 'SOLD' : `${character.licensePrice}`}
              </Text>
            </Group>
          </Box>
        </Box>
        <div>
          <Text size="md" c="white" ta="center">
            <Text component="span" fw={600}>{character.name}</Text>
            <Text component="span" fw={400}> ({character.age})</Text>
          </Text>
          <Group gap={4} mt={4} justify="center">
            {character.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} size="xs" variant="light" color="gray">
                {tag}
              </Badge>
            ))}
          </Group>
        </div>
      </Stack>
    </Card>
  );
}

export default function AdminMarketplacePage() {
  const [characters, setCharacters] = useState<MarketplaceCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortFilter, setSortFilter] = useState('All');
  const [selectedCharacter, setSelectedCharacter] = useState<MarketplaceCharacter | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<MarketplaceCharacter | null>(null);
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
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
    loraUrl: '',
  });
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleView = (character: MarketplaceCharacter) => {
    setSelectedCharacter(character);
    setGalleryExpanded(false);
    openView();
  };

  const handleEdit = (character: MarketplaceCharacter) => {
    setEditingCharacter(character);
    setFormData(character);
    setCoverImageFile(null);
    setGalleryImageFiles([]);
    openEdit();
  };

  const handleCreate = () => {
    setFormData({
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
      loraUrl: '',
    });
    setCoverImageFile(null);
    setGalleryImageFiles([]);
    openCreate();
  };

  const handleDelete = async (character: MarketplaceCharacter) => {
    if (confirm(`Are you sure you want to delete ${character.name}? This will also remove it from all users who purchased it.`)) {
      try {
        // First, find all purchases of this character
        const purchasesRef = collection(db, 'marketplace-purchases');
        const purchasesQuery = query(purchasesRef);
        const purchasesSnapshot = await getDocs(purchasesQuery);
        
        const deletePromises: Promise<void>[] = [];
        
        // Delete purchase logs and user character references
        purchasesSnapshot.forEach((purchaseDoc) => {
          const purchase = purchaseDoc.data();
          if (purchase.characterId === character.id) {
            // Delete the purchase log
            deletePromises.push(deleteDoc(doc(db, 'marketplace-purchases', purchaseDoc.id)));
            
            // Delete from user's characters subcollection
            const userCharactersRef = collection(db, 'users', purchase.userId, 'characters');
            getDocs(query(userCharactersRef)).then((userCharsSnapshot) => {
              userCharsSnapshot.forEach((userCharDoc) => {
                if (userCharDoc.data().characterId === character.id) {
                  deletePromises.push(deleteDoc(doc(db, 'users', purchase.userId, 'characters', userCharDoc.id)));
                }
              });
            });
          }
        });
        
        // Wait for all deletions
        await Promise.all(deletePromises);
        
        // Finally, delete the character itself
        await deleteDoc(doc(db, 'marketplace-characters', character.id));
        
        notifications.show({
          title: 'Character Deleted',
          message: `${character.name} has been removed from the marketplace and all user collections.`,
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

  const uploadImageToStorage = async (file: File, path: string): Promise<string> => {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const handleSaveEdit = async () => {
    if (!editingCharacter || !formData.name) return;

    setUploading(true);
    try {
      let coverImageUrl = formData.image;
      let galleryImageUrls = formData.galleryImages || [];

      // Upload cover image if a new one is selected
      if (coverImageFile) {
        const timestamp = Date.now();
        coverImageUrl = await uploadImageToStorage(
          coverImageFile,
          `marketplace-characters/${editingCharacter.id}/cover-${timestamp}.jpg`
        );
      }

      // Upload gallery images if any new ones are selected
      if (galleryImageFiles.length > 0) {
        const timestamp = Date.now();
        const uploadPromises = galleryImageFiles.map((file, index) =>
          uploadImageToStorage(
            file,
            `marketplace-characters/${editingCharacter.id}/gallery-${timestamp}-${index}.jpg`
          )
        );
        const newGalleryUrls = await Promise.all(uploadPromises);
        galleryImageUrls = [...galleryImageUrls, ...newGalleryUrls];
      }

      const characterRef = doc(db, 'marketplace-characters', editingCharacter.id);
      await updateDoc(characterRef, {
        name: formData.name,
        age: formData.age,
        tier: formData.tier,
        tags: formData.tags,
        image: coverImageUrl,
        galleryImages: galleryImageUrls,
        licensesSold: formData.licensesSold,
        maxLicenses: formData.maxLicenses,
        about: formData.about,
        fullClaimPrice: formData.fullClaimPrice,
        licensePrice: formData.licensePrice,
        loraUrl: formData.loraUrl || '',
      });
      
      notifications.show({
        title: 'Character Updated',
        message: `${formData.name} has been successfully updated.`,
        color: 'green',
      });
      
      closeEdit();
      setEditingCharacter(null);
      setCoverImageFile(null);
      setGalleryImageFiles([]);
    } catch (error) {
      console.error('Error updating character:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update character.',
        color: 'red',
      });
    } finally {
      setUploading(false);
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

    setUploading(true);
    try {
      // Create a temporary ID for the character
      const tempId = `temp-${Date.now()}`;
      
      let coverImageUrl = formData.image || `https://placehold.co/400x600/8B5CF6/white?text=${formData.name}`;
      let galleryImageUrls: string[] = [];

      // Upload cover image if provided
      if (coverImageFile) {
        coverImageUrl = await uploadImageToStorage(
          coverImageFile,
          `marketplace-characters/${tempId}/cover-${Date.now()}.jpg`
        );
      }

      // Upload gallery images if provided
      if (galleryImageFiles.length > 0) {
        const timestamp = Date.now();
        const uploadPromises = galleryImageFiles.map((file, index) =>
          uploadImageToStorage(
            file,
            `marketplace-characters/${tempId}/gallery-${timestamp}-${index}.jpg`
          )
        );
        galleryImageUrls = await Promise.all(uploadPromises);
      }

      const newCharacter = {
        name: formData.name,
        age: formData.age || 18,
        tier: formData.tier || 'Classic',
        tags: formData.tags || [],
        image: coverImageUrl,
        galleryImages: galleryImageUrls,
        licensesSold: formData.licensesSold || 0,
        maxLicenses: formData.maxLicenses || 5,
        about: formData.about || '',
        fullClaimPrice: formData.fullClaimPrice || 2000,
        licensePrice: formData.licensePrice || 300,
        loraUrl: formData.loraUrl || '',
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
      setCoverImageFile(null);
      setGalleryImageFiles([]);
    } catch (error) {
      console.error('Error creating character:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create character.',
        color: 'red',
      });
    } finally {
      setUploading(false);
    }
  };

  const CharacterForm = useMemo(() => (
    <Stack gap="md">
      <TextInput
        label="Name"
        placeholder="Character name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        required
      />

      <NumberInput
        label="Age"
        placeholder="Age"
        value={formData.age}
        onChange={(value) => setFormData(prev => ({ ...prev, age: value as number }))}
        min={18}
        max={99}
        required
      />

      <Select
        label="Tier"
        placeholder="Select tier"
        value={formData.tier}
        onChange={(value) => setFormData(prev => ({ ...prev, tier: value as 'Classic' | 'Signature' }))}
        data={['Classic', 'Signature']}
        required
      />

      <MultiSelect
        label="Tags"
        placeholder="Select tags"
        value={formData.tags}
        onChange={(value) => setFormData(prev => ({ ...prev, tags: value }))}
        data={tagOptions}
        searchable
        required
      />

      <Divider label="Images" labelPosition="center" />

      <Stack gap="sm">
        <Text size="sm" fw={500}>Cover Image (Main)</Text>
        <FileButton onChange={setCoverImageFile} accept="image/png,image/jpeg,image/jpg">
          {(props) => (
            <Button {...props} leftSection={<IconPhoto size={16} />} variant="light">
              {coverImageFile ? `Selected: ${coverImageFile.name}` : 'Upload Cover Image'}
            </Button>
          )}
        </FileButton>
        {formData.image && !coverImageFile && (
          <Paper p="xs" withBorder>
            <Image src={formData.image} alt="Current cover" height={100} fit="contain" />
          </Paper>
        )}
        {coverImageFile && (
          <Paper p="xs" withBorder>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{coverImageFile.name}</Text>
              <ActionIcon onClick={() => setCoverImageFile(null)} color="red" variant="subtle">
                <IconX size={16} />
              </ActionIcon>
            </Group>
          </Paper>
        )}
      </Stack>

      <Stack gap="sm">
        <Text size="sm" fw={500}>Gallery Images (Optional)</Text>
        <FileButton onChange={setGalleryImageFiles} accept="image/png,image/jpeg,image/jpg" multiple>
          {(props) => (
            <Button {...props} leftSection={<IconPhoto size={16} />} variant="light">
              {galleryImageFiles.length > 0 ? `${galleryImageFiles.length} images selected` : 'Upload Gallery Images'}
            </Button>
          )}
        </FileButton>
        {galleryImageFiles.length > 0 && (
          <Stack gap="xs">
            {galleryImageFiles.map((file, index) => (
              <Paper key={index} p="xs" withBorder>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{file.name}</Text>
                  <ActionIcon 
                    onClick={() => setGalleryImageFiles(prev => prev.filter((_, i) => i !== index))} 
                    color="red" 
                    variant="subtle"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
        {formData.galleryImages && formData.galleryImages.length > 0 && (
          <Paper p="xs" withBorder>
            <Text size="xs" c="dimmed">{formData.galleryImages.length} existing gallery images</Text>
          </Paper>
        )}
      </Stack>

      <TextInput
        label="LoRA URL"
        placeholder="https://huggingface.co/.../model.safetensors?download=true"
        description="Direct download URL to a .safetensors LoRA file for this character (optional)"
        value={formData.loraUrl}
        onChange={(e) => setFormData(prev => ({ ...prev, loraUrl: e.target.value }))}
      />

      <Textarea
        label="About"
        placeholder="Description of the character..."
        value={formData.about}
        onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
        minRows={3}
        required
      />

      <Group grow>
        <NumberInput
          label="Max Licenses"
          placeholder="5"
          value={formData.maxLicenses}
          onChange={(value) => setFormData(prev => ({ ...prev, maxLicenses: value as number }))}
          min={1}
          max={100}
        />

        <NumberInput
          label="Licenses Sold"
          placeholder="0"
          value={formData.licensesSold}
          onChange={(value) => setFormData(prev => ({ ...prev, licensesSold: value as number }))}
          min={0}
        />
      </Group>

      <Group grow>
        <NumberInput
          label="License Price (tokens)"
          placeholder="300"
          value={formData.licensePrice}
          onChange={(value) => setFormData(prev => ({ ...prev, licensePrice: value as number }))}
          min={0}
        />

        <NumberInput
          label="Full Claim Price (tokens)"
          placeholder="2000"
          value={formData.fullClaimPrice}
          onChange={(value) => setFormData(prev => ({ ...prev, fullClaimPrice: value as number }))}
          min={0}
        />
      </Group>
    </Stack>
  ), [formData, coverImageFile, galleryImageFiles]);

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
            <Title order={1} c="white" mb="xs">
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
        <Box style={isMobile ? { overflowX: 'auto', marginLeft: '-12px', marginRight: '-12px', paddingLeft: '12px', paddingRight: '12px' } : undefined}>
          <Group gap="sm" style={isMobile ? { flexWrap: 'nowrap' } : undefined}>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Total Characters</Text>
              <Text size="lg" fw={700} c="white">{characters.length}</Text>
            </Card>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Signature Tier</Text>
              <Text size="lg" fw={700} c="violet">{characters.filter(c => c.tier === 'Signature').length}</Text>
            </Card>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Classic Tier</Text>
              <Text size="lg" fw={700} c="blue">{characters.filter(c => c.tier === 'Classic').length}</Text>
            </Card>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Exclusively Sold</Text>
              <Text size="lg" fw={700} c="red">{characters.filter(c => c.fullyClaimed).length}</Text>
            </Card>
          </Group>
        </Box>

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
          cols={{ base: 2, xs: 2, sm: 3, md: 4, lg: 4 }}
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

            <Group align="flex-start" gap={0} wrap="nowrap" style={{ height: '600px' }}>
              <Box style={{ width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                <Image
                  src={selectedCharacter.image}
                  alt={selectedCharacter.name}
                  fit="contain"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              </Box>

              <Box style={{ width: '50%', padding: '2rem', overflowY: 'auto', height: '100%' }}>
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

                  {selectedCharacter.galleryImages && selectedCharacter.galleryImages.length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <Group 
                          justify="space-between" 
                          mb="xs" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => setGalleryExpanded(!galleryExpanded)}
                        >
                          <Text size="sm" fw={600}>
                            Gallery ({selectedCharacter.galleryImages.length})
                          </Text>
                          {galleryExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </Group>
                        {galleryExpanded && (
                          <SimpleGrid cols={2} spacing="xs">
                            {selectedCharacter.galleryImages.map((img, idx) => (
                              <Image
                                key={idx}
                                src={img}
                                alt={`Gallery ${idx + 1}`}
                                height={100}
                                fit="cover"
                                radius="sm"
                              />
                            ))}
                          </SimpleGrid>
                        )}
                      </div>
                    </>
                  )}

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
        {CharacterForm}
        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" onClick={closeEdit} disabled={uploading}>Cancel</Button>
          <Button onClick={handleSaveEdit} color="blue" loading={uploading}>Save Changes</Button>
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
        {CharacterForm}
        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" onClick={closeCreate} disabled={uploading}>Cancel</Button>
          <Button onClick={handleCreateNew} color="violet" loading={uploading}>Create Character</Button>
        </Group>
      </Modal>
    </Box>
  );
}
