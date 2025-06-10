import { Group, Skeleton, Card, Stack, Text, SegmentedControl, Select, Box, Center, Loader, Paper } from '@mantine/core';
import { GenJobCard } from '@/components/UserJobsExplorer/GenJobCard/GenJobCard';
import { useUserJobs } from '@/hooks/useUserJobs';
import { useEffect, useState, useRef, useCallback } from 'react';
import classes from './UserJobsExplorer.module.css';
import { IconChevronDown } from '@tabler/icons-react';
import { GenJobCardWithPreview } from './GenJobCardWithPreview/GenJobCardWithPreview';

interface UserJobsExplorerProps {
  userProjects: (UserProject & { id: string })[];
  onEdit: (jobId: string) => void;
  onRecreate: (job: any) => void;
  onInpaint: (job: any) => void;
  onAddToProject: (job: any) => void;
  onRecheckStatus: (jobId: string, newStatus?: string) => void;
}

export function UserJobsExplorer({
  userProjects,
  onEdit,
  onRecreate,
  onInpaint,
  onAddToProject,
  onRecheckStatus
}: UserJobsExplorerProps) {
  const {
    jobs: userJobs,
    loading,
    loadingMore,
    error,
    hasMore,
    deleteJob,
    loadMoreJobs,
    sortOrder,
    changeSortOrder
  } = useUserJobs();

  const [activeTab, setActiveTab] = useState('History');
  const [itemsPerPage, setItemsPerPage] = useState('25');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>();

  const observer = useRef<IntersectionObserver | null>(null);
  const lastJobElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreJobs();
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, loadMoreJobs]);

  // Get aspect ratio string from dimensions
  const getAspectRatioString = (width: number, height: number) => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  // Generate skeleton placeholders while loading
  const renderSkeletons = () => {
    return Array(8).fill(0).map((_, index) => (
      <Card key={`skeleton-${index}`} radius="md" withBorder padding="lg" className={classes.card}>
        <Card.Section mb={10}>
          <Skeleton height={200} width="100%" />
        </Card.Section>
        <Card.Section>
          <Group px={10} py={5} align='center' justify='space-between'>
            <Group>
              <Skeleton height={30} width={30} mb={10} />
              <Skeleton height={30} width={30} mb={10} />
            </Group>
            <Skeleton height={30} width={30} mb={10} />
          </Group>
        </Card.Section>
      </Card>
    ));
  };

  if (error) {
    return <Text color="red">Error loading jobs: {error}</Text>;
  }

  return (
    <Stack gap="md">
      {/* Navigation tabs */}
      <SegmentedControl
        value={activeTab}
        onChange={setActiveTab}
        data={[
          { label: 'History', value: 'History' },
          { label: 'Projects', value: 'Projects' },
          { label: 'Collected', value: 'Collected' },
          { label: 'Posts', value: 'Posts' },
        ]}
        className={classes.segmentedControl}
        classNames={{
          indicator: classes.segmentedIndicator,
          root: classes.segmentedRoot,
          control: classes.segmentedControl,
          label: classes.segmentedLabel
        }}
      />

      {/* Filters and controls */}
      <Paper p="md" radius="md" className={classes.controlsContainer}>
        <Group justify="space-between" align="center">

          <Group gap="md">
            <Group gap="xs">
              <Box className={classes.paginationControl}>
                <IconChevronDown size={18} className={classes.paginationArrow} />
                <Text className={classes.paginationNumber}>1</Text>
                <IconChevronDown size={18} className={classes.paginationArrow} style={{ transform: 'rotate(180deg)' }} />
              </Box>
            </Group>

            <Group gap="xs">
              <Text size="sm">Show</Text>
              <Select
                value={itemsPerPage}
                onChange={(value) => setItemsPerPage(value || '25')}
                data={['10', '25', '50', '100']}
                w={80}
                rightSection={<IconChevronDown size={16} />}
              />
            </Group>

            <Group gap="xs">
              <Text size="sm">Sort By</Text>
              <Select
                value={sortOrder}
                onChange={(value) => changeSortOrder(value as 'newest' | 'oldest')}
                data={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' }
                ]}
                w={120}
                rightSection={<IconChevronDown size={16} />}
              />
            </Group>

            <Group gap="xs">
              <Text size="sm">Character</Text>
              <Select
                value={selectedCharacter}
                onChange={(char) => setSelectedCharacter(char)}
                data={['Character Name', 'All Characters']}
                w={180}
                rightSection={<IconChevronDown size={16} />}
              />
            </Group>
          </Group>
        </Group>
      </Paper>

      {/* Jobs grid */}
      <Group
        gap="md"
        align='start'
        className={classes.jobsContainer}
      >
        {loading ? (
          renderSkeletons()
        ) : userJobs.length === 0 ? (
          <Center w="100%" p="xl">
            <Text size="lg" c="dimmed">No jobs found</Text>
          </Center>
        ) : (
          userJobs.map((job, index) => {
            // Calculate aspect ratio string
            const width = job.metadata?.width || 512;
            const height = job.metadata?.height || 512;
            const aspectRatio = getAspectRatioString(width, height);

            // Add ref to last element for infinite scrolling
            const isLastElement = index === userJobs.length - 1;

            console.log(job.imageUrls)

            return (
              <div
                key={job.id}
                ref={isLastElement ? lastJobElementRef : null}
              >
                {/* <GenJobCard
                  jobId={job.id}
                  prompt={job.metadata?.prompt || ""}
                  status={job.status}
                  imageUrls={job.imageUrls?.map(url => url.privateUrl) || []}
                  generationTime={job.executionTime ? job.executionTime / 1000 : undefined}
                  dimensions={{ width, height }}
                  aspectRatio={aspectRatio}
                  batchSize={job.metadata?.batch_size || 1}
                  userProjects={userProjects}
                  onEdit={() => onEdit(job.id)}
                  onRecreate={() => onRecreate(job)}
                  onInpaint={() => onInpaint(job)}
                  onAddToProject={() => onAddToProject(job)}
                  onRecheckStatus={(jobId, newStatus) => onRecheckStatus(jobId, newStatus)}
                  onDelete={() => deleteJob(job.id)}
                /> */}
                <GenJobCardWithPreview
                  // jobId={job.id}
                  // prompt={job.metadata?.prompt || ""}
                  // status={job.status}
                  imageUrls={job.imageUrls ? job.imageUrls.map(url => url.publicUrl) : []}
                  // generationTime={job.executionTime ? job.executionTime / 1000 : undefined}
                  // dimensions={{ width, height }}
                  // aspectRatio={aspectRatio}
                  // batchSize={job.metadata?.batch_size || 1}
                  // userProjects={userProjects}
                  // onEdit={() => onEdit(job.id)}
                  // onRecreate={() => onRecreate(job)}
                  onInpaint={() => onInpaint(job)}
                  onAddToProject={() => onAddToProject(job)}
                  // onRecheckStatus={(jobId, newStatus) => onRecheckStatus(jobId, newStatus)}
                  onDelete={() => deleteJob(job.id)}
                />
              </div>
            );
          })
        )}
      </Group>

      {/* Loading more indicator */}
      {loadingMore && (
        <Center p="md">
          <Group>
            <Loader size="sm" />
            <Text>Loading more images...</Text>
          </Group>
        </Center>
      )}

      {/* End of results message */}
      {!loading && !loadingMore && userJobs.length > 0 && !hasMore && (
        <Center p="md">
          <Text c="dimmed">No more images to load</Text>
        </Center>
      )}
    </Stack>
  );
}