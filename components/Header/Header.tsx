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

const data = [
    { link: '/discover', title: 'Discover', icon: IconCompass },
    { link: '/create', title: 'Create', icon: IconPlus },
    { link: '/video', title: 'Video', icon: IconVideo },
    { link: '/character', title: 'Character', icon: IconUser },
    { link: '/pricing', title: 'Pricing', icon: IconCurrencyDollar },
    { link: '/news', title: 'News', icon: IconNews },
    { link: '/learn', title: 'Learn', icon: IconBook },
];

export function Header({ children }: { children?: React.ReactNode }) {
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
    const { userData, systemData, loading, error } = useUserData();

    return (
        <Box h="full" w="full">
            <header className={classes.header}>
                <Group justify="space-between" h="100%" w="100%" px="md">
                    {/* Logo */}
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <Text
                            component="span"
                            inherit
                            variant="gradient"
                            gradient={{ from: 'blue', to: 'cyan' }}
                            fw="bolder"
                            fz={26}
                        >
                            Fantazy
                        </Text>
                        <Text
                            component="span"
                            inherit
                            fw="bolder"
                            fz={26}
                        >
                            .Pro
                        </Text>
                    </Link>

                    <Group>
                        {/* Navigation Links */}
                        <Group h="100%" gap="md" visibleFrom="md">
                            {data.map((item) => (
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
                        <Group visibleFrom="md">
                            {loading && <Anchor href='/auth'><Button size='md' radius="xl">Login</Button></Anchor>}
                            {(!loading) && <>
                                {userData?.displayName ?
                                    <Avatar color="initials" radius="xl" size="md">{userData.displayName.split(" ").map(word => word[0].toUpperCase()).join("")}</Avatar> :
                                    <IconUserCircle color='var(--mantine-color-indigo-filled)' size={40}></IconUserCircle>
                                }
                                <Text fw={500} fz={20} c='var(--mantine-color-indigo-filled)'>{systemData?.tokens}</Text>
                            </>}
                        </Group>
                    </Group>

                    <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="md" />
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
                        InfluencerGEN
                    </Text>
                }
                hiddenFrom="md"
                zIndex={1000000}
            >
                <ScrollArea h="calc(100vh - 80px)" mx="-md">
                    <Divider my="sm" />

                    {data.map((item) => (
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
                        <Avatar
                            color="indigo"
                            radius="xl"
                            size="lg"
                        >
                            <Text fw={500}>550</Text>
                        </Avatar>
                    </Group>
                </ScrollArea>
            </Drawer>
        </Box>
    );
}