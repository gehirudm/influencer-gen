import { Group, Skeleton, Card, Stack, Text } from '@mantine/core';
import { GenJobCard } from '@/components/UserJobsExplorer/GenJobCard/GenJobCard';
import { useUserJobs } from '@/hooks/useUserJobs';
import { useEffect, useState } from 'react';
import classes from './UserJobsExplorer.module.css';

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
  const { jobs: userJobs, loading, error, deleteJob } = useUserJobs();

  // Get aspect ratio string from dimensions
  const getAspectRatioString = (width: number, height: number) => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  // Generate skeleton placeholders while loading
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Card radius="md" withBorder padding="lg" className={classes.card}>
        <Card.Section mb={10}>
          <Skeleton height={200} width="100%" />
        </Card.Section>
        <Skeleton height={20} width="30%" mb={10} />
        <Skeleton height={60} width="100%" mb={10} />
        <Skeleton height={30} width="60%" mb={10} />
      </Card>
    ));
  };

  if (error) {
    return <Text color="red">Error loading jobs: {error}</Text>;
  }

  return (
    <Group
      gap="md"
      align='start'
      className={classes.jobsContainer}
    >
      {loading ? (
        renderSkeletons()
      ) : (
        userJobs.map((job) => {
          // Calculate aspect ratio string
          const width = job.metadata?.width || 512;
          const height = job.metadata?.height || 512;
          const aspectRatio = getAspectRatioString(width, height);

          return (
            <GenJobCard
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
            />
          );
        })
      )}
    </Group>
  );
}