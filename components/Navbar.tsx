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
import { Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import classes from './Navbar.module.css';
import { UserButton } from './UserButton';

const data = [
    { link: '/discover', label: 'Discover', icon: IconCompass },
    { link: '/create', label: 'Create', icon: IconPlus },
    { link: '/video', label: 'Video', icon: IconVideo },
    { link: '/character', label: 'Character', icon: IconUser },
    { link: '/projects', label: 'Projects', icon: IconFileText },
    { link: '/pricing', label: 'Pricing', icon: IconCurrencyDollar },
];

export default function Navbar({ children, setCollapsed }: { children?: React.ReactNode, setCollapsed: (value: boolean) => void }) {
    const [active, setActive] = useState('Discover');
    const router = useRouter();

    const links = data.map((item) => (
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
    ));

    return (
        <div className={classes.container}>
            <nav className={classes.navbar}>
                <div className={classes.navbarMain}>
                    <Group className={classes.header} justify="space-between">
                        <Image
                            className="dark:invert"
                            src="/next.svg"
                            alt="Next.js logo"
                            width={180}
                            height={38}
                            priority
                        />
                    </Group>
                    {links}
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
}