"use client";

import { useState, useCallback, useEffect } from 'react';
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    where,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    runTransaction
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';
import { useUserData } from './useUserData';

// LoRA data interface
export interface LoRAData {
    id: string;
    displayName: string;
    loraName: string;
    keyword: string;
    description: string;
    thumbnailUrl: string;
    displayImageUrls: string[];
    createdAt: string;
    assignedUserId: string | null;
    isPublic: boolean;
    isFree: boolean;
    isLimitedEdition: boolean;
    availableQuantity: number | null;
    purchasedCount: number;
    price: number | null;
}

interface UseUserLorasReturn {
    userLoras: LoRAData[];
    marketplaceLoras: LoRAData[];
    purchasedLoras: LoRAData[];
    loading: boolean;
    loadingMarketplace: boolean;
    error: string | null;
    fetchUserLoras: () => Promise<void>;
    fetchMarketplaceLoras: () => Promise<void>;
    purchaseLora: (loraId: string) => Promise<{ success: boolean; error?: string }>;
    hasLora: (loraId: string) => boolean;
}

export function useUserLoras(): UseUserLorasReturn {
    const { user, systemData } = useUserData();
    const [userLoras, setUserLoras] = useState<LoRAData[]>([]);
    const [marketplaceLoras, setMarketplaceLoras] = useState<LoRAData[]>([]);
    const [purchasedLoras, setPurchasedLoras] = useState<LoRAData[]>([]);
    const [purchasedLoraIds, setPurchasedLoraIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMarketplace, setLoadingMarketplace] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch LoRAs assigned to the current user
    const fetchUserLoras = useCallback(async () => {
        if (!user) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const db = getFirestore(app);

            // Fetch directly assigned LoRAs
            const lorasRef = collection(db, 'loras');
            const assignedQuery = query(
                lorasRef,
                where('assignedUserId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const assignedSnapshot = await getDocs(assignedQuery);

            const assignedLoras: LoRAData[] = [];
            assignedSnapshot.forEach((doc) => {
                assignedLoras.push({
                    id: doc.id,
                    ...doc.data()
                } as LoRAData);
            });

            // Fetch user's purchased LoRAs
            const purchasesRef = collection(db, 'user-lora-purchases');
            const purchasesQuery = query(
                purchasesRef,
                where('userId', '==', user.uid)
            );
            const purchasesSnapshot = await getDocs(purchasesQuery);

            const purchasedIds = new Set<string>();
            purchasesSnapshot.forEach((doc) => {
                purchasedIds.add(doc.data().loraId);
            });
            setPurchasedLoraIds(purchasedIds);

            // Fetch the actual purchased LoRA documents
            const purchasedLorasList: LoRAData[] = [];
            for (const loraId of purchasedIds) {
                const loraDoc = await getDoc(doc(db, 'loras', loraId));
                if (loraDoc.exists()) {
                    purchasedLorasList.push({
                        id: loraDoc.id,
                        ...loraDoc.data()
                    } as LoRAData);
                }
            }

            setUserLoras(assignedLoras);
            setPurchasedLoras(purchasedLorasList);
        } catch (err: any) {
            console.error('Error fetching user LoRAs:', err);
            setError('Failed to load your LoRAs');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch public LoRAs for marketplace
    const fetchMarketplaceLoras = useCallback(async () => {
        try {
            setLoadingMarketplace(true);

            const db = getFirestore(app);
            const lorasRef = collection(db, 'loras');
            const marketplaceQuery = query(
                lorasRef,
                where('isPublic', '==', true),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(marketplaceQuery);

            const lorasList: LoRAData[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Filter out sold-out limited editions
                if (data.isLimitedEdition && data.availableQuantity !== null) {
                    if (data.purchasedCount >= data.availableQuantity) {
                        return; // Skip sold out items
                    }
                }
                lorasList.push({
                    id: doc.id,
                    ...data
                } as LoRAData);
            });

            setMarketplaceLoras(lorasList);
        } catch (err: any) {
            console.error('Error fetching marketplace LoRAs:', err);
        } finally {
            setLoadingMarketplace(false);
        }
    }, []);

    // Purchase a LoRA from the marketplace
    const purchaseLora = useCallback(async (loraId: string) => {
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            const db = getFirestore(app);
            const loraRef = doc(db, 'loras', loraId);

            // Use transaction for atomic operations
            const result = await runTransaction(db, async (transaction) => {
                const loraDoc = await transaction.get(loraRef);

                if (!loraDoc.exists()) {
                    throw new Error('LoRA not found');
                }

                const loraData = loraDoc.data();

                // Check if already purchased
                if (purchasedLoraIds.has(loraId)) {
                    throw new Error('You already own this LoRA');
                }

                // Check if public
                if (!loraData.isPublic) {
                    throw new Error('This LoRA is not available for purchase');
                }

                // Check availability for limited editions
                if (loraData.isLimitedEdition && loraData.availableQuantity !== null) {
                    if (loraData.purchasedCount >= loraData.availableQuantity) {
                        throw new Error('This LoRA is sold out');
                    }
                }

                // Check if user has enough tokens (for paid LoRAs)
                if (!loraData.isFree && loraData.price) {
                    const userTokens = systemData?.tokens || 0;
                    if (userTokens < loraData.price) {
                        throw new Error(`Insufficient tokens. You need ${loraData.price} tokens.`);
                    }

                    // Deduct tokens from user
                    const userSystemRef = doc(db, 'users', user.uid, 'private', 'system');
                    transaction.update(userSystemRef, {
                        tokens: increment(-loraData.price)
                    });
                }

                // Update LoRA purchased count
                transaction.update(loraRef, {
                    purchasedCount: increment(1)
                });

                // Create purchase record
                const purchaseId = `${user.uid}_${loraId}`;
                const purchaseRef = doc(db, 'user-lora-purchases', purchaseId);
                transaction.set(purchaseRef, {
                    userId: user.uid,
                    loraId: loraId,
                    purchasedAt: new Date().toISOString(),
                    price: loraData.isFree ? 0 : loraData.price
                });

                return loraData;
            });

            // Update local state
            setPurchasedLoraIds(prev => new Set([...prev, loraId]));

            // Add to purchased loras list
            const purchasedLora: LoRAData = {
                id: loraId,
                ...result
            } as LoRAData;
            setPurchasedLoras(prev => [purchasedLora, ...prev]);

            // Remove from marketplace if limited and now sold out
            if (result.isLimitedEdition && result.availableQuantity !== null) {
                if (result.purchasedCount + 1 >= result.availableQuantity) {
                    setMarketplaceLoras(prev => prev.filter(l => l.id !== loraId));
                }
            }

            return { success: true };
        } catch (err: any) {
            console.error('Error purchasing LoRA:', err);
            return { success: false, error: err.message || 'Failed to purchase LoRA' };
        }
    }, [user, systemData, purchasedLoraIds]);

    // Check if user has access to a LoRA (assigned or purchased)
    const hasLora = useCallback((loraId: string) => {
        const isAssigned = userLoras.some(l => l.id === loraId);
        const isPurchased = purchasedLoraIds.has(loraId);
        return isAssigned || isPurchased;
    }, [userLoras, purchasedLoraIds]);

    // Auto-fetch user LoRAs when user changes
    useEffect(() => {
        if (user) {
            fetchUserLoras();
        }
    }, [user, fetchUserLoras]);

    return {
        userLoras,
        marketplaceLoras,
        purchasedLoras,
        loading,
        loadingMarketplace,
        error,
        fetchUserLoras,
        fetchMarketplaceLoras,
        purchaseLora,
        hasLora,
    };
}
