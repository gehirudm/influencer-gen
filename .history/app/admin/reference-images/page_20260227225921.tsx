"use client";

import { useState, useEffect, useMemo } from 'react';
import {
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
  Box,
  ActionIcon,
  TextInput,
  Switch,
  NumberInput,
  Loader,
  Center,
  FileButton,
  Paper,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconX, IconEdit, IconTrash, IconPlus, IconPhoto, IconCrown, IconDatabase, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';

interface ReferenceImage {
  id: string;
  name: string;
  image: string;
  premium: boolean;
  order: number;
  prompt: string;
  createdAt: string;
}

// The current hardcoded reference images for seeding
const SEED_REFERENCE_IMAGES: Omit<ReferenceImage, 'id'>[] = [
  { name: 'Bathroom Mirror Selfie', image: '/character/premade characters/reference images/bathroom mirror selfie/0.webp', premium: false, order: 1, prompt: 'Bathroom mirror selfie', createdAt: new Date().toISOString() },
  { name: 'Spiderman cosplay', image: '/character/premade characters/reference images/spiderman cosplay/0.webp', premium: false, order: 2, prompt: 'Spiderman cosplay', createdAt: new Date().toISOString() },
  { name: 'Balcony at sunset', image: '/character/premade characters/reference images/balcony at sunset/0.webp', premium: false, order: 3, prompt: 'Balcony at sunset', createdAt: new Date().toISOString() },
  { name: 'Yellow bikini', image: '/character/premade characters/reference images/Yellow bikini/0.webp', premium: false, order: 4, prompt: 'Yellow bikini', createdAt: new Date().toISOString() },
  { name: 'Kneeling', image: '/character/premade characters/reference images/kneeling/0.webp', premium: false, order: 5, prompt: 'Kneeling', createdAt: new Date().toISOString() },
  { name: 'Naked in bathtub', image: '/character/premade characters/reference images/Naked in bathtub/0.webp', premium: false, order: 6, prompt: 'Naked in bathtub', createdAt: new Date().toISOString() },
  { name: 'School-style', image: '/character/premade characters/reference images/school-style/0.webp', premium: false, order: 7, prompt: 'School-style', createdAt: new Date().toISOString() },
  { name: 'Blowing a kiss', image: '/character/premade characters/reference images/blowing a kiss/0.webp', premium: false, order: 8, prompt: 'Blowing a kiss', createdAt: new Date().toISOString() },
  { name: 'Gym fitness pose', image: '/character/premade characters/reference images/gym fitness pose/0.webp', premium: false, order: 9, prompt: 'Gym fitness pose', createdAt: new Date().toISOString() },
  { name: 'Picnic lifestyle', image: '/character/premade characters/reference images/picnic lifestyle/0.webp', premium: false, order: 10, prompt: 'Picnic lifestyle', createdAt: new Date().toISOString() },
  { name: 'Cop Girl Cosplay 2', image: '/character/premade characters/reference images/Premium-reference-img/cop girl cosplay 2.webp', premium: true, order: 11, prompt: 'Cop girl cosplay', createdAt: new Date().toISOString() },
  { name: 'Countertop Arch Pose', image: '/character/premade characters/reference images/Premium-reference-img/Countertop Arch Pose.webp', premium: true, order: 12, prompt: 'Countertop arch pose', createdAt: new Date().toISOString() },
  { name: 'Holding Chest', image: '/character/premade characters/reference images/Premium-reference-img/holding chest.webp', premium: true, order: 13, prompt: 'Holding chest', createdAt: new Date().toISOString() },
  { name: 'Kneeling Couch Lean', image: '/character/premade characters/reference images/Premium-reference-img/Kneeling Couch Lean.webp', premium: true, order: 14, prompt: 'Kneeling couch lean', createdAt: new Date().toISOString() },
  { name: 'Leaning Forward', image: '/character/premade characters/reference images/Premium-reference-img/leaning forward.webp', premium: true, order: 15, prompt: 'Leaning forward', createdAt: new Date().toISOString() },
  { name: 'Lying on Beach', image: '/character/premade characters/reference images/Premium-reference-img/lying on beach.webp', premium: true, order: 16, prompt: 'Lying on beach', createdAt: new Date().toISOString() },
  { name: 'Naked Tongue Out', image: '/character/premade characters/reference images/Premium-reference-img/naked tongue out.webp', premium: true, order: 17, prompt: 'Naked tongue out', createdAt: new Date().toISOString() },
  { name: 'Pregnant Pose', image: '/character/premade characters/reference images/Premium-reference-img/pregnant pose.webp', premium: true, order: 18, prompt: 'Pregnant pose', createdAt: new Date().toISOString() },
  { name: 'Santa Outfit', image: '/character/premade characters/reference images/Premium-reference-img/santa outfit.webp', premium: true, order: 19, prompt: 'Santa outfit', createdAt: new Date().toISOString() },
  { name: 'Showing Feet', image: '/character/premade characters/reference images/Premium-reference-img/showing feet.webp', premium: true, order: 20, prompt: 'Showing feet', createdAt: new Date().toISOString() },
  { name: 'Tight Clothes', image: '/character/premade characters/reference images/Premium-reference-img/tight clothes.webp', premium: true, order: 21, prompt: 'Tight clothes', createdAt: new Date().toISOString() },
  { name: 'Velma Cosplay', image: '/character/premade characters/reference images/Premium-reference-img/velma cosplay.webp', premium: true, order: 22, prompt: 'Velma cosplay', createdAt: new Date().toISOString() },
  { name: 'Wearing Hijab', image: '/character/premade characters/reference images/Premium-reference-img/wearing hijab.webp', premium: true, order: 23, prompt: 'Wearing hijab', createdAt: new Date().toISOString() },
  { name: 'Yoga', image: '/character/premade characters/reference images/Premium-reference-img/yoga.webp', premium: true, order: 24, prompt: 'Yoga', createdAt: new Date().toISOString() },
];

function ReferenceImageCard({
  refImage,
  onEdit,
  onDelete,
}: {
  refImage: ReferenceImage;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card p="md" style={{ backgroundColor: '#3a3a3a', border: '1px solid #555' }}>
      <Stack gap="sm">
        <Box
          style={{
            width: '100%',
            aspectRatio: '3/4',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <img
            src={refImage.image}
            alt={refImage.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Admin Controls */}
          <Group
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 3,
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

          {/* Badges */}
          <Group
            gap="xs"
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              justifyContent: 'flex-start',
              flexWrap: 'nowrap',
            }}
          >
            {refImage.premium && (
              <Badge variant="filled" color="yellow" size="sm" leftSection={<IconCrown size={12} />}>
                Premium
              </Badge>
            )}
            {!refImage.premium && (
              <Badge variant="filled" color="green" size="sm">
                Free
              </Badge>
            )}
          </Group>

          <Box
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              padding: '20px 8px 8px',
            }}
          >
            <Text size="xs" c="white" fw={500} ta="center" lineClamp={2}>
              {refImage.name}
            </Text>
          </Box>
        </Box>
      </Stack>
    </Card>
  );
}

