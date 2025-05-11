import { useState } from 'react';
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
import { Avatar, Center, Stack, Tooltip, UnstyledButton } from '@mantine/core';
import { useRouter } from 'next/navigation';
import classes from './NavbarCollapsed.module.css';

interface NavbarLinkProps {
    icon: typeof IconCompass;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
    return (
        <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
            <UnstyledButton onClick={onClick} className={classes.link} data-active={active || undefined}>
                <Icon size={20} stroke={1.5} />
            </UnstyledButton>
        </Tooltip>
    );
}

const mockdata = [
    { icon: IconCompass, label: 'Discover', path: '/discover' },
    { icon: IconPlus, label: 'Create', path: '/create' },
    { icon: IconVideo, label: 'Video', path: '/video' },
    { icon: IconFileText, label: 'Projects', path: '/projects' },
    { icon: IconCurrencyDollar, label: 'Pricing', path: '/pricing' },
];

export default function NavbarCollapsed({ children, setCollapsed }: { children?: React.ReactNode, setCollapsed: (value: boolean) => void }) {
    const [active, setActive] = useState(0);
    const router = useRouter();

    const links = mockdata.map((link, index) => (
        <NavbarLink
            {...link}
            key={link.label}
            active={index === active}
            onClick={() => {
                setActive(index);
                router.push(link.path);
            }}
        />
    ));

    return (
        <div className={classes.container}>
            <nav className={classes.navbar}>
                <Center>
                    <Image
                        className="dark:invert"
                        src="/next.svg"
                        alt="Next.js logo"
                        width={180}
                        height={38}
                        priority
                    />
                </Center>

                <div className={classes.navbarMain}>
                    <Stack justify="center" gap={0}>
                        {links}
                    </Stack>
                </div>

                <Stack justify="center" gap={0}>
                    <NavbarLink icon={IconSwitchHorizontal} label="Open Sidebar" onClick={() => setCollapsed(false)} />
                    <Tooltip label="Profile" position="right" transitionProps={{ duration: 0 }}>
                        <UnstyledButton onClick={() => router.push('/profile')} className={classes.link}>
                            <Avatar
                                src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-8.png"
                                radius="xl"
                                size={35}
                            />
                        </UnstyledButton>
                    </Tooltip>
                </Stack>
            </nav>
            <div className={classes.content}>
                {children}
            </div>
        </div>
    );
}