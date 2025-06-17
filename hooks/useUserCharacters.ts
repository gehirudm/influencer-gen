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
            (querySnapshot) => {
                const charactersList: WithId<UserCharacter>[] = [];

                querySnapshot.docs.forEach((doc) => {
                    const characterData = doc.data() as WithId<UserCharacter>;
                    characterData.id = doc.id;

                    charactersList.push(characterData);
                });

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
                    imageUrls = await getCharacterImageUrls(characterId, imageIds);
                }
            }

            // Now create the character document with all data including image IDs and URLs
            const characterRef = doc(db, 'characters', characterId);
            await setDoc(characterRef, {
                userId: user.uid,
                name: characterData.name,
                description: characterData.description,
                characteristics: ["age", "hair", "bodyType", "ethnicity", "gender"].map((attr) => ({ [attr]: characterData[attr as keyof typeof characterData] })),
                imageIds,
                imageUrls,
                createdAt: serverTimestamp()
            });

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