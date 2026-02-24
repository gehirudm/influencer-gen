"use client"

import { Header } from '@/components/Header/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // return <Navbar>{children}</Navbar>;
    return <Header>{children}</Header>;
}