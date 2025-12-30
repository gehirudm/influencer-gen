"use server"

import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseApp from '@/lib/firebaseAdmin';
import { clearSessionCookie } from './sign-out';

/**
 * Server action to delete a user account
 * This will:
 * 1. Verify the user's session
 * 2. Delete the user's data from Firestore
 * 3. Delete the user from Firebase Authentication
 * 4. Clear the session cookie
 * 
 * @returns Success status and message
 */
export async function deleteUserAccount(): Promise<{ success: boolean; message: string }> {
    try {
        // Initialize Firebase Admin
        const db = getFirestore(firebaseApp);
        const auth = getAuth(firebaseApp);

        // Get session cookie
        const sessionCookie = (await cookies()).get('__session')?.value;
        
        if (!sessionCookie) {
            return { success: false, message: 'Authentication required' };
        }
        
        // Verify the session cookie
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        const userId = decodedToken.uid;
        
        if (!userId) {
            return { success: false, message: 'User not authenticated' };
        }

        // Start a batch operation for Firestore
        const batch = db.batch();
        
        // 1. Delete user data from Firestore
        // Get all collections where user data might be stored
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            // Delete main user document
            batch.delete(userRef);
            
            // Delete user's private data
            const privateCollectionRef = userRef.collection('private');
            const privateDocuments = await privateCollectionRef.get();
            privateDocuments.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // // Delete user's generated images
            // const imagesRef = db.collection('images').where('userId', '==', userId);
            // const imagesSnapshot = await imagesRef.get();
            // imagesSnapshot.forEach(doc => {
            //     batch.delete(doc.ref);
            // });
            
            // // Delete user's characters
            // const charactersRef = db.collection('characters').where('userId', '==', userId);
            // const charactersSnapshot = await charactersRef.get();
            // charactersSnapshot.forEach(doc => {
            //     batch.delete(doc.ref);
            // });
            
            // // Delete user's generation jobs
            // const jobsRef = db.collection('generation-jobs').where('userId', '==', userId);
            // const jobsSnapshot = await jobsRef.get();
            // jobsSnapshot.forEach(doc => {
            //     batch.delete(doc.ref);
            // });
            
            // Commit all the delete operations
            await batch.commit();
        }
        
        // 2. Delete the user from Firebase Authentication
        await auth.deleteUser(userId);
        
        // 3. Clear the session cookie
        (await cookies()).delete({
            name: '__session',
            path: '/',
            // Use the same settings that were used when creating the cookie
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        
        return { 
            success: true, 
            message: 'Account deleted successfully' 
        };
        
    } catch (error: any) {
        console.error('Error deleting user account:', error);
        
        return { 
            success: false, 
            message: error.message || 'Failed to delete account. Please try again.' 
        };
    }
}

export async function changeUserName(newDisplayName: string): Promise<{ success: boolean; message: string }> {
    try {
        // Initialize Firebase Admin
        const db = getFirestore(firebaseApp);
        const auth = getAuth(firebaseApp);

        // Get session cookie
        const sessionCookie = (await cookies()).get('__session')?.value;
        
        if (!sessionCookie) {
            return { success: false, message: 'Authentication required' };
        }
        
        // Verify the session cookie
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        const userId = decodedToken.uid;
        
        if (!userId) {
            return { success: false, message: 'User not authenticated' };
        }

        // Update the user's display name in Firestore
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            displayName: newDisplayName
        });

        return {
            success: true,
            message: 'Display name updated successfully'
        };
        
    } catch (error: any) {
        console.error('Error updating user display name:', error);
        
        return { 
            success: false, 
            message: error.message || 'Failed to update display name. Please try again.' 
        };
    }
}