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
    link: '/generate-images',
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

// Admin functions for sending notifications

interface SendNotificationToAllParams {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

interface SendNotificationToSpecificParams extends SendNotificationToAllParams {
  userIds?: string[];
  emails?: string[];
}

interface SendNotificationToSegmentParams extends SendNotificationToAllParams {
  segment: 'all' | 'free' | 'premium' | 'low_tokens' | 'active' | 'inactive';
}

interface SentAnnouncement {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  targetType: 'all' | 'specific' | 'segment';
  targetDetails?: string;
  recipientCount: number;
  sentBy: string;
  sentAt: any;
}

export async function sendNotificationToAll(params: SendNotificationToAllParams) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { type, title, message, link } = params;

    // Get all users
    const usersSnapshot = await adminDb.collection('users').get();
    let batch = adminDb.batch();
    let count = 0;
    let batchCount = 0;

    for (const doc of usersSnapshot.docs) {
      const notificationRef = adminDb.collection('inbox_notifications').doc();
      batch.set(notificationRef, {
        userId: doc.id,
        type,
        title,
        message,
        read: false,
        link: link || null,
        createdAt: FieldValue.serverTimestamp(),
      });
      count++;
      batchCount++;

      // Firestore batch limit is 500
      if (batchCount >= 500) {
        await batch.commit();
        batch = adminDb.batch();
        batchCount = 0;
      }
    }

    // Commit remaining items
    if (batchCount > 0) {
      await batch.commit();
    }

    // Save to sent_announcements collection
    await adminDb.collection('sent_announcements').add({
      type,
      title,
      message,
      link: link || null,
      targetType: 'all',
      recipientCount: count,
      sentBy: uid,
      sentAt: FieldValue.serverTimestamp(),
    });

    return { success: true, recipientCount: count };
  } catch (error: any) {
    console.error('Error sending notification to all:', error);
    return { success: false, error: error.message };
  }
}

