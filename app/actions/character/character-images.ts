"use server"

import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import firebaseAdminApp from '@/lib/firebaseAdmin';

/**
 * Server action to get signed URLs for character images
 * @param characterId The ID of the character
 * @param imageIds Array of image IDs to get URLs for
 * @returns Array of signed URLs for the images
 */
export async function getCharacterImageUrls(
    characterId: string,
    imageIds: string[]
): Promise<string[]> {
    try {
        // Get the session cookie
        const sessionCookie = (await cookies()).get('session')?.value;

        if (!sessionCookie) {
            throw new Error('Authentication required');
        }

        // Verify the session cookie
        const auth = getAuth(firebaseAdminApp);
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const userId = decodedClaims.uid;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Get the storage instance
        const storage = getStorage(firebaseAdminApp);
        const bucket = storage.bucket("influncer-gen.firebasestorage.app");

        // Generate signed URLs for each image
        const urlPromises = imageIds.map(async (imageId) => {
            const filePath = `character-images/${userId}/${characterId}/${imageId}`;
            const file = bucket.file(filePath);

            // Check if file exists
            const [exists] = await file.exists();
            if (!exists) {
                console.warn(`Image ${imageId} does not exist at path ${filePath}`);
                return '';
            }

            // Generate a signed URL with long expiration
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: '2100-01-01', // Long-lived URL
            });

            return signedUrl;
        });

        // Wait for all URLs to be generated
        const urls = await Promise.all(urlPromises);

        // Filter out any empty URLs (from non-existent files)
        return urls.filter(url => url !== '');

    } catch (error) {
        console.error('Error getting character image URLs:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to get image URLs');
    }
}

/**
 * Server action to delete character images
 * @param characterId The ID of the character
 * @returns Success status
 */
export async function deleteCharacterImages(
    characterId: string
): Promise<{ success: boolean; message: string }> {
    try {
        // Get the session cookie
        const sessionCookie = (await cookies()).get('session')?.value;

        if (!sessionCookie) {
            return { success: false, message: 'Authentication required' };
        }

        // Verify the session cookie
        const auth = getAuth(firebaseAdminApp);
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const userId = decodedClaims.uid;

        if (!userId) {
            return { success: false, message: 'User not authenticated' };
        }

        // Get the storage instance
        const storage = getStorage(firebaseAdminApp);
        const bucket = storage.bucket("influncer-gen.firebasestorage.app");

        // Delete all images in the character folder
        const prefix = `character-images/${userId}/${characterId}/`;
        const [files] = await bucket.getFiles({ prefix });

        const deletePromises = files.map(file => file.delete());
        await Promise.all(deletePromises);

        return { success: true, message: 'Images deleted successfully' };

    } catch (error) {
        console.error('Error deleting character images:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete images'
        };
    }
}