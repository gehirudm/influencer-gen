"use client"

import Navbar from '@/components/Navbar';
import NavbarCollapsed from '@/components/NavbarCollapsed';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';

export default function CollapseDesktop({ children }: { children: React.ReactNode }) {
    const isDesktop = useMediaQuery('(min-width: 56.25em)');

    // Set the initial state of collapsed based on the media query
    const [collapsed, setCollapsed] = useState(!isDesktop);

    // Update the collapsed state whenever isDesktop changes
    useEffect(() => {
        setCollapsed(!isDesktop);
    }, [isDesktop]);

    if (collapsed) {
        return (
            <NavbarCollapsed setCollapsed={setCollapsed}>
                {children}
            </NavbarCollapsed>
        );
    }

    return (
        <Navbar setCollapsed={setCollapsed}>
            {children}
        </Navbar>
    );
}