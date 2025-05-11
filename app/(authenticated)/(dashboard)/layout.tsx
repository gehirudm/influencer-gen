"use client"

import Navbar from '@/components/Navbar/Navbar';
import NavbarCollapsed from '@/components/Navbar/NavbarCollapsed';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <Navbar>{children}</Navbar>;
}