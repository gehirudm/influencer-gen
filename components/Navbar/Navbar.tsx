import { useState, useEffect } from 'react';
import Image from "next/image";
import {
    IconVideo,
    IconFileText,
    IconCurrencyDollar,
    IconCompass,
    IconPlus,
    IconSwitchHorizontal,
    IconUser,
} from '@tabler/icons-react';
import { Avatar, Center, Group, Stack, Tooltip, UnstyledButton, Text, Mark } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import classes from './Navbar.module.css';
import collapsedClasses from './NavbarCollapsed.module.css';
import { UserButton } from '../UserButton';
import { useMediaQuery } from '@mantine/hooks';

const data = [
    { link: '/discover', label: 'Discover', icon: IconCompass },
    { link: '/create', label: 'Create', icon: IconPlus },
    { link: '/video', label: 'Video', icon: IconVideo },
    { link: '/character', label: 'Character', icon: IconUser },
    { link: '/projects', label: 'Projects', icon: IconFileText },
    { link: '/pricing', label: 'Pricing', icon: IconCurrencyDollar },
];

export default function Navbar({ children }: { children?: React.ReactNode }) {
    const [active, setActive] = useState('Discover');
    const [collapsed, setCollapsed] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const isSmallScreen = useMediaQuery('(max-width: 56.25em)');

    // Set collapsed state based on screen size only on initial render and when screen size changes
    useEffect(() => {
        setCollapsed(isSmallScreen ? isSmallScreen : false);
    }, [isSmallScreen]);

    useEffect(() => {
        const currentPath = pathname || '';
        const activeItem = data.find(item => currentPath.startsWith(item.link));
        if (activeItem) {
            setActive(activeItem.label);
        }
    }, [pathname]);

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
                            gradient={{ from: 'blue', to: 'cyan' }}
                            fw="bolder"
                            fz={26}
                        >
                            InfluencerGEN
                        </Text>
                    </Group>
                    {data.map((item) => (
                        <a
                            className={classes.link}
                            data-active={item.label === active || undefined}
                            href={item.link}
                            key={item.label}
                            onClick={(event) => {
                                event.preventDefault();
                                setActive(item.label);
                                router.push(item.link);
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

                    <UserButton onClick={() => router.push('/profile')} />
                </div>
            </nav>
            <div className={classes.content}>
                {children}
            </div>
        </div>
    );

    // Collapsed navbar view (NavbarLink component inlined for simplicity)
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
                        gradient={{ from: 'blue', to: 'cyan' }}
                        fw="bolder"
                        fz={26}
                    >
                        IGEN
                    </Text>
                </Center>

                <div className={collapsedClasses.navbarMain}>
                    <Stack justify="center" gap={0}>
                        {data.map((link, index) => (
                            <NavbarLink
                                {...link}
                                key={link.label}
                                active={link.label === active || undefined}
                                onClick={() => {
                                    setActive(link.label);
                                    router.push(link.link);
                                }}
                            />
                        ))}
                    </Stack>
                </div>

                <Stack justify="center" gap={0}>
                    <NavbarLink icon={IconSwitchHorizontal} label="Open Sidebar" onClick={() => setCollapsed(false)} />
                    <Tooltip label="Profile" position="right" transitionProps={{ duration: 0 }}>
                        <UnstyledButton onClick={() => router.push('/profile')} className={collapsedClasses.link}>
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