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
  Textarea,
  Switch,
  Loader,
  Center,
  Paper,
  Tooltip,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconEdit, IconPhoto, IconSearch, IconCheck, IconX, IconDatabase } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getFirestore, collection, doc, onSnapshot, query, setDoc } from 'firebase/firestore';
import app from '@/lib/firebase';

// The 24 hardcoded reference images (local files)
const HARDCODED_REFERENCES = [
  { id: 'balcony-at-sunset', name: 'Balcony at sunset', image: '/character/premade characters/reference images/Balcony at sunset/0.webp' },
  { id: 'bathroom-mirror-selfie', name: 'Bathroom mirror selfie', image: '/character/premade characters/reference images/bathroom mirror selfie/0.webp' },
  { id: 'blowing-a-kiss', name: 'Blowing a kiss', image: '/character/premade characters/reference images/Blowing a kiss/0.webp' },
  { id: 'cop-girl-cosplay', name: 'Cop girl cosplay', image: '/character/premade characters/reference images/Premium-reference-img/cop girl cosplay 2.webp' },
  { id: 'countertop-arch-pose', name: 'Countertop Arch Pose', image: '/character/premade characters/reference images/Premium-reference-img/Countertop Arch Pose.webp' },
  { id: 'gym-fitness-pose', name: 'Gym fitness pose', image: '/character/premade characters/reference images/Gym fitness pose/0.webp' },
  { id: 'holding-chest', name: 'Holding chest', image: '/character/premade characters/reference images/Premium-reference-img/holding chest.webp' },
  { id: 'kneeling', name: 'Kneeling', image: '/character/premade characters/reference images/Kneeling/0.webp' },
  { id: 'kneeling-couch-lean', name: 'Kneeling Couch Lean', image: '/character/premade characters/reference images/Premium-reference-img/Kneeling Couch Lean.webp' },
  { id: 'leaning-forward', name: 'Leaning forward', image: '/character/premade characters/reference images/Premium-reference-img/leaning forward.webp' },
  { id: 'lying-on-beach', name: 'Lying on beach', image: '/character/premade characters/reference images/Premium-reference-img/lying on beach.webp' },
  { id: 'naked-in-bathtub', name: 'Naked in bathtub', image: '/character/premade characters/reference images/Naked in bathtub/0.webp' },
  { id: 'naked-tongue-out', name: 'Naked tongue out', image: '/character/premade characters/reference images/Premium-reference-img/naked tongue out.webp' },
  { id: 'picnic-lifestyle', name: 'Picnic lifestyle', image: '/character/premade characters/reference images/Picnic lifestyle/0.webp' },
  { id: 'pregnant-pose', name: 'Pregnant pose', image: '/character/premade characters/reference images/Premium-reference-img/pregnant pose.webp' },
  { id: 'santa-outfit', name: 'Santa outfit', image: '/character/premade characters/reference images/Premium-reference-img/santa outfit.webp' },
  { id: 'school-style', name: 'School style', image: '/character/premade characters/reference images/School-style/0.webp' },
  { id: 'showing-feet', name: 'Showing feet', image: '/character/premade characters/reference images/Premium-reference-img/showing feet.webp' },
  { id: 'spiderman-cosplay', name: 'Spiderman cosplay', image: '/character/premade characters/reference images/Spiderman cosplay/0.webp' },
  { id: 'tight-clothes', name: 'Tight clothes', image: '/character/premade characters/reference images/Premium-reference-img/tight clothes.webp' },
  { id: 'velma-cosplay', name: 'Velma cosplay', image: '/character/premade characters/reference images/Premium-reference-img/velma cosplay.webp' },
  { id: 'wearing-hijab', name: 'Wearing hijab', image: '/character/premade characters/reference images/Premium-reference-img/wearing hijab.webp' },
  { id: 'yellow-bikini', name: 'Yellow bikini', image: '/character/premade characters/reference images/Yellow bikini/0.webp' },
  { id: 'yoga', name: 'Yoga', image: '/character/premade characters/reference images/Premium-reference-img/yoga.webp' },
];

// Firestore data per reference image
interface RefImageData {
  prompt: string;
  enabled: boolean;
}

// Merged view for display
interface MergedRefImage {
  id: string;
  name: string;
  image: string;
  prompt: string;
  enabled: boolean;
  hasFirestoreDoc: boolean;
}

