'use client';

import { useState } from 'react';
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
  ActionIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUsers, IconX } from '@tabler/icons-react';
import classes from './marketplace.module.css';

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
}

// Dummy data
const dummyCharacters: MarketplaceCharacter[] = [
  {
    id: '1',
    name: 'Sophia',
    age: 24,
    tier: 'Signature',
    tags: ['Blonde', 'Athletic', 'Professional'],
    image: 'https://placehold.co/400x600/8B5CF6/white?text=Sophia',
    licensesSold: 3,
    maxLicenses: 5,
    about: 'Professional model with athletic build and striking features. Perfect for fitness, lifestyle, and fashion content.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '2',
    name: 'Isabella',
    age: 22,
    tier: 'Classic',
    tags: ['Brunette', 'Slim', 'Elegant'],
    image: 'https://placehold.co/400x600/EC4899/white?text=Isabella',
    licensesSold: 5,
    maxLicenses: 5,
    about: 'Elegant brunette with a slim figure. Ideal for high-fashion and luxury brand content.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '3',
    name: 'Emma',
    age: 26,
    tier: 'Signature',
    tags: ['Blonde', 'Athletic', 'Sporty'],
    image: 'https://placehold.co/400x600/F59E0B/white?text=Emma',
    licensesSold: 2,
    maxLicenses: 5,
    about: 'Athletic blonde with a passion for fitness. Great for sports, wellness, and active lifestyle content.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '4',
    name: 'Olivia',
    age: 23,
    tier: 'Classic',
    tags: ['Brunette', 'Slim', 'Sophisticated'],
    image: 'https://placehold.co/400x600/10B981/white?text=Olivia',
    licensesSold: 1,
    maxLicenses: 5,
    about: 'Sophisticated brunette with natural beauty. Perfect for beauty, skincare, and lifestyle brands.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '5',
    name: 'Ava',
    age: 25,
    tier: 'Signature',
    tags: ['Blonde', 'Slim', 'Classic'],
    image: 'https://placehold.co/400x600/3B82F6/white?text=Ava',
    licensesSold: 4,
    maxLicenses: 5,
    about: 'Classic blonde beauty with timeless appeal. Versatile for various content types and brand collaborations.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '6',
    name: 'Mia',
    age: 21,
    tier: 'Classic',
    tags: ['Brunette', 'Athletic', 'Energetic'],
    image: 'https://placehold.co/400x600/EF4444/white?text=Mia',
    licensesSold: 0,
    maxLicenses: 5,
    about: 'Energetic brunette with athletic physique. Excellent for fitness, sports nutrition, and active wear brands.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '7',
    name: 'Charlotte',
    age: 27,
    tier: 'Signature',
    tags: ['Blonde', 'Slim', 'Professional'],
    image: 'https://placehold.co/400x600/8B5CF6/white?text=Charlotte',
    licensesSold: 2,
    maxLicenses: 5,
    about: 'Professional blonde with refined features. Ideal for corporate, professional services, and premium brands.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '8',
    name: 'Amelia',
    age: 24,
    tier: 'Classic',
    tags: ['Brunette', 'Slim', 'Chic'],
    image: 'https://placehold.co/400x600/EC4899/white?text=Amelia',
    licensesSold: 3,
    maxLicenses: 5,
    about: 'Chic brunette with contemporary style. Perfect for fashion, beauty, and lifestyle content creation.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '9',
    name: 'Harper',
    age: 22,
    tier: 'Signature',
    tags: ['Blonde', 'Athletic', 'Modern'],
    image: 'https://placehold.co/400x600/F59E0B/white?text=Harper',
    licensesSold: 1,
    maxLicenses: 5,
    about: 'Modern athletic blonde with fresh appeal. Great for millennial and Gen-Z targeted campaigns.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '10',
    name: 'Evelyn',
    age: 26,
    tier: 'Classic',
    tags: ['Brunette', 'Athletic', 'Dynamic'],
    image: 'https://placehold.co/400x600/10B981/white?text=Evelyn',
    licensesSold: 5,
    maxLicenses: 5,
    about: 'Dynamic brunette with athletic build. Excellent for fitness, health, and wellness brand partnerships.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '11',
    name: 'Abigail',
    age: 23,
    tier: 'Signature',
    tags: ['Blonde', 'Slim', 'Elegant'],
    image: 'https://placehold.co/400x600/3B82F6/white?text=Abigail',
    licensesSold: 0,
    maxLicenses: 5,
    about: 'Elegant blonde with sophisticated style. Perfect for luxury fashion, jewelry, and high-end brands.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '12',
    name: 'Emily',
    age: 25,
    tier: 'Classic',
    tags: ['Brunette', 'Slim', 'Natural'],
    image: 'https://placehold.co/400x600/EF4444/white?text=Emily',
    licensesSold: 2,
    maxLicenses: 5,
    about: 'Natural brunette beauty with authentic appeal. Ideal for organic, eco-friendly, and lifestyle brands.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '13',
    name: 'Madison',
    age: 24,
    tier: 'Signature',
    tags: ['Blonde', 'Athletic', 'Vibrant'],
    image: 'https://placehold.co/400x600/8B5CF6/white?text=Madison',
    licensesSold: 4,
    maxLicenses: 5,
    about: 'Vibrant athletic blonde with energetic personality. Great for sports, energy drinks, and active lifestyle brands.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '14',
    name: 'Lily',
    age: 21,
    tier: 'Classic',
    tags: ['Brunette', 'Slim', 'Youthful'],
    image: 'https://placehold.co/400x600/EC4899/white?text=Lily',
    licensesSold: 1,
    maxLicenses: 5,
    about: 'Youthful brunette with fresh-faced appeal. Perfect for youth-oriented brands, beauty, and fashion content.',
    fullClaimPrice: 2000,
    licensePrice: 300
  },
  {
    id: '15',
    name: 'Grace',
    age: 27,
    tier: 'Signature',
    tags: ['Blonde', 'Slim', 'Refined'],
    image: 'https://placehold.co/400x600/F59E0B/white?text=Grace',
    licensesSold: 3,
    maxLicenses: 5,
    about: 'Refined blonde with graceful presence. Ideal for premium beauty, luxury lifestyle, and high-fashion content.',
    fullClaimPrice: 2000,
    licensePrice: 300
  }
];

function MarketplaceCharacterCard({ character, onClick }: { character: MarketplaceCharacter; onClick: () => void }) {
  return (
    <Card 
      radius="md" 
      className={classes.card} 
      style={{ backgroundImage: `url(${character.image})` }}
      onClick={onClick}
    >
      <Overlay className={classes.overlay} opacity={0.55} zIndex={0} />
      
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
              {character.licensePrice} tokens
            </Text>
          </Group>
        </div>
      </div>
    </Card>
  );
}

export default function MarketplacePage() {
  const [sortFilter, setSortFilter] = useState('All');
  const [selectedCharacter, setSelectedCharacter] = useState<MarketplaceCharacter | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const handleCardClick = (character: MarketplaceCharacter) => {
    setSelectedCharacter(character);
    open();
  };

  const handleCloseModal = () => {
    close();
    setSelectedCharacter(null);
  };

  const filteredCharacters = dummyCharacters; // For now, no filtering logic

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
