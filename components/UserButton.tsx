import { IconCoin } from '@tabler/icons-react';
import { Avatar, Group, Text, UnstyledButton, Skeleton } from '@mantine/core';
import classes from './UserButton.module.css';
import { useUserData } from '@/hooks/useUserData';

interface UserButtonProps {
  onClick?: () => void;
}

export function UserButton({ onClick }: UserButtonProps) {
  const { userData, systemData, loading, error } = useUserData();

  // Show loading state
  if (loading || error || !userData) {
    return (
      <UnstyledButton className={classes.user} onClick={onClick}>
        <Group>
          <Skeleton height={38} circle />
          <div style={{ flex: 1 }}>
            <Skeleton height={12} width="70%" mb={8} />
            <Skeleton height={10} width="40%" mb={8} />
            <Skeleton height={10} width="30%" />
          </div>
        </Group>
      </UnstyledButton>
    );
  }

  return (
    <UnstyledButton className={classes.user} onClick={onClick}>
      <Group>
        <Avatar
          src={userData.avatarUrl || undefined}
          radius="xl"
        />

        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {userData.displayName || 'User'}
          </Text>

          <Text c="dimmed" size="xs">
            {userData.email || ''}
          </Text>

          <Group gap={2}>
            <IconCoin size={16} color="var(--mantine-color-yellow-3)" stroke={2}/>
            <Text ml={2} size="xs">
              {systemData?.tokens || 0} Tokens
            </Text>
          </Group>
        </div>
      </Group>
    </UnstyledButton>
  );
}