export default function AdminReferenceImagesPage() {
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'premium'>('all');

  const [editingImage, setEditingImage] = useState<ReferenceImage | null>(null);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const db = getFirestore(app);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    premium: boolean;
    order: number;
    image: string;
    prompt: string;
  }>({
    name: '',
    premium: false,
    order: 0,
    image: '',
    prompt: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Load reference images from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const q = query(collection(db, 'reference-images'), orderBy('order', 'asc'));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data: ReferenceImage[] = [];
          snapshot.forEach((doc) => {
            const d = doc.data();
            if (d) {
              data.push({ id: doc.id, ...d } as ReferenceImage);
            }
          });
          setReferenceImages(data);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching reference images:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to load reference images.',
            color: 'red',
          });
          setReferenceImages([]);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up listener:', error);
      setReferenceImages([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [db]);

  const uploadImageToStorage = async (file: File, path: string): Promise<string> => {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // Seed defaults
  const handleSeedDefaults = async () => {
    if (referenceImages.length > 0) {
      if (!confirm('There are already reference images in the database. Seeding will add the 24 default entries alongside existing ones. Continue?')) {
        return;
      }
    }

    setSeeding(true);
    try {
      const batch = writeBatch(db);
      const colRef = collection(db, 'reference-images');

      for (const img of SEED_REFERENCE_IMAGES) {
        const docRef = doc(colRef);
        batch.set(docRef, img);
      }

      await batch.commit();

      notifications.show({
        title: 'Seeded',
        message: `${SEED_REFERENCE_IMAGES.length} default reference images added.`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error seeding defaults:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to seed default reference images.',
        color: 'red',
      });
    } finally {
      setSeeding(false);
    }
  };

  // Create
  const handleCreate = () => {
    const maxOrder = referenceImages.length > 0 ? Math.max(...referenceImages.map(r => r.order)) : 0;
    setFormData({
      name: '',
      premium: false,
      order: maxOrder + 1,
      image: '',
      prompt: '',
    });
    setImageFile(null);
    openCreate();
  };

  const handleCreateNew = async () => {
    if (!formData.name) {
      notifications.show({ title: 'Error', message: 'Name is required.', color: 'red' });
      return;
    }

    if (!imageFile && !formData.image) {
      notifications.show({ title: 'Error', message: 'An image is required.', color: 'red' });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = formData.image;

      if (imageFile) {
        const timestamp = Date.now();
        imageUrl = await uploadImageToStorage(
          imageFile,
          `reference-images/${timestamp}-${imageFile.name}`
        );
      }

      await addDoc(collection(db, 'reference-images'), {
        name: formData.name,
        image: imageUrl,
        premium: formData.premium,
        order: formData.order,
        prompt: formData.prompt || formData.name,
        createdAt: new Date().toISOString(),
      });

      notifications.show({
        title: 'Created',
        message: `"${formData.name}" added to reference images.`,
        color: 'green',
      });

      closeCreate();
      setImageFile(null);
    } catch (error) {
      console.error('Error creating reference image:', error);
      notifications.show({ title: 'Error', message: 'Failed to create reference image.', color: 'red' });
    } finally {
      setUploading(false);
    }
  };

  // Edit
  const handleEdit = (refImage: ReferenceImage) => {
    setEditingImage(refImage);
    setFormData({
      name: refImage.name,
      premium: refImage.premium,
      order: refImage.order,
      image: refImage.image,
      prompt: refImage.prompt || refImage.name,
    });
    setImageFile(null);
    openEdit();
  };

  const handleSaveEdit = async () => {
    if (!editingImage || !formData.name) return;

    setUploading(true);
    try {
      let imageUrl = formData.image;

      if (imageFile) {
        const timestamp = Date.now();
        imageUrl = await uploadImageToStorage(
          imageFile,
          `reference-images/${timestamp}-${imageFile.name}`
        );
      }

      const docRef = doc(db, 'reference-images', editingImage.id);
      await updateDoc(docRef, {
        name: formData.name,
        image: imageUrl,
        premium: formData.premium,
        order: formData.order,
        prompt: formData.prompt || formData.name,
      });

      notifications.show({
        title: 'Updated',
        message: `"${formData.name}" updated successfully.`,
        color: 'green',
      });

      closeEdit();
      setEditingImage(null);
      setImageFile(null);
    } catch (error) {
      console.error('Error updating reference image:', error);
      notifications.show({ title: 'Error', message: 'Failed to update reference image.', color: 'red' });
    } finally {
      setUploading(false);
    }
  };

  // Delete
  const handleDelete = async (refImage: ReferenceImage) => {
    if (!confirm(`Delete "${refImage.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'reference-images', refImage.id));
      notifications.show({
        title: 'Deleted',
        message: `"${refImage.name}" removed.`,
        color: 'red',
      });
    } catch (error) {
      console.error('Error deleting reference image:', error);
      notifications.show({ title: 'Error', message: 'Failed to delete reference image.', color: 'red' });
    }
  };

  // Filter
  const filteredImages = useMemo(() => {
    let filtered = referenceImages;

    if (filterType === 'free') filtered = filtered.filter(r => !r.premium);
    if (filterType === 'premium') filtered = filtered.filter(r => r.premium);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(term));
    }

    return filtered;
  }, [referenceImages, filterType, searchTerm]);

  // Form component
  const FormContent = useMemo(
    () => (
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="Reference image name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
        />

        <Textarea
          label="Prompt"
          placeholder="The positive prompt used when this reference image is selected (defaults to name if empty)"
          value={formData.prompt}
          onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
          minRows={2}
          autosize
        />

        <Stack gap="sm">
          <Text size="sm" fw={500}>Image</Text>
          <FileButton onChange={setImageFile} accept="image/png,image/jpeg,image/jpg,image/webp">
            {(props) => (
              <Button {...props} leftSection={<IconPhoto size={16} />} variant="light">
                {imageFile ? `Selected: ${imageFile.name}` : 'Upload Image'}
              </Button>
            )}
          </FileButton>
          {formData.image && !imageFile && (
            <Paper p="xs" withBorder>
              <Image src={formData.image} alt="Current image" height={120} fit="contain" />
            </Paper>
          )}
          {imageFile && (
            <Paper p="xs" withBorder>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">{imageFile.name}</Text>
                <ActionIcon onClick={() => setImageFile(null)} color="red" variant="subtle">
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Paper>
          )}
        </Stack>

        <Switch
          label="Premium (locked behind subscription)"
          checked={formData.premium}
          onChange={(e) => setFormData((prev) => ({ ...prev, premium: e.currentTarget.checked }))}
        />

        <NumberInput
          label="Display Order"
          description="Lower numbers appear first"
          value={formData.order}
          onChange={(value) => setFormData((prev) => ({ ...prev, order: (value as number) || 0 }))}
          min={0}
        />
      </Stack>
    ),
    [formData, imageFile]
  );

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="violet" />
          <Text size="lg" c="dimmed">Loading reference images...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box style={{ padding: '0.75rem', height: '100%' }}>
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Title order={1} c="white" mb="xs">
              Reference Images
            </Title>
            <Text c="dimmed">
              Manage reference image styles shown in the generation page.
            </Text>
          </div>
          <Group gap="sm">
            <Button
              leftSection={<IconDatabase size={16} />}
              onClick={handleSeedDefaults}
              color="gray"
              variant="light"
              loading={seeding}
            >
              Seed Defaults
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreate}
              color="violet"
            >
              Add Reference Image
            </Button>
          </Group>
        </Group>

        {/* Stats */}
        <Box style={isMobile ? { overflowX: 'auto', marginLeft: '-12px', marginRight: '-12px', paddingLeft: '12px', paddingRight: '12px' } : undefined}>
          <Group gap="sm" style={isMobile ? { flexWrap: 'nowrap' } : undefined}>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Total</Text>
              <Text size="lg" fw={700} c="white">{referenceImages.length}</Text>
            </Card>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Free</Text>
              <Text size="lg" fw={700} c="green">{referenceImages.filter(r => !r.premium).length}</Text>
            </Card>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Premium</Text>
              <Text size="lg" fw={700} c="yellow">{referenceImages.filter(r => r.premium).length}</Text>
            </Card>
          </Group>
        </Box>

        {/* Search & Filter */}
        <Group gap="sm">
          <TextInput
            placeholder="Search by name..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            style={{ flex: 1, maxWidth: 300 }}
          />
          <Button.Group>
            <Button
              variant={filterType === 'all' ? 'filled' : 'default'}
              onClick={() => setFilterType('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterType === 'free' ? 'filled' : 'default'}
              color="green"
              onClick={() => setFilterType('free')}
              size="sm"
            >
              Free
            </Button>
            <Button
              variant={filterType === 'premium' ? 'filled' : 'default'}
              color="yellow"
              onClick={() => setFilterType('premium')}
              size="sm"
            >
              Premium
            </Button>
          </Button.Group>
        </Group>

        {/* Grid */}
        {filteredImages.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <IconPhoto size={48} color="#666" />
              <Text c="dimmed">
                {referenceImages.length === 0
                  ? 'No reference images yet. Click "Seed Defaults" to add the built-in ones, or create new ones.'
                  : 'No reference images match your filter.'}
              </Text>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }} spacing="lg">
            {filteredImages.map((refImage) => (
              <ReferenceImageCard
                key={refImage.id}
                refImage={refImage}
                onEdit={() => handleEdit(refImage)}
                onDelete={() => handleDelete(refImage)}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* Edit Modal */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        size="lg"
        title={<Text fw={600} size="lg">Edit Reference Image</Text>}
        centered
      >
        {FormContent}
        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" onClick={closeEdit} disabled={uploading}>Cancel</Button>
          <Button onClick={handleSaveEdit} color="blue" loading={uploading}>Save Changes</Button>
        </Group>
      </Modal>

      {/* Create Modal */}
      <Modal
        opened={createOpened}
        onClose={closeCreate}
        size="lg"
        title={<Text fw={600} size="lg">Add Reference Image</Text>}
        centered
      >
        {FormContent}
        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" onClick={closeCreate} disabled={uploading}>Cancel</Button>
          <Button onClick={handleCreateNew} color="violet" loading={uploading}>Add Image</Button>
        </Group>
      </Modal>
    </Box>
  );
}
