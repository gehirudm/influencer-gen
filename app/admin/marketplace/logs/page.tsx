"use client";

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Stack,
  Card,
  Loader,
  Center,
  Box,
  TextInput,
  Select,
} from '@mantine/core';
import { IconSearch, IconLock, IconUsers, IconCoins } from '@tabler/icons-react';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import app from '@/lib/firebase';

interface PurchaseLog {
  id: string;
  userId: string;
  characterId: string;
  characterName: string;
  purchaseType: 'license' | 'full_claim';
  cost: number;
  timestamp: any;
}

export default function AdminMarketplaceLogsPage() {
  const [purchases, setPurchases] = useState<PurchaseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const db = getFirestore(app);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    try {
      const purchasesRef = collection(db, 'marketplace-purchases');
      const q = query(purchasesRef, orderBy('timestamp', 'desc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const purchaseData: PurchaseLog[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data) {
              purchaseData.push({ id: doc.id, ...data } as PurchaseLog);
            }
          });
          setPurchases(purchaseData);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching purchase logs:', error);
          setPurchases([]);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up listener:', error);
      setPurchases([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [db]);

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch = 
      purchase.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || 
      purchase.purchaseType === filterType;

    return matchesSearch && matchesFilter;
  });

  const totalRevenue = purchases.reduce((sum, p) => sum + p.cost, 0);
  const exclusiveClaims = purchases.filter(p => p.purchaseType === 'full_claim').length;
  const licensePurchases = purchases.filter(p => p.purchaseType === 'license').length;

  if (loading) {
    return (
      <Center style={{ height: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" color="violet" />
          <Text size="lg" c="dimmed">Loading purchase logs...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box style={{ padding: '0.75rem', height: '100%' }}>
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={2} c="white" mb="xs">
            Marketplace Purchase Logs
          </Title>
          <Text c="dimmed">
            View all character purchases and license transactions
          </Text>
        </div>

        {/* Stats */}
        <Group gap="md">
          <Card padding="md" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flex: 1 }}>
            <Group gap="sm">
              <IconCoins size={24} color="#8B5CF6" />
              <div>
                <Text size="sm" c="dimmed">Total Revenue</Text>
                <Text size="xl" fw={700} c="white">{totalRevenue.toLocaleString()} tokens</Text>
              </div>
            </Group>
          </Card>
          
          <Card padding="md" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flex: 1 }}>
            <Group gap="sm">
              <IconLock size={24} color="#8B5CF6" />
              <div>
                <Text size="sm" c="dimmed">Exclusive Claims</Text>
                <Text size="xl" fw={700} c="violet">{exclusiveClaims}</Text>
              </div>
            </Group>
          </Card>
          
          <Card padding="md" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flex: 1 }}>
            <Group gap="sm">
              <IconUsers size={24} color="#3B82F6" />
              <div>
                <Text size="sm" c="dimmed">License Purchases</Text>
                <Text size="xl" fw={700} c="blue">{licensePurchases}</Text>
              </div>
            </Group>
          </Card>

          <Card padding="md" radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', flex: 1 }}>
            <Group gap="sm">
              <IconCoins size={24} color="#22C55E" />
              <div>
                <Text size="sm" c="dimmed">Total Transactions</Text>
                <Text size="xl" fw={700} c="green">{purchases.length}</Text>
              </div>
            </Group>
          </Card>
        </Group>

        {/* Filters */}
        <Group>
          <TextInput
            placeholder="Search by character or user ID..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            value={filterType}
            onChange={(value) => setFilterType(value || 'all')}
            data={[
              { value: 'all', label: 'All Purchases' },
              { value: 'full_claim', label: 'Exclusive Claims Only' },
              { value: 'license', label: 'Licenses Only' },
            ]}
            style={{ width: '200px' }}
          />
        </Group>

        {/* Purchase Table */}
        <Card padding={0} radius="md" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
          <Box style={{ overflowX: 'auto' }}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Character</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Cost</Table.Th>
                  <Table.Th>User ID</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredPurchases.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Center p="xl">
                        <Text c="dimmed">No purchase logs found</Text>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <Table.Tr key={purchase.id}>
                      <Table.Td>
                        <Text fw={600}>{purchase.characterName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={purchase.purchaseType === 'full_claim' ? 'violet' : 'blue'}
                          variant="light"
                          leftSection={purchase.purchaseType === 'full_claim' ? <IconLock size={12} /> : <IconUsers size={12} />}
                        >
                          {purchase.purchaseType === 'full_claim' ? 'Exclusive' : 'License'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconCoins size={16} color="#8B5CF6" />
                          <Text fw={600}>{purchase.cost}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                          {purchase.userId.substring(0, 8)}...
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {purchase.timestamp?.toDate?.()?.toLocaleString() || 'Recently'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Box>
        </Card>
      </Stack>
    </Box>
  );
}
