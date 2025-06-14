'use client';

import { Button, Container, Group, Text, Title, Image, Stack } from '@mantine/core';
import { IconArrowLeft, IconHome } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import classes from './not-found.module.css';
import { Header } from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';

export default function NotFoundPage() {
    const router = useRouter();

    return (
        <Header>
            <Container className={classes.root}>
                <div className={classes.inner}>
                    <div className={classes.content}>
                        <Title className={classes.title}>Something is not right...</Title>
                        <Text c="dimmed" size="lg" ta="center" className={classes.description}>
                            The page you are trying to open does not exist. You may have mistyped the address, or the
                            page has been moved to another URL. If you think this is an error, please contact support.
                        </Text>
                    </div>
                </div>
            </Container>
            <Footer></Footer>
        </Header>
    );
}