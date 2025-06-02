'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Container, 
  Grid, 
  Card, 
  Text, 
  Group, 
  Badge, 
  Stack, 
  Title, 
  Divider, 
  Skeleton, 
  Paper, 
  Button,
  ActionIcon,
  CopyButton,
  Tooltip,
  Box
} from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { 
  IconCheck, 
  IconCopy, 
  IconDownload, 
  IconShare, 
  IconClock, 
  IconAspectRatio, 
  IconStack2, 
  IconWand, 
  IconPhoto, 
  IconArrowBack,
  IconEditCircle
} from '@tabler/icons-react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import classes from './ViewJob.module.css';

export default function ViewGeneratedImagePage() {
  const { jobId } = useParams();
  const [job, setJob] = useState<ImageGenerationJob & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [downloadUrls, setDownloadUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId) return;
      
      try {
        const db = getFirestore(app);
        const jobRef = doc(db, 'jobs', jobId as string);
        const jobDoc = await getDoc(jobRef);
        
        if (!jobDoc.exists()) {
          notifications.show({
            title: 'Error',
            message: 'Job not found',
            color: 'red',
          });
          setLoading(false);
          return;
        }
        
        const jobData = { ...jobDoc.data(), id: jobDoc.id } as unknown as ImageGenerationJob & { id: string };
        setJob(jobData);
        
        // Fetch download URLs for the images
        if (jobData.imageIds && jobData.imageIds.length > 0) {
          const storage = getStorage(app);
          const urls = await Promise.all(
            jobData.imageIds.map(async (imageId: string) => {
              const imageRef = ref(storage, `generated-images/${jobData.userId}/${imageId}.png`);
              return getDownloadURL(imageRef);
            })
          );
          setDownloadUrls(urls);
        }
      } catch (error) {
        console.error('Error fetching job data:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load job data',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobData();
  }, [jobId]);

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `generated-image-${job?.id}-${index}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Error downloading image:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to download image',
        color: 'red',
      });
    }
  };

  // Format the generation time in seconds
  const formatGenerationTime = (time: number | null | undefined) => {
    if (!time) return 'N/A';
    return `${(time / 1000).toFixed(1)}s`;
  };

  // Get aspect ratio string from dimensions
  const getAspectRatioString = (width?: number, height?: number) => {
    if (!width || !height) return 'N/A';
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  return (
    <Container size="xl" py="xl">
      <Group mb="md">
        <Button 
          component={Link} 
          href="/create" 
          variant="subtle" 
          leftSection={<IconArrowBack size={16} />}
        >
          Back to Generator
        </Button>
      </Group>

      <Grid gutter="xl">
        {/* Left side - Image Carousel */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card radius="lg" withBorder shadow="md" padding="lg" className={classes.carouselCard}>
            {loading ? (
              <Skeleton height={500} radius="md" />
            ) : downloadUrls.length > 0 ? (
              <>
                <Carousel
                  withIndicators
                  height={500}
                  loop
                  classNames={{
                    root: classes.carousel,
                    controls: classes.carouselControls,
                    indicator: classes.carouselIndicator,
                  }}
                  onSlideChange={setActiveImageIndex}
                >
                  {downloadUrls.map((url, index) => (
                    <Carousel.Slide key={index}>
                      <div className={classes.imageContainer}>
                        <img 
                          src={url} 
                          alt={`Generated image ${index + 1}`} 
                          className={classes.carouselImage}
                        />
                        <div className={classes.imageOverlay}>
                          <Group>
                            <Tooltip label="Download">
                              <ActionIcon 
                                variant="filled" 
                                color="dark" 
                                size="lg" 
                                radius="xl"
                                onClick={() => handleDownload(url, index)}
                              >
                                <IconDownload size={20} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Share">
                              <ActionIcon 
                                variant="filled" 
                                color="dark" 
                                size="lg" 
                                radius="xl"
                              >
                                <IconShare size={20} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </div>
                      </div>
                    </Carousel.Slide>
                  ))}
                </Carousel>
                
                <Group mt="md" justify="center">
                  {downloadUrls.map((_, index) => (
                    <Paper
                      key={index}
                      className={classes.thumbnailContainer}
                      style={{
                        borderColor: activeImageIndex === index ? 'var(--mantine-color-blue-6)' : undefined,
                      }}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img 
                        src={downloadUrls[index]} 
                        alt={`Thumbnail ${index + 1}`} 
                        className={classes.thumbnail}
                      />
                    </Paper>
                  ))}
                </Group>
              </>
            ) : (
              <Text ta="center" c="dimmed" py="xl">No images available</Text>
            )}
          </Card>
        </Grid.Col>

        {/* Right side - Job Details */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card radius="lg" withBorder shadow="md" padding="lg">
            <Stack>
              <Group justify="space-between">
                <Title order={3}>Image Generation Details</Title>
                <Badge size="lg" color={job?.status === 'COMPLETED' ? 'green' : 'blue'}>
                  {job?.status || 'Loading...'}
                </Badge>
              </Group>

              <Divider />

              <Stack gap="xs">
                <Title order={4}>Prompt</Title>
                <Paper p="md" withBorder radius="md" bg="dark.8">
                  {loading ? (
                    <Skeleton height={60} />
                  ) : (
                    <Group justify="space-between" wrap="nowrap">
                      <Text>{job?.metadata?.prompt || 'No prompt available'}</Text>
                      <CopyButton value={job?.metadata?.prompt || ''}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? 'Copied' : 'Copy'}>
                            <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Group>
                  )}
                </Paper>

                {job?.metadata?.neg_prompt && (
                  <>
                    <Title order={4}>Negative Prompt</Title>
                    <Paper p="md" withBorder radius="md" bg="dark.8">
                      <Group justify="space-between" wrap="nowrap">
                        <Text>{job.metadata.neg_prompt}</Text>
                        <CopyButton value={job.metadata.neg_prompt}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied' : 'Copy'}>
                              <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Group>
                    </Paper>
                  </>
                )}
              </Stack>

              <Divider />

              <Title order={4}>Generation Settings</Title>
              <Grid>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <IconClock size={18} color="var(--mantine-color-yellow-6)" />
                    <Text fw={500}>Generation Time:</Text>
                  </Group>
                  <Text pl={26}>{formatGenerationTime(job?.executionTime)}</Text>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Group gap="xs">
                    <IconAspectRatio size={18} color="var(--mantine-color-blue-6)" />
                    <Text fw={500}>Dimensions:</Text>
                  </Group>
                  <Text pl={26}>
                    {job?.metadata?.width || 'N/A'} × {job?.metadata?.height || 'N/A'}
                  </Text>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Group gap="xs">
                    <IconStack2 size={18} color="var(--mantine-color-green-6)" />
                    <Text fw={500}>Batch Size:</Text>
                  </Group>
                  <Text pl={26}>{job?.metadata?.batch_size || 'N/A'}</Text>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Group gap="xs">
                    <IconPhoto size={18} color="var(--mantine-color-red-6)" />
                    <Text fw={500}>Aspect Ratio:</Text>
                  </Group>
                  <Text pl={26}>
                    {getAspectRatioString(job?.metadata?.width, job?.metadata?.height)}
                  </Text>
                </Grid.Col>

                {job?.metadata?.n_samples && (
                  <Grid.Col span={6}>
                    <Group gap="xs">
                      <IconStack2 size={18} color="var(--mantine-color-indigo-6)" />
                      <Text fw={500}>Steps:</Text>
                    </Group>
                    <Text pl={26}>{job.metadata.n_samples}</Text>
                  </Grid.Col>
                )}

                {job?.metadata?.cfg && (
                  <Grid.Col span={6}>
                    <Group gap="xs">
                      <IconStack2 size={18} color="var(--mantine-color-orange-6)" />
                      <Text fw={500}>CFG Scale:</Text>
                    </Group>
                    <Text pl={26}>{job.metadata.cfg}</Text>
                  </Grid.Col>
                )}

                {job?.metadata?.seed && (
                  <Grid.Col span={6}>
                    <Group gap="xs">
                      <IconStack2 size={18} color="var(--mantine-color-cyan-6)" />
                      <Text fw={500}>Seed:</Text>
                    </Group>
                    <Text pl={26}>{job.metadata.seed}</Text>
                  </Grid.Col>
                )}
              </Grid>

              <Divider />

              <Group justify="center" mt="md">
                <Button 
                  variant="light" 
                  leftSection={<IconWand size={16} />}
                  component={Link}
                  href={`/create?recreate=${job?.id}`}
                >
                  Recreate with these settings
                </Button>
                <Button 
                  variant="outline" 
                  leftSection={<IconEditCircle size={16} />}
                  component={Link}
                  href={`/create?inpaint=${job?.id}`}
                >
                  Inpaint this image
                </Button>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}