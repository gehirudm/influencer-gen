'use server'

import { cookies } from 'next/headers';
import { firestore } from '@/lib/firebaseAdmin';
import type { InboxNotification } from '@/types/types';

/**
 * Creates a notification for a specific user
 */
export async function createNotification(
    userId: string,
    notification: Omit<InboxNotification, 'userId' | 'createdAt' | 'read'>
) {
    try {
        const notificationData: InboxNotification = {
            userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            read: false,
            createdAt: new Date().toISOString(),
            link: notification.link,
            metadata: notification.metadata
        };

        const docRef = await firestore.collection('inbox_notifications').add(notificationData);
        
        return { success: true, notificationId: docRef.id };
    } catch (error: any) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Creates a welcome notification for a new user
 */
export async function createWelcomeNotification(userId: string) {
    return createNotification(userId, {
        type: 'welcome',
        title: '🎉 Welcome to InfluencerGEN!',
        message: 'We\'re thrilled to have you here! Start creating amazing AI-generated content for your influencer persona. Check out the Create page to generate your first image.',
        link: '/create'
    });
}

/**
 * Creates a notification for a successful purchase
 */
export async function createPurchaseNotification(
    userId: string,
    packageName: string,
    tokens: number
) {
    return createNotification(userId, {
        type: 'purchase',
        title: '✅ Purchase Successful',
        message: `You have successfully purchased the ${packageName} package and received ${tokens} tokens!`,
        metadata: {
            package: packageName,
            tokens
        }
    });
}

/**
 * Creates a notification for received credits
 */
export async function createCreditsNotification(
    userId: string,
    tokens: number,
    source: string = 'subscription'
) {
    return createNotification(userId, {
        type: 'credits',
        title: '🎁 Credits Received',
        message: `You have received ${tokens} free credits from your ${source}!`,
        metadata: {
            tokens,
            source
        }
    });
}

/**
 * Creates a low tokens warning notification
 */
export async function createLowTokensNotification(userId: string, remainingTokens: number) {
    return createNotification(userId, {
        type: 'low_tokens',
        title: '⚠️ You\'re Running Low on Tokens',
        message: `You only have ${remainingTokens} tokens remaining. Purchase more tokens to continue generating images.`,
        link: '/pricing',
        metadata: {
            tokens: remainingTokens
        }
    });
}

/**
 * Creates a first image generation celebration notification
 */
export async function createFirstImageNotification(userId: string) {
    return createNotification(userId, {
        type: 'first_image',
        title: '🎉 First Image Generated!',
        message: 'Congratulations on generating your first image! You\'re on your way to creating amazing content. Check out the Assets page to see all your creations.',
        link: '/assets'
    });
}

/**
 * Check if user already has a specific notification type
 */
export async function hasNotificationType(userId: string, type: InboxNotification['type']): Promise<boolean> {
    try {
        const snapshot = await firestore
            .collection('inbox_notifications')
            .where('userId', '==', userId)
            .where('type', '==', type)
            .limit(1)
            .get();

        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking notification type:', error);
        return false;
    }
}
