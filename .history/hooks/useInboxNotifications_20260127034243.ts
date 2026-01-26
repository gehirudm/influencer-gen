import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import app from '@/lib/firebase';

export type NotificationType = 'welcome' | 'purchase' | 'credits' | 'warning' | 'achievement';

export interface InboxNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Timestamp;
}

interface InboxNotificationsHookResult {
  notifications: InboxNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export function useInboxNotifications(): InboxNotificationsHookResult {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // Query notifications for the current user
      const notificationsRef = collection(db, 'inbox_notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const notifs: InboxNotification[] = [];
          let unread = 0;

          snapshot.forEach((doc) => {
            const data = doc.data();
            const notification: InboxNotification = {
              id: doc.id,
              userId: data.userId,
              type: data.type,
              title: data.title,
              message: data.message,
              read: data.read || false,
              link: data.link,
              createdAt: data.createdAt,
            };
            notifs.push(notification);
            if (!notification.read) {
              unread++;
            }
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

      return () => {
        unsubscribeSnapshot();
      };
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  return { notifications, unreadCount, loading, error };
}
