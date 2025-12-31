"use client";

import { useState, useCallback } from 'react';
import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    deleteDoc,
    setDoc,
    updateDoc,
    getDoc,
    serverTimestamp,
    where
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll,
    getStorage
} from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';
import { getFileExtension } from '@/lib/util';

// LoRA form data for creating/editing
export interface LoRAFormData {
    displayName: string;
    loraName: string;
    keyword: string;
    description: string;
    thumbnailImage?: File;
    displayImages?: File[];
    assignedUserId: string | null;
    isPublic: boolean;
    isFree: boolean;
    isLimitedEdition: boolean;
    availableQuantity: number | null;
    price: number | null;
}

// LoRA data as stored in Firestore
export interface LoRAData {
    id: string;
    displayName: string;
    loraName: string;
    keyword: string;
    description: string;
    thumbnailImageId: string;
    displayImageIds: string[];
    thumbnailUrl: string;
    displayImageUrls: string[];
    createdAt: string;
    createdBy: string;
    assignedUserId: string | null;
    isPublic: boolean;
    isFree: boolean;
    isLimitedEdition: boolean;
    availableQuantity: number | null;
    purchasedCount: number;
    price: number | null;
}

// Simple user data for assignment dropdown
export interface SimpleUserData {
    id: string;
    displayName: string | null;
    email: string | null;
    username: string | null;
}

