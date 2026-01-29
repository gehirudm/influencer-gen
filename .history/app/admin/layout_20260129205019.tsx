"use client";

import { useEffect, useState } from 'react';
import {
    Loader,
    Center,
    Text,
    Stack,
    Tooltip,
    UnstyledButton,
    Group,
    Avatar,
    Badge,
    Indicator,
} from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import {
    IconDashboard,
    IconUsers,
    IconTicket,
    IconSparkles,
    IconArrowLeft,
    IconSwitchHorizontal,
} from '@tabler/icons-react';
import classes from './admin.module.css';
import collapsedClasses from './adminCollapsed.module.css';
import { UserButton } from '@/components/UserButton';
import { useMediaQuery } from '@mantine/hooks';

// Navigation items configuration
const navItems = [
    {
        label: 'Dashboard',
        href: '/admin',
        icon: IconDashboard,
    },
    {
        label: 'Users',
        href: '/admin/users',
        icon: IconUsers,
    },
    {
        label: 'LoRAs',
        href: '/admin/loras',
        icon: IconSparkles,
    },
    {
        label: 'Promo Codes',
        href: '/admin/promo',
        icon: IconTicket,
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, systemData, loading, error } = useUserData();
    const [adminChecked, setAdminChecked] = useState(false);
    const [active, setActive] = useState('Dashboard');
    const [collapsed, setCollapsed] = useState(false);
    const isSmallScreen = useMediaQuery('(max-width: 56.25em)');

    useEffect(() => {
        setCollapsed(isSmallScreen ? isSmallScreen : false);
    }, [isSmallScreen]);

    useEffect(() => {
        const currentPath = pathname || '';
        const activeItem = navItems.find(item => currentPath === item.href);
        if (activeItem) {
            setActive(activeItem.label);
        }
    }, [pathname]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/auth');
                return;
            }

            if (systemData) {
                if (!systemData.isAdmin) {
                    console.log('Access denied: User is not an admin');
                    router.replace('/auth');
                    return;
                }
                setAdminChecked(true);
            }
        }
    }, [user, systemData, loading, router]);

    if (loading || !adminChecked) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#1a1a1a' }}>
                <Stack align="center" gap="md">
                    <Loader size="xl" color="violet" />
                    <Text size="lg" c="dimmed">Verifying admin privileges...</Text>
                </Stack>
            </Center>
        );
    }

    if (error) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#1a1a1a' }}>
                <Text c="red" size="lg">Error: {error}</Text>
            </Center>
        );
    }

    // Expanded navbar view
    const expandedView = (
        <div className={classes.container}>
            <nav className={classes.navbar}>
                <div className={classes.navbarMain}>
                    <Group className={classes.header} justify="space-between">
                        <Text
                            component="span"
                            inherit
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'grape' }}
                            fw="bolder"
                            fz={26}
                        >
                            Admin Panel
                        </Text>
                    </Group>
                    {navItems.map((item) => (
                        <a
                            className={classes.link}
                            data-active={item.label === active || undefined}
                            href={item.href}
                            key={item.label}
                            onClick={(event) => {
                                event.preventDefault();
                                setActive(item.label);
                                router.push(item.href);
                            }}
                        >
                            <item.icon className={classes.linkIcon} stroke={1.5} />
                            <span>{item.label}</span>
                        </a>
                    ))}
                </div>

                <div className={classes.footer}>
                    <a href="#" className={classes.link} onClick={() => setCollapsed(true)}>
                        <IconSwitchHorizontal className={classes.linkIcon} stroke={1.5} />
                        <span>Close Sidebar</span>
                    </a>

                    <a href="/" className={classes.link} onClick={(e) => { e.preventDefault(); router.push('/'); }}>
                        <IconArrowLeft className={classes.linkIcon} stroke={1.5} />
                        <span>Back to Site</span>
                    </a>

                    <UserButton onClick={() => router.push('/account')} />
                </div>
            </nav>
            <div className={classes.content}>
                {children}
            </div>
        </div>
    );

    // Collapsed navbar view
    const NavbarLink = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => {
        return (
            <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
                <UnstyledButton
                    onClick={onClick}
                    className={collapsedClasses.link}
                    data-active={active || undefined}
                >
                    <Icon size={20} stroke={1.5} />
                </UnstyledButton>
            </Tooltip>
        );
    };

    const collapsedView = (
        <div className={collapsedClasses.container}>
            <nav className={collapsedClasses.navbar}>
                <Center className={classes.header}>
                    <Text
                        component="span"
                        inherit
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                        fw="bolder"
                        fz={26}
                    >
                        ADM
                    </Text>
                </Center>

                <div className={collapsedClasses.navbarMain}>
                    <Stack justify="center" gap={0}>
                        {navItems.map((link) => (
                            <NavbarLink
                                {...link}
                                key={link.label}
                                active={link.label === active || undefined}
                                onClick={() => {
                                    setActive(link.label);
                                    router.push(link.href);
                                }}
                            />
                        ))}
                    </Stack>
                </div>

                <Stack justify="center" gap={0}>
                    <NavbarLink icon={IconSwitchHorizontal} label="Open Sidebar" onClick={() => setCollapsed(false)} />
                    <NavbarLink icon={IconArrowLeft} label="Back to Site" onClick={() => router.push('/')} />
                    <Tooltip label="Profile" position="right" transitionProps={{ duration: 0 }}>
                        <UnstyledButton onClick={() => router.push('/account')} className={collapsedClasses.link}>
                            <Avatar
                                src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-8.png"
                                radius="xl"
                                size={35}
                            />
                        </UnstyledButton>
                    </Tooltip>
                </Stack>
            </nav>
            <div className={collapsedClasses.content}>
                {children}
            </div>
        </div>
    );

    return collapsed ? collapsedView : expandedView;
}