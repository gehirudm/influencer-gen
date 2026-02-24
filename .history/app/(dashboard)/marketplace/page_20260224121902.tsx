'use client';

import { useState, useEffect } from 'react';
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
  Loader,
  Center,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconUsers, IconX, IconLock, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import classes from './marketplace.module.css';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';

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
}

function MarketplaceCharacterCard({ character, onClick }: { character: MarketplaceCharacter; onClick: () => void }) {
  return (
    <Card 
      p="md" 
      style={{ backgroundColor: '#3a3a3a', border: '1px solid #555', cursor: 'pointer' }}
      onClick={onClick}
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
          <Group 
            gap="xs" 
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              justifyContent: 'space-between',
              flexWrap: 'nowrap'
            }}
          >
            <Group gap="xs">
              {character.fullyClaimed && (
                <Badge variant="filled" color="red" size="sm" leftSection={<IconLock size={12} />}>
                  SOLD
                </Badge>
              )}
            </Group>
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

export default function MarketplacePage() {
  const [characters, setCharacters] = useState<MarketplaceCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [purchasing, setPurchasing] = useState(false);
  const [sortFilter, setSortFilter] = useState('All');
  const [selectedCharacter, setSelectedCharacter] = useState<MarketplaceCharacter | null>(null);
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const db = getFirestore(app);
  const router = useRouter();
  const { userData, systemData } = useUserData();

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

  const handleCardClick = (character: MarketplaceCharacter) => {
    setSelectedCharacter(character);
    setGalleryExpanded(false);
    open();
  };

  const handleCloseModal = () => {
    close();
    setSelectedCharacter(null);
    setGalleryExpanded(false);
  };

  const handlePurchase = async (purchaseType: 'license' | 'full_claim') => {
    if (!selectedCharacter) return;

    const cost = purchaseType === 'full_claim' ? selectedCharacter.fullClaimPrice : selectedCharacter.licensePrice;
    const currentTokens = systemData?.tokens || 0;

    if (currentTokens < cost) {
      notifications.show({
        title: 'Insufficient Tokens',
        message: `You need ${cost} tokens but have ${currentTokens}. Please purchase more tokens.`,
        color: 'red',
      });
      return;
    }

    setPurchasing(true);

    try {
      const response = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          purchaseType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      notifications.show({
        title: 'Purchase Successful!',
        message: `You have successfully ${purchaseType === 'full_claim' ? 'exclusively claimed' : 'licensed'} ${selectedCharacter.name}`,
        color: 'green',
      });

      close();
      setTimeout(() => {
        router.push('/character');
      }, 1000);

    } catch (error: any) {
      notifications.show({
        title: 'Purchase Failed',
        message: error.message || 'An error occurred during purchase',
        color: 'red',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const filteredCharacters = characters;

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ minHeight: '60vh' }}>
          <Stack align="center" gap="md">
            <Loader size="xl" color="violet" />
            <Text size="lg" c="dimmed">Loading marketplace...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl" px={isMobile ? 'sm' : undefined}>
        {/* Header */}
        <div>
          <Title order={1} mb="xs">
            Buy Pre-trained AI Models
          </Title>
          <Text size="lg" c="dimmed">
            World's largest Pre-trained and ready to use model collection. Pick your model and start creating immediately.
          </Text>
        </div>

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
          cols={{ base: 2, xs: 2, sm: 3, md: 4, lg: 5 }}
          spacing="lg"
        >
          {filteredCharacters.map((character) => (
            <MarketplaceCharacterCard
              key={character.id}
              character={character}
              onClick={() => handleCardClick(character)}
            />
          ))}
        </SimpleGrid>
      </Stack>

      {/* Character Detail Modal */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        size="xl"
        padding={0}
        withCloseButton={false}
        centered
      >
        {selectedCharacter && (
          <div className={classes.modalContent}>
            {/* Close Button */}
            <ActionIcon
              className={classes.closeButton}
              onClick={handleCloseModal}
              variant="subtle"
              color="gray"
            >
              <IconX size={20} />
            </ActionIcon>

            <Group align="flex-start" gap={0} wrap="nowrap" style={{ height: '600px' }}>
              {/* Left: Image */}
              <Box style={{ width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                <Image
                  src={selectedCharacter.image}
                  alt={selectedCharacter.name}
                  fit="contain"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              </Box>

              {/* Right: Details */}
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
                      <Badge color="green" variant="light" size="md">
                        Live
                      </Badge>
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

                  {/* Pricing Options */}
                  <Stack gap="md">
                    <div>
                      <Group justify="space-between" mb="xs">
                        <div>
                          <Text size="md" fw={600}>
                            Full Claim (Exclusive)
                          </Text>
                          <Text size="xs" c="dimmed">
                            Complete ownership of the model
                          </Text>
                        </div>
                        <Text size="xl" fw={700} c="violet">
                          {selectedCharacter.fullClaimPrice} tokens
                        </Text>
                      </Group>
                      <Button 
                        fullWidth 
                        size="md" 
                        variant="filled" 
                        color="violet"
                        disabled={selectedCharacter.fullyClaimed || purchasing}
                        loading={purchasing}
                        onClick={() => handlePurchase('full_claim')}
                      >
                        {selectedCharacter.fullyClaimed ? 'Already Claimed' : 'Claim Exclusively'}
                      </Button>
                    </div>

                    <div>
                      <Group justify="space-between" mb="xs">
                        <div>
                          <Text size="md" fw={600}>
                            Limited License
                          </Text>
                          <Text size="xs" c="dimmed">
                            Max {selectedCharacter.maxLicenses} licenses available
                            {(selectedCharacter.licensesSold >= selectedCharacter.maxLicenses || selectedCharacter.fullyClaimed) && ' - SOLD OUT'}
                          </Text>
                        </div>
                        <Text size="xl" fw={700} c="blue">
                          {selectedCharacter.licensePrice} tokens
                        </Text>
                      </Group>
                      <Button 
                        fullWidth 
                        size="md" 
                        variant="light" 
                        color="blue"
                        disabled={selectedCharacter.licensesSold >= selectedCharacter.maxLicenses || selectedCharacter.fullyClaimed || purchasing}
                        loading={purchasing}
                        onClick={() => handlePurchase('license')}
                      >
                        {selectedCharacter.fullyClaimed 
                          ? 'Exclusively Claimed' 
                          : selectedCharacter.licensesSold >= selectedCharacter.maxLicenses 
                            ? 'Sold Out' 
                            : 'Purchase License'}
                      </Button>
                    </div>
                  </Stack>
                </Stack>
              </Box>
            </Group>
          </div>
        )}
      </Modal>
    </Container>
  );
}