interface UseLoRAManagementReturn {
    loras: LoRAData[];
    users: SimpleUserData[];
    loading: boolean;
    loadingUsers: boolean;
    error: string | null;
    fetchLoras: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    createLora: (data: LoRAFormData) => Promise<{ success: boolean; loraId?: string; error?: string }>;
    updateLora: (loraId: string, data: Partial<LoRAFormData>) => Promise<{ success: boolean; error?: string }>;
    deleteLora: (loraId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useLoRAManagement(): UseLoRAManagementReturn {
    const [loras, setLoras] = useState<LoRAData[]>([]);
    const [users, setUsers] = useState<SimpleUserData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all LoRAs
    const fetchLoras = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const db = getFirestore(app);
            const lorasRef = collection(db, 'loras');
            const q = query(lorasRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const lorasList: LoRAData[] = [];
            querySnapshot.forEach((doc) => {
                lorasList.push({
                    id: doc.id,
                    ...doc.data()
                } as LoRAData);
            });

            setLoras(lorasList);
        } catch (err: any) {
            console.error('Error fetching LoRAs:', err);
            setError('Failed to load LoRAs');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch users for assignment dropdown
    const fetchUsers = useCallback(async () => {
        try {
            setLoadingUsers(true);

            const db = getFirestore(app);
            const usersRef = collection(db, 'users');
            const querySnapshot = await getDocs(usersRef);

            const usersList: SimpleUserData[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                usersList.push({
                    id: doc.id,
                    displayName: data.displayName || null,
                    email: data.email || null,
                    username: data.username || null,
                });
            });

            setUsers(usersList);
        } catch (err: any) {
            console.error('Error fetching users:', err);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    // Upload images for a LoRA
    const uploadLoraImages = async (
        loraId: string,
        thumbnailImage?: File,
        displayImages?: File[]
    ): Promise<{
        thumbnailImageId: string;
        thumbnailUrl: string;
        displayImageIds: string[];
        displayImageUrls: string[];
    }> => {
        const storage = getStorage(app);
        let thumbnailImageId = '';
        let thumbnailUrl = '';
        const displayImageIds: string[] = [];
        const displayImageUrls: string[] = [];

        // Upload thumbnail
        if (thumbnailImage) {
            const imageId = crypto.randomUUID();
            const fileExtension = getFileExtension(thumbnailImage.name, thumbnailImage.type);
            thumbnailImageId = `${imageId}.${fileExtension}`;

            const imageRef = ref(storage, `lora-images/${loraId}/thumbnail/${thumbnailImageId}`);
            await uploadBytes(imageRef, thumbnailImage, {
                contentType: thumbnailImage.type,
                customMetadata: {
                    'originalName': thumbnailImage.name,
                    'uploadedAt': new Date().toISOString(),
                }
            });

            thumbnailUrl = await getDownloadURL(imageRef);
        }

        // Upload display images
        if (displayImages && displayImages.length > 0) {
            for (const image of displayImages) {
                const imageId = crypto.randomUUID();
                const fileExtension = getFileExtension(image.name, image.type);
                const fullImageId = `${imageId}.${fileExtension}`;

                const imageRef = ref(storage, `lora-images/${loraId}/display/${fullImageId}`);
                await uploadBytes(imageRef, image, {
                    contentType: image.type,
                    customMetadata: {
                        'originalName': image.name,
                        'uploadedAt': new Date().toISOString(),
                    }
                });

                const url = await getDownloadURL(imageRef);
                displayImageIds.push(fullImageId);
                displayImageUrls.push(url);
            }
        }

        return { thumbnailImageId, thumbnailUrl, displayImageIds, displayImageUrls };
    };

    // Delete all images for a LoRA
    const deleteLoraImages = async (loraId: string) => {
        const storage = getStorage(app);

        try {
            // Delete thumbnail folder
            const thumbnailFolderRef = ref(storage, `lora-images/${loraId}/thumbnail`);
            const thumbnailList = await listAll(thumbnailFolderRef);
            for (const item of thumbnailList.items) {
                await deleteObject(item);
            }

            // Delete display folder
            const displayFolderRef = ref(storage, `lora-images/${loraId}/display`);
            const displayList = await listAll(displayFolderRef);
            for (const item of displayList.items) {
                await deleteObject(item);
            }
        } catch (err) {
            console.error('Error deleting LoRA images:', err);
            // Don't throw - images may not exist
        }
    };

    // Create a new LoRA
    const createLora = useCallback(async (data: LoRAFormData) => {
        try {
            const auth = getAuth(app);
            const currentUser = auth.currentUser;

            if (!currentUser) {
                return { success: false, error: 'Authentication required' };
            }

            const db = getFirestore(app);
            const loraId = doc(collection(db, 'loras')).id;

            // Upload images
            const { thumbnailImageId, thumbnailUrl, displayImageIds, displayImageUrls } =
                await uploadLoraImages(loraId, data.thumbnailImage, data.displayImages);

            // Create LoRA document
            const loraData = {
                displayName: data.displayName,
                loraName: data.loraName,
                keyword: data.keyword,
                description: data.description,
                thumbnailImageId,
                displayImageIds,
                thumbnailUrl,
                displayImageUrls,
                createdAt: new Date().toISOString(),
                createdBy: currentUser.uid,
                assignedUserId: data.assignedUserId,
                isPublic: data.isPublic,
                isFree: data.isFree,
                isLimitedEdition: data.isLimitedEdition,
                availableQuantity: data.availableQuantity,
                purchasedCount: 0,
                price: data.price,
            };

            const loraRef = doc(db, 'loras', loraId);
            await setDoc(loraRef, loraData);

            // Update local state
            setLoras(prev => [{
                id: loraId,
                ...loraData
            }, ...prev]);

            return { success: true, loraId };
        } catch (err: any) {
            console.error('Error creating LoRA:', err);
            return { success: false, error: err.message || 'Failed to create LoRA' };
        }
    }, []);

    // Update an existing LoRA
    const updateLora = useCallback(async (loraId: string, data: Partial<LoRAFormData>) => {
        try {
            const db = getFirestore(app);
            const loraRef = doc(db, 'loras', loraId);

            // Get existing LoRA data
            const loraSnap = await getDoc(loraRef);
            if (!loraSnap.exists()) {
                return { success: false, error: 'LoRA not found' };
            }

            const updateData: Partial<LoRAData> = {};

            // Update text fields
            if (data.displayName !== undefined) updateData.displayName = data.displayName;
            if (data.loraName !== undefined) updateData.loraName = data.loraName;
            if (data.keyword !== undefined) updateData.keyword = data.keyword;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.assignedUserId !== undefined) updateData.assignedUserId = data.assignedUserId;
            if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
            if (data.isFree !== undefined) updateData.isFree = data.isFree;
            if (data.isLimitedEdition !== undefined) updateData.isLimitedEdition = data.isLimitedEdition;
            if (data.availableQuantity !== undefined) updateData.availableQuantity = data.availableQuantity;
            if (data.price !== undefined) updateData.price = data.price;

            // Handle new thumbnail upload
            if (data.thumbnailImage) {
                const { thumbnailImageId, thumbnailUrl } =
                    await uploadLoraImages(loraId, data.thumbnailImage);
                updateData.thumbnailImageId = thumbnailImageId;
                updateData.thumbnailUrl = thumbnailUrl;
            }

            // Handle new display images (append to existing)
            if (data.displayImages && data.displayImages.length > 0) {
                const { displayImageIds, displayImageUrls } =
                    await uploadLoraImages(loraId, undefined, data.displayImages);
                const existingData = loraSnap.data();
                updateData.displayImageIds = [...(existingData.displayImageIds || []), ...displayImageIds];
                updateData.displayImageUrls = [...(existingData.displayImageUrls || []), ...displayImageUrls];
            }

            await updateDoc(loraRef, updateData);

            // Update local state
            setLoras(prev => prev.map(lora =>
                lora.id === loraId ? { ...lora, ...updateData } : lora
            ));

            return { success: true };
        } catch (err: any) {
            console.error('Error updating LoRA:', err);
            return { success: false, error: err.message || 'Failed to update LoRA' };
        }
    }, []);

    // Delete a LoRA
    const deleteLora = useCallback(async (loraId: string) => {
        try {
            const db = getFirestore(app);
            const loraRef = doc(db, 'loras', loraId);

            // Check if LoRA exists
            const loraSnap = await getDoc(loraRef);
            if (!loraSnap.exists()) {
                return { success: false, error: 'LoRA not found' };
            }

            // Delete images from storage
            await deleteLoraImages(loraId);

            // Delete document
            await deleteDoc(loraRef);

            // Update local state
            setLoras(prev => prev.filter(lora => lora.id !== loraId));

            return { success: true };
        } catch (err: any) {
            console.error('Error deleting LoRA:', err);
            return { success: false, error: err.message || 'Failed to delete LoRA' };
        }
    }, []);

    return {
        loras,
        users,
        loading,
        loadingUsers,
        error,
        fetchLoras,
        fetchUsers,
        createLora,
        updateLora,
        deleteLora,
    };
}
