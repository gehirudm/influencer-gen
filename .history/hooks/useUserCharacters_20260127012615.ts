"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    deleteDoc,
    addDoc,
    serverTimestamp,
    getDoc,
    getFirestore,
    updateDoc,
    onSnapshot,
    setDoc
} from 'firebase/firestore';
import {
    ref,
    listAll,
    getDownloadURL,
    uploadBytes,
    deleteObject,
    getStorage
} from 'firebase/storage';
import { useUserData } from './useUserData';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';
import { deleteCharacterImages, getCharacterImageUrls } from '@/app/actions/character/character-images';
import { getFileExtension } from '@/lib/util';

export interface CharacterFormData {
    name: string;
    gender: 'FEMALE' | 'MALE' | 'OTHER';
    age: string;
    hair: string;
    bodyType: string;
    ethnicity: string;
    description: string;
    images?: File[];
    
    // Wizard-specific fields
    ageRange?: string;
    personality?: {
        confidence: number;
        seduction: number;
        dominance: number;
    };
    style?: {
        platforms: ('INSTAGRAM' | 'TIKTOK' | 'ONLYFANS')[];
        clothingStyle: string;
        poses: string[];
    };
    baseImage?: File;
    isDraft?: boolean;
}

type SortOrder = 'asc' | 'desc';

