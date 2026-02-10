"use client"

import Navbar from '@/components/Navbar/Navbar';
import NavbarCollapsed from '@/components/Navbar/NavbarCollapsed';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Header } from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { Stack } from '@mantine/core';
import { TokenBar } from '@/components/TokenBar/TokenBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const isMobile = useMediaQuery('(max-width: 768px)');

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
            {children}
        </Navbar>
    );
}