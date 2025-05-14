import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import app from '@/lib/firebase';

interface UserData {
  displayName: string | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
}

interface UserPrivateData {
  tokens: number;
}

interface UserDataHookResult {
  user: User | null;
  userData: UserData | null;
  privateData: UserPrivateData | null;
  loading: boolean;
  error: string | null;
}

export function useUserData(): UserDataHookResult {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [privateData, setPrivateData] = useState<UserPrivateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(currentUser === null ? false : true);
      
      if (!currentUser) {
        setUserData(null);
        setPrivateData(null);
        setLoading(false);
        return;
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const db = getFirestore(app);
    let unsubscribeUserData: (() => void) | undefined;
    let unsubscribePrivateData: (() => void) | undefined;

    try {
      // Subscribe to user document
      unsubscribeUserData = onSnapshot(
        doc(db, 'users', user.uid),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserData(docSnapshot.data() as UserData);
          } else {
            setUserData(null);
            setError('User document not found');
          }
        },
        (err) => {
          console.error('Error fetching user data:', err);
          setError(`Error fetching user data: ${err.message}`);
        }
      );

      // Subscribe to private user data
      unsubscribePrivateData = onSnapshot(
        doc(db, 'users', user.uid, 'private', 'data'),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setPrivateData(docSnapshot.data() as UserPrivateData);
          } else {
            setPrivateData({ tokens: 0 });
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching private user data:', err);
          setError(`Error fetching private user data: ${err.message}`);
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.error('Error setting up listeners:', err);
      setError(`Error setting up listeners: ${err.message}`);
      setLoading(false);
    }

    return () => {
      if (unsubscribeUserData) unsubscribeUserData();
      if (unsubscribePrivateData) unsubscribePrivateData();
    };
  }, [user]);

  return { user, userData, privateData, loading, error };
}