export async function sendNotificationToSpecific(params: SendNotificationToSpecificParams) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { type, title, message, link, userIds, emails } = params;

    let targetUserIds: string[] = [];

    // If userIds provided, use them directly
    if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    }

    // If emails provided, look up user IDs
    if (emails && emails.length > 0) {
      const usersSnapshot = await adminDb.collection('users').get();
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        if (emails.includes(userData.email) || emails.includes(userData.username)) {
          targetUserIds.push(doc.id);
        }
      });
    }

    if (targetUserIds.length === 0) {
      throw new Error('No valid recipients found');
    }

    const batch = adminDb.batch();

    targetUserIds.forEach((userId) => {
      const notificationRef = adminDb.collection('inbox_notifications').doc();
      batch.set(notificationRef, {
        userId,
        type,
        title,
        message,
        read: false,
        link: link || null,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    // Save to sent_announcements collection
    await adminDb.collection('sent_announcements').add({
      type,
      title,
      message,
      link: link || null,
      targetType: 'specific',
      targetDetails: `${targetUserIds.length} users`,
      recipientCount: targetUserIds.length,
      sentBy: uid,
      sentAt: FieldValue.serverTimestamp(),
    });

    return { success: true, recipientCount: targetUserIds.length };
  } catch (error: any) {
    console.error('Error sending notification to specific users:', error);
    return { success: false, error: error.message };
  }
}

export async function sendNotificationToSegment(params: SendNotificationToSegmentParams) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { type, title, message, link, segment } = params;

    let targetUserIds: string[] = [];

    if (segment === 'all') {
      const usersSnapshot = await adminDb.collection('users').get();
      targetUserIds = usersSnapshot.docs.map(doc => doc.id);
    } else if (segment === 'free' || segment === 'premium') {
      // Get users based on subscription status
      const usersSnapshot = await adminDb.collection('users').get();
      for (const userDoc of usersSnapshot.docs) {
        const privateDoc = await userDoc.ref.collection('private').doc('private').get();
        const isPremium = privateDoc.data()?.isPremium || false;
        
        if ((segment === 'premium' && isPremium) || (segment === 'free' && !isPremium)) {
          targetUserIds.push(userDoc.id);
        }
      }
    } else if (segment === 'low_tokens') {
      // Get users with low token counts (< 100)
      const usersSnapshot = await adminDb.collection('users').get();
      for (const userDoc of usersSnapshot.docs) {
        const privateDoc = await userDoc.ref.collection('private').doc('private').get();
        const tokens = privateDoc.data()?.tokens || 0;
        
        if (tokens < 100) {
          targetUserIds.push(userDoc.id);
        }
      }
    } else if (segment === 'active' || segment === 'inactive') {
      // Get users based on recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const usersSnapshot = await adminDb.collection('users').get();
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const lastActive = userData.lastActiveAt ? new Date(userData.lastActiveAt) : null;
        
        const isActive = lastActive && lastActive > thirtyDaysAgo;
        
        if ((segment === 'active' && isActive) || (segment === 'inactive' && !isActive)) {
          targetUserIds.push(userDoc.id);
        }
      }
    }

    if (targetUserIds.length === 0) {
      throw new Error('No users found in this segment');
    }

    const batch = adminDb.batch();

    targetUserIds.forEach((userId) => {
      const notificationRef = adminDb.collection('inbox_notifications').doc();
      batch.set(notificationRef, {
        userId,
        type,
        title,
        message,
        read: false,
        link: link || null,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    // Save to sent_announcements collection
    await adminDb.collection('sent_announcements').add({
      type,
      title,
      message,
      link: link || null,
      targetType: 'segment',
      targetDetails: segment,
      recipientCount: targetUserIds.length,
      sentBy: uid,
      sentAt: FieldValue.serverTimestamp(),
    });

    return { success: true, recipientCount: targetUserIds.length };
  } catch (error: any) {
    console.error('Error sending notification to segment:', error);
    return { success: false, error: error.message };
  }
}

export async function getSentAnnouncements() {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const announcementsSnapshot = await adminDb
      .collection('sent_announcements')
      .orderBy('sentAt', 'desc')
      .limit(100)
      .get();

    const announcements: SentAnnouncement[] = [];
    announcementsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      announcements.push({
        id: doc.id,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || undefined,
        targetType: data.targetType,
        targetDetails: data.targetDetails,
        recipientCount: data.recipientCount,
        sentBy: data.sentBy,
        sentAt: data.sentAt ? data.sentAt.toDate().toISOString() : null,
      } as SentAnnouncement);
    });

    return { success: true, announcements };
  } catch (error: any) {
    console.error('Error fetching sent announcements:', error);
    return { success: false, error: error.message, announcements: [] };
  }
}

export async function deleteAnnouncement(announcementId: string) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const announcementRef = adminDb.collection('sent_announcements').doc(announcementId);
    const announcementDoc = await announcementRef.get();

    if (!announcementDoc.exists) {
      throw new Error('Announcement not found');
    }

    await announcementRef.delete();

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return { success: false, error: error.message };
  }
}

export async function clearAnnouncementHistory() {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const announcementsSnapshot = await adminDb
      .collection('sent_announcements')
      .get();

    const batch = adminDb.batch();
    announcementsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true, deletedCount: announcementsSnapshot.size };
  } catch (error: any) {
    console.error('Error clearing announcement history:', error);
    return { success: false, error: error.message };
  }
}

// Preset notification template management

