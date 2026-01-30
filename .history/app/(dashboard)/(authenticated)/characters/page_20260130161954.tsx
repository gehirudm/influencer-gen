'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Badge,
  Group,
  Stack,
  Image,
  Box,
  Loader,
  Center,
  Paper,
} from '@mantine/core';
import { IconLock, IconUsers, IconCalendar } from '@tabler/icons-react';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

interface UserCharacter {
  id: string;
  characterId: string;
  characterName: string;
  characterImage: string;
  purchaseType: 'license' | 'full_claim';
  cost: number;
  purchasedAt: any;
}

function UserCharacterCard({ character }: { character: UserCharacter }) {
  const isExclusive = character.purchaseType === 'full_claim';
  
  return (
    <Card 
      radius="md" 
      style={{ 
        position: 'relative',
        backgroundImage: `url(${character.characterImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '400px',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
          zIndex: 0,
        }}
      />
      
      {/* Ownership Badge */}
      <Badge 
        style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}
        color={isExclusive ? 'violet' : 'blue'}
        variant="filled"
        size="md"
        leftSection={isExclusive ? <IconLock size={14} /> : <IconUsers size={14} />}
      >
        {isExclusive ? 'Exclusive Owner' : 'Licensed'}
      </Badge>

      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: '1.5rem',
        zIndex: 1,
      }}>
        <Stack gap="xs">
          <Text size="xl" fw={700} c="white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
            {character.characterName}
          </Text>
          
          <Group gap="md">
            <Group gap={6}>
              <IconCalendar size={16} color="white" />
              <Text size="sm" c="white" fw={500}>
                {character.purchasedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
              </Text>
            </Group>
            <Badge variant="light" color="green">
              {character.cost} tokens
            </Badge>
          </Group>
        </Stack>
      </div>
    </Card>
  );
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const db = getFirestore(app);
    const charactersRef = collection(db, 'users', userId, 'characters');
    const q = query(charactersRef, orderBy('purchasedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const characterData: UserCharacter[] = [];
      snapshot.forEach((doc) => {
        characterData.push({ id: doc.id, ...doc.data() } as UserCharacter);
      });
      setCharacters(characterData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching characters:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ minHeight: '60vh' }}>
          <Stack align="center" gap="md">
            <Loader size="xl" color="violet" />
            <Text size="lg" c="dimmed">Loading your characters...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (characters.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1} mb="xs">
              Your Characters
            </Title>
            <Text size="lg" c="dimmed">
              AI models you own or have licensed
            </Text>
          </div>

          <Center style={{ minHeight: '40vh' }}>
            <Paper p="xl" radius="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', maxWidth: '500px' }}>
              <Stack align="center" gap="md">
                <IconUsers size={64} color="gray" style={{ opacity: 0.5 }} />
                <Text size="xl" fw={600} ta="center">
                  No Characters Yet
                </Text>
                <Text size="md" c="dimmed" ta="center">
                  Visit the marketplace to purchase or license AI models
                </Text>
              </Stack>
            </Paper>
          </Center>
        </Stack>
      </Container>
    );
  }

  const exclusiveCharacters = characters.filter(c => c.purchaseType === 'full_claim');
  const licensedCharacters = characters.filter(c => c.purchaseType === 'license');

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1} mb="xs">
            Your Characters
          </Title>
          <Text size="lg" c="dimmed">
            AI models you own or have licensed
          </Text>
        </div>

        {/* Stats */}
        <Group gap="md">
          <Paper p="md" radius="md" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <Text size="sm" c="dimmed">Exclusively Owned</Text>
            <Text size="xl" fw={700} c="violet">{exclusiveCharacters.length}</Text>
          </Paper>
          <Paper p="md" radius="md" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Text size="sm" c="dimmed">Licensed</Text>
            <Text size="xl" fw={700} c="blue">{licensedCharacters.length}</Text>
          </Paper>
          <Paper p="md" radius="md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <Text size="sm" c="dimmed">Total Characters</Text>
            <Text size="xl" fw={700} c="green">{characters.length}</Text>
          </Paper>
        </Group>

        {/* Exclusive Characters */}
        {exclusiveCharacters.length > 0 && (
          <div>
            <Title order={2} size="h3" mb="md" c="violet">
              Exclusively Owned
            </Title>
            <SimpleGrid
              cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }}
              spacing="lg"
            >
              {exclusiveCharacters.map((character) => (
                <UserCharacterCard key={character.id} character={character} />
              ))}
            </SimpleGrid>
          </div>
        )}

        {/* Licensed Characters */}
        {licensedCharacters.length > 0 && (
          <div>
            <Title order={2} size="h3" mb="md" c="blue">
              Licensed Characters
            </Title>
            <SimpleGrid
              cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }}
              spacing="lg"
            >
              {licensedCharacters.map((character) => (
                <UserCharacterCard key={character.id} character={character} />
              ))}
            </SimpleGrid>
          </div>
        )}
      </Stack>
    </Container>
  );
}
