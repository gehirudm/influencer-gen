'use server'

import firebaseApp from '@/lib/firebaseAdmin';
import { getSessionUid } from '../actions';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { createNotification } from '../notifications/notifications';

const adminDb = getFirestore(firebaseApp);

/**
 * Submit a training request for a user-created character.
 * Deducts 1 LoRA token from the user and creates a train request for admin review.
 */
export async function submitTrainRequest(characterId: string) {
    try {
        const uid = await getSessionUid();
        if (!uid) {
            return { success: false, error: 'Authentication required' };
        }

        // Get user's LoRA tokens
        const systemRef = adminDb.doc(`users/${uid}/private/system`);
        const systemDoc = await systemRef.get();
        const systemData = systemDoc.data();
        const loraTokens = systemData?.loraTokens || 0;

        if (loraTokens < 1) {
            return { success: false, error: 'Insufficient LoRA tokens. You need at least 1 LoRA token to train a character.' };
        }

        // Get character data
        const characterRef = adminDb.doc(`characters/${characterId}`);
        const characterDoc = await characterRef.get();

        if (!characterDoc.exists) {
            return { success: false, error: 'Character not found' };
        }

        const characterData = characterDoc.data()!;

        // Verify ownership
        if (characterData.userId !== uid) {
            return { success: false, error: 'You do not own this character' };
        }

        // Check if already trained or pending
        if (characterData.trainStatus === 'pending') {
            return { success: false, error: 'Training request already submitted for this character' };
        }
        if (characterData.trainStatus === 'completed') {
            return { success: false, error: 'This character is already trained' };
        }

        // Check for existing pending request
        const existingRequest = await adminDb
            .collection('character-train-requests')
            .where('characterId', '==', characterId)
            .where('status', '==', 'pending')
            .get();

        if (!existingRequest.empty) {
            return { success: false, error: 'A training request is already pending for this character' };
        }

        // Deduct 1 LoRA token
        await systemRef.update({
            loraTokens: FieldValue.increment(-1),
        });

        const now = new Date().toISOString();

        // Create train request document
        await adminDb.collection('character-train-requests').add({
            characterId,
            userId: uid,
            characterName: characterData.name || '',
            characterGender: characterData.gender || '',
            characterAge: characterData.age || '',
            characterBodyType: characterData.bodyType || '',
            characterDescription: characterData.description || '',
            characterImageUrls: characterData.imageUrls || [],
            characterBaseImageUrl: characterData.baseImageUrl || '',
            characteristics: characterData.characteristics || [],
            status: 'pending',
            requestedAt: FieldValue.serverTimestamp(),
        });

        // Update character document with pending train status
        await characterRef.update({
            trainStatus: 'pending',
            trainRequestedAt: now,
        });

        // Send inbox notification to user
        await createNotification({
            userId: uid,
            type: 'training',
            title: 'Training Request Received',
            message: `We've received your training request for "${characterData.name}". Your character will be ready in approximately 6 hours. We'll notify you as soon as it's available to use!`,
            link: '/character',
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error submitting train request:', error);
        return { success: false, error: error.message || 'Failed to submit training request' };
    }
}

/**
 * Admin action: Complete a training request by providing the LoRA URL.
 */
export async function completeTrainRequest(
    requestId: string,
    loraUrl: string,
    loraName: string,
    loraKeyword: string,
) {
    try {
        const uid = await getSessionUid();
        if (!uid) {
            return { success: false, error: 'Authentication required' };
        }

        // Verify admin
        const systemRef = adminDb.doc(`users/${uid}/private/system`);
        const systemDoc = await systemRef.get();
        const systemData = systemDoc.data();

        if (!systemData?.isAdmin) {
            return { success: false, error: 'Admin access required' };
        }

        // Get the train request
        const requestRef = adminDb.doc(`character-train-requests/${requestId}`);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            return { success: false, error: 'Training request not found' };
        }

        const requestData = requestDoc.data()!;

        if (requestData.status === 'completed') {
            return { success: false, error: 'This request has already been completed' };
        }

        const now = new Date().toISOString();

        // Update the train request
        await requestRef.update({
            status: 'completed',
            loraUrl,
            loraName,
            loraKeyword,
            completedAt: FieldValue.serverTimestamp(),
            completedBy: uid,
        });

        // Update the character document
        const characterRef = adminDb.doc(`characters/${requestData.characterId}`);
        await characterRef.update({
            trainStatus: 'completed',
            loraUrl,
            loraName,
            loraKeyword,
            trainCompletedAt: now,
        });

        // Notify the user their character is ready
        await createNotification({
            userId: requestData.userId,
            type: 'training_complete',
            title: 'Character Training Complete! 🎉',
            message: `Great news! Your character "${requestData.characterName}" has been trained and is now ready to use. Head over to your characters page to start generating images!`,
            link: '/character',
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error completing train request:', error);
        return { success: false, error: error.message || 'Failed to complete training request' };
    }
}

/**
 * Admin action: Reject a training request.
 * Refunds the user's LoRA token.
 */
export async function rejectTrainRequest(requestId: string, reason?: string) {
    try {
        const uid = await getSessionUid();
        if (!uid) {
            return { success: false, error: 'Authentication required' };
        }

        // Verify admin
        const systemRef = adminDb.doc(`users/${uid}/private/system`);
        const systemDoc = await systemRef.get();
        const systemData = systemDoc.data();

        if (!systemData?.isAdmin) {
            return { success: false, error: 'Admin access required' };
        }

        // Get the train request
        const requestRef = adminDb.doc(`character-train-requests/${requestId}`);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            return { success: false, error: 'Training request not found' };
        }

        const requestData = requestDoc.data()!;

        if (requestData.status === 'completed') {
            return { success: false, error: 'Cannot reject a completed request' };
        }

        // Update the train request
        await requestRef.update({
            status: 'rejected',
            adminNotes: reason || '',
            completedAt: FieldValue.serverTimestamp(),
            completedBy: uid,
        });

        // Reset the character's train status
        const characterRef = adminDb.doc(`characters/${requestData.characterId}`);
        await characterRef.update({
            trainStatus: 'untrained',
            trainRequestedAt: null,
        });

        // Refund the LoRA token
        const userSystemRef = adminDb.doc(`users/${requestData.userId}/private/system`);
        await userSystemRef.update({
            loraTokens: FieldValue.increment(1),
        });

        // Notify the user
        await createNotification({
            userId: requestData.userId,
            type: 'training_rejected',
            title: 'Training Request Update',
            message: `Your training request for "${requestData.characterName}" could not be processed${reason ? `: ${reason}` : '.'}. Your LoRA token has been refunded.`,
            link: '/character',
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error rejecting train request:', error);
        return { success: false, error: error.message || 'Failed to reject training request' };
    }
}