export default function AdminReferenceImagesPage() {
  const [firestoreData, setFirestoreData] = useState<Record<string, RefImageData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'enabled' | 'disabled'>('all');

  const [editingRef, setEditingRef] = useState<MergedRefImage | null>(null);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const db = getFirestore(app);

  // Load prompt & enabled data from Firestore (keyed by hardcoded id)
  useEffect(() => {
    const colRef = collection(db, 'reference-images');
    const q = query(colRef);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Record<string, RefImageData> = {};
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d) {
            data[docSnap.id] = {
              prompt: d.prompt || '',
              enabled: d.enabled !== false,
            };
          }
        });
        setFirestoreData(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching reference image data:', error);
        notifications.show({ title: 'Error', message: 'Failed to load reference image data.', color: 'red' });
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db]);

  // Merge hardcoded images with Firestore data
  const mergedImages: MergedRefImage[] = useMemo(() => {
    return HARDCODED_REFERENCES.map((ref) => {
      const fsData = firestoreData[ref.id];
      return {
        ...ref,
        prompt: fsData?.prompt || ref.name,
        enabled: fsData?.enabled !== false,
        hasFirestoreDoc: !!fsData,
      };
    });
  }, [firestoreData]);

  // Initialize all Firestore docs (one-time setup)
  const handleInitialize = async () => {
    const existing = Object.keys(firestoreData);
    const missing = HARDCODED_REFERENCES.filter(r => !existing.includes(r.id));

    if (missing.length === 0) {
      notifications.show({ title: 'Already initialized', message: 'All 24 reference images already have Firestore entries.', color: 'blue' });
      return;
    }

    setSeeding(true);
    try {
      for (const ref of missing) {
        await setDoc(doc(db, 'reference-images', ref.id), {
          name: ref.name,
          prompt: ref.name,
          enabled: true,
        });
      }
      notifications.show({
        title: 'Initialized',
        message: `Created ${missing.length} Firestore entries with default prompts.`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error initializing:', error);
      notifications.show({ title: 'Error', message: 'Failed to initialize reference image entries.', color: 'red' });
    } finally {
      setSeeding(false);
    }
  };

  // Open edit modal
  const handleEdit = (ref: MergedRefImage) => {
    setEditingRef(ref);
    setEditPrompt(ref.prompt);
    setEditEnabled(ref.enabled);
    openEdit();
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingRef) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'reference-images', editingRef.id);
      await setDoc(docRef, {
        name: editingRef.name,
        prompt: editPrompt || editingRef.name,
        enabled: editEnabled,
      }, { merge: true });

      notifications.show({
        title: 'Saved',
        message: `"${editingRef.name}" updated.`,
        color: 'green',
      });
      closeEdit();
    } catch (error) {
      console.error('Error saving:', error);
      notifications.show({ title: 'Error', message: 'Failed to save changes.', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  // Quick toggle enabled/disabled
  const handleToggleEnabled = async (ref: MergedRefImage) => {
    try {
      const docRef = doc(db, 'reference-images', ref.id);
      await setDoc(docRef, {
        name: ref.name,
        prompt: ref.prompt,
        enabled: !ref.enabled,
      }, { merge: true });
    } catch (error) {
      console.error('Error toggling:', error);
      notifications.show({ title: 'Error', message: 'Failed to toggle status.', color: 'red' });
    }
  };

  // Filter
  const filteredImages = useMemo(() => {
    let filtered = mergedImages;

    if (filterType === 'enabled') filtered = filtered.filter(r => r.enabled);
    if (filterType === 'disabled') filtered = filtered.filter(r => !r.enabled);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(term) || r.prompt.toLowerCase().includes(term));
    }

    return filtered;
  }, [mergedImages, filterType, searchTerm]);

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

  const enabledCount = mergedImages.filter(r => r.enabled).length;
  const disabledCount = mergedImages.filter(r => !r.enabled).length;
  const uninitializedCount = mergedImages.filter(r => !r.hasFirestoreDoc).length;

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
              Manage prompts and visibility for the 24 hardcoded reference images.
            </Text>
          </div>
          {uninitializedCount > 0 && (
            <Button
              leftSection={<IconDatabase size={16} />}
              onClick={handleInitialize}
              color="violet"
              loading={seeding}
            >
              Initialize ({uninitializedCount} missing)
            </Button>
          )}
        </Group>

        {/* Stats */}
        <Box style={isMobile ? { overflowX: 'auto', marginLeft: '-12px', marginRight: '-12px', paddingLeft: '12px', paddingRight: '12px' } : undefined}>
          <Group gap="sm" style={isMobile ? { flexWrap: 'nowrap' } : undefined}>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Total</Text>
              <Text size="lg" fw={700} c="white">{mergedImages.length}</Text>
            </Card>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Enabled</Text>
              <Text size="lg" fw={700} c="green">{enabledCount}</Text>
            </Card>
            <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Disabled</Text>
              <Text size="lg" fw={700} c="red">{disabledCount}</Text>
            </Card>
            {uninitializedCount > 0 && (
              <Card padding="sm" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flexShrink: 0 }}>
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>Not initialized</Text>
                <Text size="lg" fw={700} c="yellow">{uninitializedCount}</Text>
              </Card>
            )}
          </Group>
        </Box>

        {/* Search & Filter */}
        <Group gap="sm">
          <TextInput
            placeholder="Search by name or prompt..."
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
              variant={filterType === 'enabled' ? 'filled' : 'default'}
              color="green"
              onClick={() => setFilterType('enabled')}
              size="sm"
            >
              Enabled
            </Button>
            <Button
              variant={filterType === 'disabled' ? 'filled' : 'default'}
              color="red"
              onClick={() => setFilterType('disabled')}
              size="sm"
            >
              Disabled
            </Button>
          </Button.Group>
        </Group>

        {/* Grid */}
        {filteredImages.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <IconPhoto size={48} color="#666" />
              <Text c="dimmed">No reference images match your filter.</Text>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }} spacing="lg">
            {filteredImages.map((ref) => (
              <Card
                key={ref.id}
                p="md"
                style={{
                  backgroundColor: '#3a3a3a',
                  border: ref.enabled ? '1px solid #555' : '2px solid #e03131',
                  opacity: ref.enabled ? 1 : 0.5,
                }}
              >
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
                      src={ref.image}
                      alt={ref.name}
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
                          handleEdit(ref);
                        }}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                      <Tooltip label={ref.enabled ? 'Disable' : 'Enable'}>
                        <ActionIcon
                          variant="filled"
                          color={ref.enabled ? 'red' : 'green'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEnabled(ref);
                          }}
                        >
                          {ref.enabled ? <IconX size={14} /> : <IconCheck size={14} />}
                        </ActionIcon>
                      </Tooltip>
                    </Group>

                    {/* Status Badge */}
                    <Box
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                      }}
                    >
                      <Badge
                        variant="filled"
                        color={ref.enabled ? 'green' : 'red'}
                        size="sm"
                      >
                        {ref.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </Box>

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
                        {ref.name}
                      </Text>
                    </Box>
                  </Box>

                  {/* Prompt preview */}
                  <Box style={{ backgroundColor: '#2a2a2a', borderRadius: '4px', padding: '6px 8px' }}>
                    <Text size="xs" c="dimmed" mb={2}>Prompt:</Text>
                    <Text size="xs" c="white" lineClamp={2} style={{ fontStyle: ref.hasFirestoreDoc ? 'normal' : 'italic' }}>
                      {ref.hasFirestoreDoc ? ref.prompt : `${ref.name} (default — not yet initialized)`}
                    </Text>
                  </Box>
                </Stack>
              </Card>
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
        {editingRef && (
          <Stack gap="md">
            {/* Image Preview */}
            <Paper p="xs" withBorder>
              <Group gap="md" align="flex-start">
                <Image src={editingRef.image} alt={editingRef.name} height={160} width={120} fit="cover" radius="sm" />
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text fw={600} c="white">{editingRef.name}</Text>
                  <Text size="xs" c="dimmed">ID: {editingRef.id}</Text>
                  <Text size="xs" c="dimmed">Image is hardcoded from local files and cannot be changed.</Text>
                </Stack>
              </Group>
            </Paper>

            {/* Prompt */}
            <Textarea
              label="Prompt"
              description="This prompt is used as the positive prompt when a user selects this reference image"
              placeholder="Enter the prompt for this reference image..."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.currentTarget.value)}
              minRows={3}
              autosize
            />

            {/* Enabled toggle */}
            <Switch
              label="Enabled"
              description="Disabled images won't appear on the generation page"
              checked={editEnabled}
              onChange={(e) => setEditEnabled(e.currentTarget.checked)}
              color="green"
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeEdit} disabled={saving}>Cancel</Button>
              <Button onClick={handleSaveEdit} color="blue" loading={saving}>Save Changes</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
