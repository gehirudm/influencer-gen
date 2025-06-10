import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureLock';
import { Button, Text, Stack, Group, Loader } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FeatureDisplayNames, FeatureId, getSubscriptionTierForFeature } from '@/lib/subscriptions';

interface FeatureLockProps {
    featureId: FeatureId;
    children: React.ReactNode;
    message?: string;
}

/**
 * Component that wraps content and shows an overlay with upgrade prompt if the feature is locked
 */
export function FeatureLock({ featureId, children, message }: FeatureLockProps) {
    const { isAvailable, loading } = useFeatureAccess(featureId);
    // const { isAvailable, loading } = { isAvailable: false, loading: true };
    const router = useRouter();

    // Get the required subscription tier for this feature
    const requiredTier = getSubscriptionTierForFeature(featureId);
    const featureName = FeatureDisplayNames[featureId];

    // Custom message or default
    const displayMessage = message || `Upgrade to ${requiredTier} to access ${featureName}`;

    if (isAvailable) return children;

    // If feature is locked, render children with overlay
    return (
        <div className="relative">
            {/* Original content with blur */}
            <div className="filter blur-sm pointer-events-none">
                {children}
            </div>

            {/* Overlay with upgrade message */}
            <div
                className="absolute inset-0 bg-opacity-50 flex items-center justify-center"
                style={{ backdropFilter: 'blur(4px)' }}
            >
                <Stack align="center" gap="md" p="xl" className="max-w-md text-center">
                    {loading ?
                        <Loader size="xl" /> :
                        <>
                            <Group gap="xs">
                                <IconLock size={24} className="text-blue-500" />
                                <Text size="xl" fw={600} className="text-white">
                                    Feature Locked
                                </Text>
                            </Group>

                            <Text className="text-white" size="md">
                                {displayMessage}
                            </Text>

                            <Button
                                size="md"
                                color="var(--mantine-color-blue-500)"
                                onClick={() => router.push('/pricing')}
                                className="mt-4"
                            >
                                View Pricing Plans
                            </Button>
                        </>
                    }
                </Stack>
            </div>
        </div>
    );
}