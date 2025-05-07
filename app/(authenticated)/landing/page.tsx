"use client"

import adminApp from '@/lib/firebaseAdmin';
import {
    Button,
    Checkbox,
    Paper,
    TextInput,
    Title,
} from '@mantine/core';
import classes from './Onboarding.module.css';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const [firstTime, setFirstTime] = useState(false);

    useEffect(() => {
        // Fetch data or perform side effects here
        async function fetchData() {
            try {
                // Call an API route or perform client-side logic
                const response = await fetch('/api/auth/check-user');
                const data = await response.json();
                setFirstTime(data.firstTime);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }

        fetchData();
    }, []);

    return (
        <div className={classes.wrapper}>
            <Paper className={classes.form}>
                <Title order={2} className={classes.title}>
                    Let's complete your profile
                </Title>

                <TextInput label="Username" placeholder="coolguy77" size="md" radius="md" />
                <TextInput label="Display Name" placeholder="Cool Guy" mt="md" size="md" radius="md" />
                <Checkbox label="Keep me logged in" mt="xl" size="md" />
                <Button fullWidth mt="xl" size="md" radius="md">
                    Continue
                </Button>
            </Paper>
        </div>
    );
}