export const useCharacters = () => {
    const { user } = useUserData();
    const [characters, setCharacters] = useState<WithId<UserCharacter>[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all characters for the current user
    const fetchCharacters = useCallback((sortOrder: SortOrder = 'desc') => {
        if (!user) {
            setError('User not authenticated');
            return () => { };
        }

        setLoading(true);
        setError(null);

        const db = getFirestore(app);
        const charactersRef = collection(db, 'characters');
        const q = query(
            charactersRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', sortOrder)
        );

        const unsubscribe = onSnapshot(q,
            async (querySnapshot) => {
                const charactersList: WithId<UserCharacter>[] = [];
                const storage = getStorage(app);

                for (const doc of querySnapshot.docs) {
                    const characterData = doc.data() as WithId<UserCharacter>;
                    characterData.id = doc.id;

                    // If baseImageUrl is missing but baseImageId exists, fetch it from storage
                    if (!characterData.baseImageUrl && characterData.baseImageId) {
                        try {
                            const imageRef = ref(
                                storage,
                                `character-images/${user.uid}/${doc.id}/${characterData.baseImageId}`
                            );
                            characterData.baseImageUrl = await getDownloadURL(imageRef);
                        } catch (error) {
                            console.warn('Failed to get base image URL from storage:', error);
                        }
                    }

                    // If imageUrls are missing but imageIds exist, fetch them from storage
                    if ((!characterData.imageUrls || characterData.imageUrls.length === 0) && 
                        characterData.imageIds && characterData.imageIds.length > 0) {
                        try {
                            const urlPromises = characterData.imageIds.map(async (imageId: string) => {
                                const imageRef = ref(
                                    storage,
                                    `character-images/${user.uid}/${doc.id}/${imageId}`
                                );
                                return await getDownloadURL(imageRef);
                            });
                            characterData.imageUrls = await Promise.all(urlPromises);
                        } catch (error) {
                            console.warn('Failed to get image URLs from storage:', error);
                        }
                    }

                    charactersList.push(characterData);
                }

                setCharacters(charactersList);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching characters:', err);
                setError('Failed to fetch characters');
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [user]);

    useEffect(() => {
        const unsubscribe = user ? fetchCharacters() : () => { };

        return () => unsubscribe();
    }, [user, fetchCharacters]);

    // Create a new character
    const createCharacter = useCallback(async (characterData: CharacterFormData): Promise<string | null> => {
        if (!user) {
            setError('User not authenticated');
            return null;
        }

        setError(null);

        const db = getFirestore(app);
        const storage = getStorage(app);

        try {
            // Generate a character ID first without creating the document
            const characterId = doc(collection(db, 'characters')).id;
            let imageIds: string[] = [];
            let imageUrls: string[] = [];

            // Upload images if provided
            if (characterData.images && characterData.images.length > 0) {
                // Upload each image and collect IDs
                for (const image of characterData.images) {
                    // Generate a UUID for the image
                    const imageId = crypto.randomUUID();

                    // Get file extension from the original filename or MIME type
                    const fileExtension = getFileExtension(image.name, image.type);

                    // Create a reference with proper file extension
                    const imageRef = ref(
                        storage,
                        `character-images/${user.uid}/${characterId}/${imageId}.${fileExtension}`
                    );

                    // Upload with proper content type metadata
                    await uploadBytes(imageRef, image, {
                        contentType: image.type,
                        customMetadata: {
                            'originalName': image.name,
                            'uploadedAt': new Date().toISOString(),
                        }
                    });

                    // Store the image ID with extension for retrieval
                    imageIds.push(`${imageId}.${fileExtension}`);
                }

                // Get image URLs using the server action
                if (imageIds.length > 0) {
                    try {
                        imageUrls = await getCharacterImageUrls(characterId, imageIds);
                    } catch (error) {
                        console.warn('Failed to get image URLs, will fetch later:', error);
                        // Images are uploaded, URLs can be fetched later
                    }
                }
            }

            // Handle base image separately (for wizard flow)
            let baseImageId: string | undefined;
            let baseImageUrl: string | undefined;
            if (characterData.baseImage) {
                const imageId = crypto.randomUUID();
                const fileExtension = getFileExtension(characterData.baseImage.name, characterData.baseImage.type);
                const imageRef = ref(
                    storage,
                    `character-images/${user.uid}/${characterId}/base-${imageId}.${fileExtension}`
                );

                await uploadBytes(imageRef, characterData.baseImage, {
                    contentType: characterData.baseImage.type,
                    customMetadata: {
                        'originalName': characterData.baseImage.name,
                        'uploadedAt': new Date().toISOString(),
                        'isBaseImage': 'true',
                    }
                });

                baseImageId = `base-${imageId}.${fileExtension}`;
                try {
                    const urls = await getCharacterImageUrls(characterId, [baseImageId]);
                    baseImageUrl = urls[0];
                } catch (error) {
                    console.warn('Failed to get base image URL, will fetch later:', error);
                    // Base image is uploaded, URL can be fetched later
                }
            }

            // Now create the character document with all data including image IDs and URLs
            const characterRef = doc(db, 'characters', characterId);
            const characterDoc: any = {
                userId: user.uid,
                name: characterData.name,
                description: characterData.description || '',
                characteristics: ["age", "hair", "bodyType", "ethnicity", "gender"].map((attr) => ({ 
                    name: attr, 
                    value: characterData[attr as keyof typeof characterData] as string || '' 
                })),
                imageIds,
                imageUrls,
                createdAt: serverTimestamp(),
            };

            // Add wizard-specific fields
            if (characterData.gender) {
                characterDoc.gender = characterData.gender;
            }
            if (characterData.ageRange) {
                characterDoc.ageRange = characterData.ageRange;
            }
            if (characterData.bodyType) {
                characterDoc.bodyType = characterData.bodyType;
            }
            if (baseImageId) {
                characterDoc.baseImageId = baseImageId;
            }
            if (baseImageUrl) {
                characterDoc.baseImageUrl = baseImageUrl;
            }
            if (characterData.personality) {
                characterDoc.personality = characterData.personality;
            }
            if (characterData.style) {
                characterDoc.style = characterData.style;
            }
            if (characterData.isDraft !== undefined) {
                characterDoc.isDraft = characterData.isDraft;
            }
            characterDoc.lastModified = serverTimestamp();

            await setDoc(characterRef, characterDoc);

            return characterId;
        } catch (err) {
            console.error('Error creating character:', err);
            setError('Failed to create character');
            return null;
        }
    }, [user, fetchCharacters]);

    // Delete a character
    const deleteCharacter = useCallback(async (characterId: string): Promise<boolean> => {
        if (!user) {
            setError('User not authenticated');
            return false;
        }

        setError(null);

        const db = getFirestore(app);

        try {
            // Get character data to check ownership and get image URL
            const characterRef = doc(db, 'characters', characterId);
            const characterSnap = await getDoc(characterRef);

            if (!characterSnap.exists()) {
                setError('Character not found');
                return false;
            }

            const characterData = characterSnap.data();

            // Verify ownership
            if (characterData.userId !== user.uid) {
                setError('You do not have permission to delete this character');
                return false;
            }

            // Delete character images from storage
            await deleteCharacterImages(characterId);

            // Delete character document
            await deleteDoc(characterRef);

            return true;
        } catch (err) {
            console.error('Error deleting character:', err);
            setError('Failed to delete character');
            return false;
        }
    }, [user, fetchCharacters]);

    // Get a single character by ID
    const getCharacter = useCallback(async (characterId: string): Promise<WithId<UserCharacter> | null> => {
        if (!user) {
            setError('User not authenticated');
            return null;
        }

        setLoading(true);
        setError(null);

        const db = getFirestore(app);

        try {
            const characterRef = doc(db, 'characters', characterId);
            const characterSnap = await getDoc(characterRef);

            if (!characterSnap.exists()) {
                setError('Character not found');
                return null;
            }

            const characterData = characterSnap.data() as WithId<UserCharacter>;

            characterData.id = characterSnap.id;
            return characterData;
        } catch (err) {
            console.error('Error getting character:', err);
            setError('Failed to get character');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        characters,
        loading,
        error,
        fetchCharacters,
        createCharacter,
        deleteCharacter,
        getCharacter,
    };
};