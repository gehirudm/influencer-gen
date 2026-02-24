"use client"

import { useUserData } from '@/hooks/useUserData';
import { Button, Group, Skeleton } from '@mantine/core';
import { IconCoins, IconSparkles } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import classes from './TokenBar.module.css';

export function TokenBar() {
    const { systemData, loading, user } = useUserData();
    const router = useRouter();

    // Don't show the bar if user is not logged in
    if (!user) {
        return null;
    }

    const handleAddTokens = () => {
        router.push('/pricing');
    };

    return (
        <div className={classes.tokenBar}>
            <div className={classes.content}>
                <div className={classes.desktopSpacer} />
                <div className={classes.tokenCount}>
                    <IconCoins className={classes.tokenIcon} />
                    <span>Tokens:</span>
                    {loading ? (
                        <Skeleton height={16} width={50} className={classes.skeleton} />
                    ) : (
                        <span className={classes.tokenValue}>
                            {systemData?.tokens?.toLocaleString() ?? 0}
                        </span>
                    )}
                </div>

                <div className={classes.divider} />

                <div className={classes.tokenCount}>
                    <IconSparkles className={classes.loraIcon} />
                    <span>LoRA:</span>
                    {loading ? (
                        <Skeleton height={16} width={30} className={classes.skeleton} />
                    ) : (
                        <span className={classes.loraValue}>
                            {systemData?.loraTokens ?? 0}
                        </span>
                    )}
                </div>

                <Button
                    onClick={handleAddTokens}
                    size="xs"
                    className={classes.addButton}
                    disabled={loading}
                >
                    Add Tokens
                </Button>
            </div>
        </div>
    );
}
