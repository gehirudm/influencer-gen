"use client";

import { useState } from 'react';
import {
  Container,
  Title,
  SegmentedControl,
  Group,
  Switch,
  SimpleGrid,
  Card,
  Text,
  Image,
  ActionIcon,
  Badge,
  Box
} from '@mantine/core';
import { IconHeart, IconBookmark, IconShare } from '@tabler/icons-react';
import classes from './Discover.module.css';
import RoundTabs from '@/components/RoundTabs/RoundTabs';
import DiscoverPageCard from '@/components/DiscoverPageCard/DiscoverPageCard';

export interface ImagePost {
  id: string;
  title: string;
  creator: string;
  imageUrls: string[];
  likes: number;
  isMultiImage?: boolean;
  imageCount?: number;
  currentImageIndex?: number;
  nsfw?: boolean;
}

export default function DiscoverPage() {
  const [filter, setFilter] = useState('new');
  const [showNSFW, setShowNSFW] = useState(false);

  // Sample data for development
  const allPosts: ImagePost[] = [
    {
      id: '05700cc4-d54b-4c5d-bbaf-64cdec7a2762',
      title: 'Beautiful Chinese Girlfriend By Archxngel',
      creator: 'Archxngel',
      imageUrls: ['/discover/sample1.png'],
      likes: 141,
      isMultiImage: true,
      imageCount: 2,
      currentImageIndex: 1
    },
    {
      id: 'a3469c0c-e11b-4a22-98e4-ff6b797c7068',
      title: 'Beautiful Girl With Pink Hoodie By Archxngel',
      creator: 'Archxngel',
      imageUrls: ['/discover/sample2.png'],
      likes: 134,
      isMultiImage: false
    },
    {
      id: '3a267170-fb3d-4a00-8fef-c0fb7115511',
      title: 'Forest Date By Archxngel',
      creator: 'Archxngel',
      imageUrls: ['/discover/sample1.png', '/discover/sample2.png'],
      likes: 134,
      isMultiImage: true,
      imageCount: 2,
      currentImageIndex: 1
    },
    {
      id: '0b1e4102-c49e-42c6-839f-9c4d09e904ac',
      title: 'Handsome Daddy By Archxngel',
      creator: 'Archxngel',
      imageUrls: ['/discover/sample1.png', '/discover/sample2.png'],
      likes: 63,
      isMultiImage: true,
      imageCount: 2,
      currentImageIndex: 1
    },
    // Additional dummy posts with NSFW flag for testing the filter
    {
      id: '698834fe-9d73-4958-9410-5edab2b67465',
      title: 'Beach Day By Creator',
      creator: 'Creator',
      imageUrls: ['/discover/sample2.png'],
      likes: 89,
      nsfw: true
    },
    {
      id: 'b5f0f720-74f5-419f-8ecc-bb8f39dcc5f9',
      title: 'City Night By Creator',
      creator: 'Creator',
      imageUrls: ['/discover/sample2.png', '/discover/sample3.png'],
      likes: 210,
      isMultiImage: true,
      imageCount: 3,
      currentImageIndex: 1
    },
    {
      id: '8edc22c8-2555-4b83-a037-f1fae71fa12a',
      title: 'Mountain View By Creator',
      creator: 'Creator',
      imageUrls: ['/discover/sample2.png'],
      likes: 175
    },
    {
      id: '64996d28-5456-4836-accd-150a2191b68b',
      title: 'Studio Portrait By Creator',
      creator: 'Creator',
      imageUrls: ['/discover/sample1.png', '/discover/sample2.png'],
      likes: 320,
      nsfw: true,
      isMultiImage: true,
      imageCount: 2,
      currentImageIndex: 1
    }
  ];

  // Filter posts based on selected filter and NSFW setting
  const filteredPosts = allPosts.filter(post => {
    if (!showNSFW && post.nsfw) {
      return false;
    }
    return true;
  });

  // Sort posts based on selected filter
  const displayPosts = [...filteredPosts].sort((a, b) => {
    if (filter === 'popular' || filter === 'hall-of-fame') {
      return b.likes - a.likes;
    }
    // For 'new', we would normally sort by date, but since we don't have dates in our dummy data,
    // we'll just use the reverse of the array order to simulate newest first
    return 0; // Keep original order for 'new'
  });

  return (
    <Container size="xl" py="xl" className={classes.container}>
      <Title order={1} ta="center" mb="xl" className={classes.title}>
        Discover
      </Title>

      <Group justify="center" mb="md">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          data={[
            { label: 'New', value: 'new' },
            { label: 'Popular', value: 'popular' },
            { label: 'Hall of Fame', value: 'hall-of-fame' }
          ]}
          className={classes.segmentedControl}
          classNames={{
            indicator: classes.segmentedIndicator,
            root: classes.segmentedRoot,
            control: classes.segmentedControl,
            label: classes.segmentedLabel
          }}
        />
      </Group>

      <Group justify="center" mb="xl">
        <Switch
          label="Show NSFW"
          checked={showNSFW}
          onChange={(event) => setShowNSFW(event.currentTarget.checked)}
          className={classes.nsfwSwitch}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
        {displayPosts.map((post) => (
          <DiscoverPageCard post={post}></DiscoverPageCard>
        ))}
      </SimpleGrid>
    </Container>
  );
}