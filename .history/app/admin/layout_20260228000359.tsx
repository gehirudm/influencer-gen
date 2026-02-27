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
    Burger,
    Drawer,
    Divider,
    ScrollArea,
    Box,
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
    IconShoppingCart,
    IconSend,
    IconUserCircle,
    IconPhoto,
    IconBrain,
} from '@tabler/icons-react';
import classes from './admin.module.css';
import collapsedClasses from './adminCollapsed.module.css';
import headerClasses from '@/components/Header/Header.module.css';
import { UserButton } from '@/components/UserButton';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';

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
    {
        label: 'Outbox',
        href: '/admin/outbox',
        icon: IconSend,
        subItems: [
            {
                label: 'Compose',
                href: '/admin/outbox',
            },
            {
                label: 'History',
                href: '/admin/outbox/history',
            },
            {
                label: 'Presets',
                href: '/admin/outbox/presets',
            },
        ],
    },
    {
        label: 'Marketplace',
        href: '/admin/marketplace',
        icon: IconShoppingCart,
        subItems: [
            {
                label: 'Characters',
                href: '/admin/marketplace',
            },
            {
                label: 'Purchase Logs',
                href: '/admin/marketplace/logs',
            },
        ],
    },
    {
        label: 'Reference Images',
        href: '/admin/reference-images',
        icon: IconPhoto,
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, systemData, loading, error } = useUserData();
    const [adminChecked, setAdminChecked] = useState(false);
    const [active, setActive] = useState('Dashboard');
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
    const isSmallScreen = useMediaQuery('(max-width: 56.25em)');

    useEffect(() => {
        setCollapsed(isSmallScreen ? isSmallScreen : false);
    }, [isSmallScreen]);

    useEffect(() => {
        const currentPath = pathname || '';
        const activeItem = navItems.find(item => {
            if (item.subItems) {
                return item.subItems.some(sub => currentPath === sub.href) || currentPath === item.href;
            }
            return currentPath === item.href;
        });
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
                        <div key={item.label}>
                            <a
                                className={classes.link}
                                data-active={item.label === active || undefined}
                                href={item.href}
                                onClick={(event) => {
                                    event.preventDefault();
                                    setActive(item.label);
                                    router.push(item.href);
                                }}
                            >
                                <item.icon className={classes.linkIcon} stroke={1.5} />
                                <span>{item.label}</span>
                            </a>
                            {item.subItems && item.label === active && (
                                <div style={{ paddingLeft: '2rem' }}>
                                    {item.subItems.map((subItem) => (
                                        <a
                                            key={subItem.label}
                                            className={classes.link}
                                            data-active={pathname === subItem.href || undefined}
                                            href={subItem.href}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                router.push(subItem.href);
                                            }}
                                            style={{ fontSize: '0.9rem', opacity: 0.8 }}
                                        >
                                            <span>{subItem.label}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
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
                    <Icon size={18} stroke={1.5} />
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

    // Mobile view: header bar with burger + drawer
    const mobileView = (
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top header bar */}
            <Box style={{
                height: '70px',
                backgroundColor: '#110F29',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                flexShrink: 0,
            }}>
                <Text
                    component="span"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'grape' }}
                    fw="bolder"
                    fz={22}
                >
                    Admin Panel
                </Text>
                <Burger opened={drawerOpened} onClick={toggleDrawer} color="white" />
            </Box>

            {/* Page content */}
            <Box style={{ flex: 1, overflow: 'auto' }}>
                {children}
            </Box>

            {/* Slide-out drawer */}
            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                size="100%"
                padding="md"
                title={
                    <Text
                        component="span"
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                        fw="bolder"
                        fz={26}
                    >
                        Admin Panel
                    </Text>
                }
                zIndex={1000000}
            >
                <ScrollArea h="calc(100vh - 80px)" mx="-md">
                    <Divider my="sm" />

                    {navItems.map((item) => (
                        <div key={item.label}>
                            <a
                                className={headerClasses.mobileNavLink}
                                href={item.href}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActive(item.label);
                                    closeDrawer();
                                    router.push(item.href);
                                }}
                                style={item.label === active ? { backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd' } : undefined}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </a>
                            {item.subItems && item.label === active && (
                                <div style={{ paddingLeft: '1rem' }}>
                                    {item.subItems.map((subItem) => (
                                        <a
                                            key={subItem.label}
                                            className={headerClasses.mobileNavLink}
                                            href={subItem.href}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                closeDrawer();
                                                router.push(subItem.href);
                                            }}
                                            style={pathname === subItem.href ? { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#c4b5fd', fontSize: '0.9rem' } : { fontSize: '0.9rem', opacity: 0.8 }}
                                        >
                                            <span>{subItem.label}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <Divider my="sm" />

                    <a
                        className={headerClasses.mobileNavLink}
                        href="/"
                        onClick={(e) => { e.preventDefault(); closeDrawer(); router.push('/'); }}
                    >
                        <IconArrowLeft size={20} />
                        <span>Back to Site</span>
                    </a>

                    <a
                        className={headerClasses.mobileNavLink}
                        href="/account"
                        onClick={(e) => { e.preventDefault(); closeDrawer(); router.push('/account'); }}
                    >
                        <IconUserCircle size={20} />
                        <span>Account</span>
                    </a>
                </ScrollArea>
            </Drawer>
        </Box>
    );

    return isSmallScreen ? mobileView : (collapsed ? collapsedView : expandedView);
}