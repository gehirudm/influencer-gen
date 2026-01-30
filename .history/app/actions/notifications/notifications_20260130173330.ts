'use server'

import firebaseApp from '@/lib/firebaseAdmin';
import { getSessionUid } from '../actions';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const adminDb = getFirestore(firebaseApp);

export type NotificationType = 'welcome' | 'purchase' | 'credits' | 'warning' | 'achievement' | string;

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { userId, type, title, message, link } = params;

    await adminDb.collection('inbox_notifications').add({
      userId,
      type,
      title,
      message,
      read: false,
      link: link || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    const notificationRef = adminDb.collection('inbox_notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      throw new Error('Notification not found');
    }

    const data = notificationDoc.data();
    if (data?.userId !== uid) {
      throw new Error('Unauthorized');
    }

    await notificationRef.update({
      read: true,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    const notificationsSnapshot = await adminDb
      .collection('inbox_notifications')
      .where('userId', '==', uid)
      .where('read', '==', false)
      .get();

    const batch = adminDb.batch();
    notificationsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    const notificationRef = adminDb.collection('inbox_notifications').doc(notificationId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
      throw new Error('Notification not found');
    }

    const data = notificationDoc.data();
    if (data?.userId !== uid) {
      throw new Error('Unauthorized');
    }

    await notificationRef.delete();

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAllNotifications() {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    const notificationsSnapshot = await adminDb
      .collection('inbox_notifications')
      .where('userId', '==', uid)
      .get();

    const batch = adminDb.batch();
    notificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting all notifications:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions to create specific notification types

export async function createWelcomeNotification(userId: string) {
  return createNotification({
    userId,
    type: 'welcome',
    title: 'Welcome to Fantazy! 🎉',
    message: 'We\'re thrilled to have you here! Start by creating your first AI influencer or generating stunning images. If you need help, check out our FAQ section.',
    link: '/discover',
  });
}

export async function createPurchaseNotification(userId: string, tokenAmount: number, pricingTier: string) {
  return createNotification({
    userId,
    type: 'purchase',
    title: 'Purchase Successful! 🎊',
    message: `You've successfully purchased the ${pricingTier} package and received ${tokenAmount} tokens. Start generating amazing content now!`,
    link: '/create',
  });
}

export async function createCreditsReceivedNotification(userId: string, amount: number, reason: string) {
  return createNotification({
    userId,
    type: 'credits',
    title: 'Credits Received! 💎',
    message: `You have received ${amount} credits${reason ? ` from ${reason}` : ''}. Your balance has been updated!`,
  });
}

export async function createCreditsNotification(userId: string, amount: number, reason: string) {
  return createCreditsReceivedNotification(userId, amount, reason);
}

export async function createLowTokensWarning(userId: string, currentTokens: number) {
  return createNotification({
    userId,
    type: 'warning',
    title: 'Running Low on Tokens ⚠️',
    message: `You only have ${currentTokens} tokens remaining. Consider purchasing more tokens to continue creating amazing content without interruption.`,
    link: '/pricing',
  });
}

export async function createFirstImageNotification(userId: string) {
  return createNotification({
    userId,
    type: 'achievement',
    title: 'First Image Generated! 🎉',
    message: 'Congratulations on generating your first image! This is just the beginning of your creative journey. Keep exploring and creating!',
    link: '/assets',
  });
}

// Helper function to check if a user already has a specific notification type
export async function hasNotificationType(userId: string, type: NotificationType) {
  try {
    const notificationsSnapshot = await adminDb
      .collection('inbox_notifications')
      .where('userId', '==', userId)
      .where('type', '==', type)
      .limit(1)
      .get();

    return !notificationsSnapshot.empty;
  } catch (error: any) {
    console.error('Error checking notification type:', error);
    return false;
  }
}
