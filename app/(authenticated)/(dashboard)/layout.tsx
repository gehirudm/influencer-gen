"use client"

import Navbar from '@/components/Navbar/Navbar';
import NavbarCollapsed from '@/components/Navbar/NavbarCollapsed';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Header } from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { Stack } from '@mantine/core';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // return <Navbar>{children}</Navbar>;
    return <>
        <Stack gap={10}>
            <Header>{children}</Header>
            <Footer></Footer>
        </Stack>
    </>;
}