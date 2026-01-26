import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import type { InboxNotification } from '@/types/types';

type WithId<T> = T & { id: string };

export function useUserNotifications() {
    const [notifications, setNotifications] = useState<WithId<InboxNotification>[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const notificationsRef = collection(db, 'inbox_notifications');
            const q = query(
                notificationsRef,
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const notifs: WithId<InboxNotification>[] = [];
                    let unread = 0;

                    snapshot.forEach((doc) => {
                        const data = doc.data() as InboxNotification;
                        notifs.push({ ...data, id: doc.id });
                        if (!data.read) unread++;
                    });

                    setNotifications(notifs);
                    setUnreadCount(unread);
                    setLoading(false);
                },
                (err) => {
                    console.error('Error fetching notifications:', err);
                    setError(err.message);
                    setLoading(false);
                }
            );

            return () => unsubscribe();
        } catch (err: any) {
            console.error('Error setting up notifications listener:', err);
            setError(err.message);
            setLoading(false);
        }
    }, []);

    const markAsRead = async (notificationId: string) => {
        try {
            const notifRef = doc(db, 'inbox_notifications', notificationId);
            await updateDoc(notifRef, {
                read: true
            });
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;

            const unreadNotifications = notifications.filter(n => !n.read);
            
            await Promise.all(
                unreadNotifications.map(notif => 
                    updateDoc(doc(db, 'inbox_notifications', notif.id), { read: true })
                )
            );
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            await deleteDoc(doc(db, 'inbox_notifications', notificationId));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const deleteMultiple = async (notificationIds: string[]) => {
        try {
            await Promise.all(
                notificationIds.map(id => 
                    deleteDoc(doc(db, 'inbox_notifications', id))
                )
            );
        } catch (err) {
            console.error('Error deleting notifications:', err);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteMultiple
    };
}
