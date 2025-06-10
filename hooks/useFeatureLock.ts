import { useUserData } from '@/hooks/useUserData';
import { FeatureId, SUBSCRIPTION_FEATURES } from '@/lib/subscriptions';
import { useMemo } from 'react';

export function useFeatureAccess(featureId: FeatureId): {
	isAvailable: boolean;
	loading: boolean;
	error: string | null;
} {
	const { systemData, loading, error } = useUserData();

	const isAvailable = useMemo(() => {
		if (loading || error || !systemData) return false;

		if (systemData.isAdmin) return true;

		const tier = systemData.subscription_tier || 'free';
		const features = SUBSCRIPTION_FEATURES[tier] ?? SUBSCRIPTION_FEATURES.free;

		return features.includes(featureId);
	}, [featureId, systemData, loading, error]);

	return { isAvailable, loading, error };
}