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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import Link from 'next/link';
import { useUserData } from '@/hooks/useUserData';
import { useMemo } from 'react';

const data = [
    { link: '/discover', title: 'Discover', icon: IconCompass },
    { link: '/create', title: 'Create', icon: IconPlus },
    { link: '/undress', title: 'Undress', icon: IconShirt, requiresAuth: true },
    // { link: '/video', title: 'Video', icon: IconVideo },
    { link: '/character', title: 'Character', icon: IconUser },
    { link: '/marketplace', title: 'Marketplace', icon: IconShoppingBag },
    { link: '/pricing', title: 'Pricing', icon: IconCurrencyDollar },
    { link: '/news', title: 'News', icon: IconNews },
    // { link: '/auth?auth_mode=signup', title: 'Sign Up', icon: IconUserPlus },
];

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
                                <Link href="/account">
                                    {userData?.displayName ?
                                        <Avatar color="initials" radius="xl" size="md">{userData.displayName.split(" ").map(word => word[0].toUpperCase()).join("")}</Avatar> :
                                        <IconUserCircle color='var(--mantine-color-indigo-filled)' size={40}></IconUserCircle>
                                    }
                                </Link>
                                <Link href="/pricing">
                                    <Text fw={500} fz={20} c='var(--mantine-color-indigo-filled)'>{systemData?.tokens}</Text>
                                </Link>
                            </>}
                            <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="md" />
                        </Group>
                    </Group>

                </Group>
            </header>

            <Box py={15} px={30}>
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

                    <Group justify="center" p="md">
                        {/* {!userLoggedIn && <>
                            <Link
                                href="/auth?auth_mode=signup"
                                className={classes.navLink}
                            >
                                Sign Up
                            </Link>
                            <Anchor href='/auth' onClick={closeDrawer}>
                                <Button size='md' radius="xl">Login</Button>
                            </Anchor>
                        </>
                        } */}
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
                                <Link href="/pricing" onClick={closeDrawer}>
                                    <Text fw={500} fz={20} c='var(--mantine-color-indigo-filled)'>
                                        {systemData?.tokens || 0}
                                    </Text>
                                </Link>
                            </Group>
                        }
                    </Group>
                </ScrollArea>
            </Drawer>
        </Box>
    );
}