export interface NotificationPreset {
  id: string;
  key: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  description: string;
  variables?: string[];
  editable: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const defaultPresets: Omit<NotificationPreset, 'id'>[] = [
  {
    key: 'welcome',
    type: 'welcome',
    title: 'Welcome to Fantazy! 🎉',
    message: 'We\'re thrilled to have you here! Start by creating your first AI influencer or generating stunning images. If you need help, check out our FAQ section.',
    link: '/discover',
    description: 'Sent to new users when they sign up',
    variables: [],
    editable: true,
  },
  {
    key: 'purchase',
    type: 'purchase',
    title: 'Purchase Successful! 🎊',
    message: 'You\'ve successfully purchased the {pricingTier} package and received {tokenAmount} tokens. Start generating amazing content now!',
    link: '/generate-images',
    description: 'Sent after successful token purchase',
    variables: ['pricingTier', 'tokenAmount'],
    editable: true,
  },
  {
    key: 'credits',
    type: 'credits',
    title: 'Credits Received! 💎',
    message: 'You have received {amount} credits{reason}. Your balance has been updated!',
    link: '',
    description: 'Sent when user receives credits',
    variables: ['amount', 'reason'],
    editable: true,
  },
  {
    key: 'low_tokens',
    type: 'warning',
    title: 'Running Low on Tokens ⚠️',
    message: 'You only have {currentTokens} tokens remaining. Consider purchasing more tokens to continue creating amazing content without interruption.',
    link: '/pricing',
    description: 'Sent when user token balance is low',
    variables: ['currentTokens'],
    editable: true,
  },
  {
    key: 'first_image',
    type: 'achievement',
    title: 'First Image Generated! 🎉',
    message: 'Congratulations on generating your first image! This is just the beginning of your creative journey. Keep exploring and creating!',
    link: '/assets',
    description: 'Sent after user generates their first image',
    variables: [],
    editable: true,
  },
];

export async function getNotificationPresets() {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const presetsSnapshot = await adminDb.collection('notification_presets').get();

    // If no presets exist, initialize with defaults
    if (presetsSnapshot.empty) {
      const batch = adminDb.batch();
      const presets: NotificationPreset[] = [];

      for (const preset of defaultPresets) {
        const docRef = adminDb.collection('notification_presets').doc();
        batch.set(docRef, {
          ...preset,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        presets.push({
          ...preset,
          id: docRef.id,
        });
      }

      await batch.commit();
      return { success: true, presets };
    }

    const presets: NotificationPreset[] = [];
    presetsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      presets.push({
        id: doc.id,
        key: data.key,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || undefined,
        description: data.description,
        variables: data.variables || [],
        editable: data.editable !== false,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      });
    });

    return { success: true, presets };
  } catch (error: any) {
    console.error('Error fetching notification presets:', error);
    return { success: false, error: error.message, presets: [] };
  }
}

export async function updateNotificationPreset(
  presetId: string,
  updates: {
    title?: string;
    message?: string;
    link?: string;
  }
) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const presetRef = adminDb.collection('notification_presets').doc(presetId);
    const presetDoc = await presetRef.get();

    if (!presetDoc.exists) {
      throw new Error('Preset not found');
    }

    const presetData = presetDoc.data();
    if (presetData?.editable === false) {
      throw new Error('This preset cannot be edited');
    }

    await presetRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating notification preset:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteNotificationPreset(presetId: string) {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const presetRef = adminDb.collection('notification_presets').doc(presetId);
    const presetDoc = await presetRef.get();

    if (!presetDoc.exists) {
      throw new Error('Preset not found');
    }

    await presetRef.delete();

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting notification preset:', error);
    return { success: false, error: error.message };
  }
}

export async function resetNotificationPresets() {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const adminDoc = await adminDb.collection('users').doc(uid).collection('private').doc('system').get();
    const isAdmin = adminDoc.data()?.isAdmin;
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Delete all existing presets
    const presetsSnapshot = await adminDb.collection('notification_presets').get();
    const batch = adminDb.batch();
    presetsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Reinitialize with defaults
    const newBatch = adminDb.batch();
    for (const preset of defaultPresets) {
      const docRef = adminDb.collection('notification_presets').doc();
      newBatch.set(docRef, {
        ...preset,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await newBatch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('Error resetting notification presets:', error);
    return { success: false, error: error.message };
  }
}

