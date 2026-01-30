'use client';

import { useState } from 'react';
import { Container, Title, Button, Text, Stack, Alert } from '@mantine/core';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import app from '@/lib/firebase';
import { notifications } from '@mantine/notifications';

export default function InitMarketplacePage() {
  const [loading, setLoading] = useState(false);
  const db = getFirestore(app);

  const initializeMarketplace = async () => {
    setLoading(true);
    try {
      // Create a dummy character to initialize the collection
      await addDoc(collection(db, 'marketplace-characters'), {
        name: 'Sample Character',
        age: 25,
        tier: 'Classic',
        tags: ['Blonde', 'Slim', 'Professional'],
        image: 'https://placehold.co/400x600/8B5CF6/white?text=Sample',
        licensesSold: 0,
        maxLicenses: 5,
        about: 'This is a sample character to initialize the marketplace collection.',
        fullClaimPrice: 2000,
        licensePrice: 300,
        fullyClaimed: false,
        createdAt: new Date().toISOString(),
      });

      notifications.show({
        title: 'Success',
        message: 'Marketplace collection initialized successfully!',
        color: 'green',
      });
    } catch (error: any) {
      console.error('Error initializing marketplace:', error);
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Title order={1}>Initialize Marketplace</Title>
        
        <Alert title="Important" color="blue">
          This page helps initialize the marketplace-characters collection in Firestore.
          Click the button below if you're experiencing errors when accessing the marketplace page.
        </Alert>

        <Text>
          This will create a sample character in the marketplace-characters collection
          to ensure the collection exists in Firestore.
        </Text>

        <Button
          onClick={initializeMarketplace}
          loading={loading}
          size="lg"
          color="violet"
        >
          Initialize Marketplace Collection
        </Button>
      </Stack>
    </Container>
  );
}
