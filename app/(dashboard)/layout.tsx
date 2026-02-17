"use client"

import Navbar from '@/components/Navbar/Navbar';
import NavbarCollapsed from '@/components/Navbar/NavbarCollapsed';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Header } from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { Stack } from '@mantine/core';
import { TokenBar } from '@/components/TokenBar/TokenBar';
import { useUserData } from '@/hooks/useUserData';
import { useRouter } from 'next/navigation';
import { validateSession } from '@/app/actions/auth/validate-session';
import { clearSessionCookie } from '@/app/actions/account/sign-out';
import { getAuth, signOut } from 'firebase/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { user, loading } = useUserData();
    const router = useRouter();
    const [sessionValid, setSessionValid] = useState<boolean | null>(null);

    // Check client-side auth
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth');
        }
    }, [loading, user, router]);

    // Validate server-side session cookie once user is loaded
    useEffect(() => {
        if (!loading && user) {
            validateSession().then((valid) => {
                if (!valid) {
                    console.warn('Server-side session invalid, signing out...');
                    // Clear the bad cookie + sign out client-side
                    clearSessionCookie().then(() => {
                        signOut(getAuth()).then(() => {
                            router.replace('/auth');
                        });
                    });
                } else {
                    setSessionValid(true);
                }
            });
        }
    }, [loading, user, router]);

    // Don't render dashboard content until both client and server auth are verified
    if (loading || !user || sessionValid !== true) {
        return null;
    }

    // Mobile view: use Header (top navigation)
    if (isMobile) {
        return (
            <Stack gap={0}>
                <Header>
                    <TokenBar />
                    {children}
                </Header>
                <Footer></Footer>
            </Stack>
        );
    }

    // Desktop view: use Navbar (left sidebar)
    return (
        <Navbar>
            <TokenBar />
            <div style={{ marginTop: '20px' }}>
                {children}
            </div>
        </Navbar>
    );
}