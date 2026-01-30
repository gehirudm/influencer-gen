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
import { useDisclosure } from '@mantine/hooks';
import { IconUsers, IconX, IconLock } from '@tabler/icons-react';
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
      radius="md" 
      className={classes.card} 
      style={{ backgroundImage: `url(${character.image})` }}
      onClick={onClick}
    >
      <Overlay className={classes.overlay} opacity={0.55} zIndex={0} />
      
      {/* Fully Claimed Badge */}
      {character.fullyClaimed && (
        <Badge 
          className={classes.tierBadge}
          style={{ top: 10, right: 10, left: 'auto' }}
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
        className={classes.tierBadge} 
        color={character.tier === 'Signature' ? 'violet' : 'blue'}
        variant="filled"
        size="sm"
      >
        {character.tier}
      </Badge>

      <div className={classes.content}>
        <div>
          <Text size="lg" fw={700} className={classes.title}>
            {character.name}, {character.age}
          </Text>
          
          <Group gap={4} mt={4}>
            {character.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} size="xs" variant="light" color="gray" className={classes.tagBadge}>
                {tag}
              </Badge>
            ))}
          </Group>
        </div>

        <div className={classes.footer}>
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

export default function MarketplacePage() {
  const [characters, setCharacters] = useState<MarketplaceCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [sortFilter, setSortFilter] = useState('All');
  const [selectedCharacter, setSelectedCharacter] = useState<MarketplaceCharacter | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const db = getFirestore(app);
  const router = useRouter();
  const { userData } = useUserData();

  // Load characters from Firestore with real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'marketplace-characters'), (snapshot) => {
      const characterData: MarketplaceCharacter[] = [];
      snapshot.forEach((doc) => {
        characterData.push({ id: doc.id, ...doc.data() } as MarketplaceCharacter);
      });
      setCharacters(characterData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching characters:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCardClick = (character: MarketplaceCharacter) => {
    setSelectedCharacter(character);
    open();
  };

  const handleCloseModal = () => {
    close();
    setSelectedCharacter(null);
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
      <Stack gap="xl">
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
          cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }}
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

            <Group align="flex-start" gap={0} wrap="nowrap">
              {/* Left: Image */}
              <Box className={classes.modalImage}>
                <Image
                  src={selectedCharacter.image}
                  alt={selectedCharacter.name}
                  fit="cover"
                  h="100%"
                />
              </Box>

              {/* Right: Details */}
              <Box className={classes.modalDetails}>
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
                      <Button fullWidth size="md" variant="filled" color="violet">
                        Claim Exclusively
                      </Button>
                    </div>

                    <div>
                      <Group justify="space-between" mb="xs">
                        <div>
                          <Text size="md" fw={600}>
                            Limited License
                          </Text>
                          <Text size="xs" c="dimmed">
                            Max 5 licenses available
                            {selectedCharacter.licensesSold >= selectedCharacter.maxLicenses && ' - SOLD OUT'}
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
                        disabled={selectedCharacter.licensesSold >= selectedCharacter.maxLicenses}
                      >
                        {selectedCharacter.licensesSold >= selectedCharacter.maxLicenses 
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
