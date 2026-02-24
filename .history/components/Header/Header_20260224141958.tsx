"use client"

import {
    IconCompass,
    IconCurrencyDollar,
    IconPlus,
    IconUser,
    IconVideo,
    IconNews,
    IconBook,
    IconUserCircle,
    IconUserPlus,
    IconShirt,
    IconShoppingBag,
    IconCoins,
    IconSparkles,
    IconFolder,
    IconBell,
} from '@tabler/icons-react';
import {
    Box,
    Burger,
    Button,
    Divider,
    Drawer,
    Group,
    ScrollArea,
    Text,
    useMantineTheme,
    Avatar,
    ActionIcon,
    Anchor,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import Link from 'next/link';
import { useUserData } from '@/hooks/useUserData';
import { useMemo } from 'react';

const data = [
    { link: '/assets', title: 'Assets', icon: IconFolder },
    { link: '/generate-images', title: 'Generate Images', icon: IconPlus },
    { link: '/undress', title: 'Undress', icon: IconShirt, requiresAuth: true },
    { link: '/character', title: 'Character', icon: IconUser },
    { link: '/pricing', title: 'Pricing', icon: IconCurrencyDollar },
    { link: '/inbox', title: 'Inbox', icon: IconBell },
    { link: '/marketplace', title: 'Marketplace', icon: IconShoppingBag },
];

const tokenBadgeStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'opacity 0.2s',
};

export function Header({ children }: { children?: React.ReactNode }) {
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
    const { userData, systemData, loading, error } = useUserData();

    const userLoggedIn = useMemo(() => !loading && userData != null, [loading, userData]);

    return (
        <Box h="full" w="full">
            <header className={classes.header}>
                <Group justify="space-between" h="100%" w="100%" px="md">
                    {/* Logo */}
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        <img
                            src="/fantazy_text.png"
                            alt="Fantazy.Pro Logo"
                            style={{
                                height: '42px',
                                width: 'auto'
                            }}
                        />
                    </Link>

                    <Group>
                        {/* Navigation Links */}
                        <Group h="100%" gap="md" visibleFrom="md">
                            {data
                                .filter(item => !item.requiresAuth || userLoggedIn)
                                .map((item) => (
                                    <Link
                                        key={item.title}
                                        href={item.link}
                                        className={classes.navLink}
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                        </Group>

                        {/* User Section */}

                        <Group>
                            {!userLoggedIn && <>
                                <Link
                                    href="/auth?auth_mode=signup"
                                    className={classes.navLink}
                                >
                                    Sign Up
                                </Link>
                                <Anchor href='/auth'><Button size='md' radius="xl">Login</Button></Anchor>
                            </>}
                            {userLoggedIn && <>
                                {/* Token Balances */}
                                {systemData && (
                                    <Group gap={6} visibleFrom="sm">
                                        <Tooltip label={`${systemData.tokens.toLocaleString()} Generation Tokens`} withArrow>
                                            <Link href="/pricing" style={{
                                                ...tokenBadgeStyle,
                                                background: 'rgba(99, 102, 241, 0.15)',
                                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                                color: '#c7d2fe',
                                            }}>
                                                <IconCoins size={14} />
                                                <span>{systemData.tokens.toLocaleString()}</span>
                                            </Link>
                                        </Tooltip>
                                        <Tooltip label={`${systemData.loraTokens} LoRA Training Tokens`} withArrow>
                                            <Link href="/pricing" style={{
                                                ...tokenBadgeStyle,
                                                background: 'rgba(168, 85, 247, 0.15)',
                                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                                color: '#ddd6fe',
                                            }}>
                                                <IconSparkles size={14} />
                                                <span>{systemData.loraTokens}</span>
                                            </Link>
                                        </Tooltip>
                                    </Group>
                                )}
                                <Link href="/account">
                                    {userData?.displayName ?
                                        <Avatar color="initials" radius="xl" size="md">{userData.displayName.split(" ").map(word => word[0].toUpperCase()).join("")}</Avatar> :
                                        <IconUserCircle color='var(--mantine-color-indigo-filled)' size={40}></IconUserCircle>
                                    }
                                </Link>
                            </>}
                            <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="md" />
                        </Group>
                    </Group>

                </Group>
            </header>

            <Box pt={20} pb={15} px={{ base: 20, md: 30 }}>
                {children}
            </Box>

            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                size="100%"
                padding="md"
                title={
                    <Text
                        component="span"
                        inherit
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan' }}
                        fw="bolder"
                        fz={26}
                    >
                        Fantazy<Text component="span" inherit fw="bolder" fz={26}>.Pro</Text>
                    </Text>
                }
                hiddenFrom="md"
                zIndex={1000000}
            >
                <ScrollArea h="calc(100vh - 80px)" mx="-md">
                    <Divider my="sm" />

                    {data
                        .filter(item => !item.requiresAuth || userLoggedIn)
                        .map((item) => (
                            <Link
                                key={item.title}
                                href={item.link}
                                className={classes.mobileNavLink}
                                onClick={closeDrawer}
                            >
                                <item.icon size={20} />
                                <span>{item.title}</span>
                            </Link>
                        ))}

                    <Divider my="sm" />

                    {/* Mobile Token Balances */}
                    {userLoggedIn && systemData && (
                        <div style={{ padding: '0 16px', marginBottom: '12px' }}>
                            <Link href="/pricing" onClick={closeDrawer} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    flexWrap: 'wrap',
                                }}>
                                    <div style={{
                                        ...tokenBadgeStyle,
                                        background: 'rgba(99, 102, 241, 0.15)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        color: '#c7d2fe',
                                        padding: '8px 14px',
                                    }}>
                                        <IconCoins size={16} />
                                        <span>{systemData.tokens.toLocaleString()} Tokens</span>
                                    </div>
                                    <div style={{
                                        ...tokenBadgeStyle,
                                        background: 'rgba(168, 85, 247, 0.15)',
                                        border: '1px solid rgba(168, 85, 247, 0.3)',
                                        color: '#ddd6fe',
                                        padding: '8px 14px',
                                    }}>
                                        <IconSparkles size={16} />
                                        <span>{systemData.loraTokens} LoRA</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}

                    <Group justify="center" p="md">
                        {userLoggedIn &&
                            <Group>
                                <Link href="/account" onClick={closeDrawer}>
                                    {userData?.displayName ?
                                        <Avatar color="initials" radius="xl" size="md">
                                            {userData.displayName.split(" ").map(word => word[0].toUpperCase()).join("")}
                                        </Avatar> :
                                        <IconUserCircle color='var(--mantine-color-indigo-filled)' size={40} />
                                    }
                                </Link>
                            </Group>
                        }
                    </Group>
                </ScrollArea>
            </Drawer>
        </Box>
    );
}