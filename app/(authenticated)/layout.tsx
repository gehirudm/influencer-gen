"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Loader, Center } from '@mantine/core';
import app from '@/lib/firebase';

const auth = getAuth(app);

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                // If no user is authenticated, redirect to /auth
                router.replace('/auth');
            } else {
                setLoading(false); // Set loading to false once the user is authenticated
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <Center style={{ height: '100vh' }}>
                <Loader size="xl" />
            </Center>
        );
    }

    return (
        <>
            {children}
        </>
    );
}