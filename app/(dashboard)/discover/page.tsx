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
import { parseAsStringLiteral, useQueryState } from 'nuqs';

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
  params: {
    seed?: number;
    prompt: string;
    width?: number;
    height?: number;
    cfg_scale?: number;
    negative_prompt?: string;
  }
}

export default function DiscoverPage() {
  const [filter, setFilter] = useQueryState('filter', parseAsStringLiteral(["new", "popular"] as const).withDefault("new"))
  const [showNSFW, setShowNSFW] = useState(false);

  // Sample data for development
  const allPosts: ImagePost[] = [
    {
      id: '05700cc4-d54b-4c5d-bbaf-64cdec7a2762',
      title: 'Amanda Cerny',
      creator: 'FantazyPro',
      imageUrls: ['/discover/sample3.png'],
      likes: 141,
      isMultiImage: true,
      imageCount: 2,
      currentImageIndex: 1,
      params: {
        seed: 1583768832,
        prompt: 'Realistic editorial photograph of (((Amanda Cerny))), (21 years old). <lora:WeddingDressEXv0.4:0.3> , wearing black wedding dress,off the shoulder, deep vee neckline, (exposed breast), (cleavage), ( view from front), striking features, large breasts, perfect teeth,  beauty, intricate details, dramatic composition, tension, slight freckles,perfect teeth, wispy hair, contrast, texture, realism, high-quality rendering, stunning art, high quality, film grain, detailed skin, detailed face ,  athletic body',
        width: 512,
        height: 768,
        cfg_scale: 8
      }
    },
    {
      id: 'a3469c0c-e11b-4a22-98e4-ff6b797c7068',
      title: 'Beautiful Girl wearing a Flannel shirt',
      creator: 'FantazyPro',
      imageUrls: ['/discover/sample1.png'],
      likes: 134,
      isMultiImage: false,
      params: {
        seed: 1583768832,
        prompt: 'Full body shot of 28 year old. Flannel shirt, denim shorts, striking features, medium breasts, ((cleavage)), beauty, intricate details, dramatic composition, tension, updo hair, wispy hair, beautiful skin, contrast, texture, realism, high-quality rendering, stunning art, high quality, film grain, acne, blemishes, detailed skin, detailed face , freckled , perfect face , athletic body, house background',
        width: 512,
        height: 768,
        cfg_scale: 8,
      }
    },
    {
      id: '3a267170-fb3d-4a00-8fef-c0fb7115511',
      title: 'Cute blondie in a night dress',
      creator: 'Archxngel',
      imageUrls: ['/discover/sample4.png'],
      likes: 134,
      isMultiImage: true,
      imageCount: 2,
      currentImageIndex: 1,
      params: {
        seed: 1583768832,
        prompt: 'cute blonde model, smiling, night dress, sitting in a chair, (medium shot: 1.2), photorealistic, (highly detailed face: 1.2), striking facial features, perfect tits exposed',
        width: 512,
        height: 768,
        cfg_scale: 8,
      }
    },
    {
      id: '0b1e4102-c49e-42c6-839f-9c4d09e904ac',
      title: 'Teen in a french maid dress',
      creator: 'Archxngel',
      imageUrls: ['/discover/sample2.png'],
      likes: 63,
      isMultiImage: true,
      imageCount: 2,
      currentImageIndex: 1,
      params: {
        seed: 1583768832,
        prompt: 'short, blonde, white teen, long blonde hair, french maid outfit in black, feather duster, in bedroom, cute face, blue eyes, dimples',
        width: 512,
        height: 768,
        cfg_scale: 8,
      }
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
    if (filter === 'popular') {
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

      {/* <Group justify="center" mb="md">
        <SegmentedControl
          value={filter}
          onChange={v => setFilter(v as "new" | "popular")}
          data={[
            { label: 'New', value: 'new' },
            { label: 'Popular', value: 'popular' },
            // { label: 'Hall of Fame', value: 'hall-of-fame' }
          ]}
          className={classes.segmentedControl}
          classNames={{
            indicator: classes.segmentedIndicator,
            root: classes.segmentedRoot,
            control: classes.segmentedControl,
            label: classes.segmentedLabel
          }}
        />
      </Group> */}

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