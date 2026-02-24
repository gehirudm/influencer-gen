"use client";

import { useEffect, useState } from "react";
import { Button, PasswordInput, Container, Paper, Title, Text, Anchor, Center, Loader, Box, Alert, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getAuth, GoogleAuthProvider, verifyPasswordResetCode, applyActionCode, confirmPasswordReset } from "firebase/auth";
import app from "@/lib/firebase";
import { notifications } from "@mantine/notifications";
import { useRouter } from 'next/navigation'
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { Header } from "@/components/Header/Header";

import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";


const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function AuthPage() {
    const [mode, setMode] = useQueryState('mode', parseAsStringLiteral(["resetPassword", "verifyEmail", "invalid"] as const).withDefault("invalid"))
    const [oobCode, setOobCode] = useQueryState('oobCode', parseAsString);
    const [actionEmail, setActionEmail] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [actionCompleted, setActionCompleted] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    
    const router = useRouter();

    // Form for password reset
    const resetPasswordForm = useForm({
        initialValues: {
            newPassword: '',
            confirmPassword: '',
        },
        validate: {
            newPassword: (value) => {
                if (value.length < 10) {
                    return "Password must be at least 10 characters long";
                }
                if (!/[A-Z]/.test(value)) {
                    return "Password must contain at least one uppercase character";
                }
                if (!/[^a-zA-Z0-9]/.test(value)) {
                    return "Password must contain at least one non-alphanumeric character";
                }
                return null;
            },
            confirmPassword: (value, values) => 
                value !== values.newPassword ? 'Passwords do not match' : null,
        },
        validateInputOnChange: true,
    });

    // Handle Firebase action code operations
    useEffect(() => {
        if (!oobCode) return;

        const handleActionCode = async () => {
            setProcessing(true);
            setActionError(null);

            try {
                if (mode === 'resetPassword') {
                    // Verify the password reset code
                    const email = await verifyPasswordResetCode(auth, oobCode);
                    setActionEmail(email);
                } else if (mode === 'verifyEmail') {
                    // Apply the email verification code
                    await applyActionCode(auth, oobCode);
                    setActionCompleted(true);
                    
                    // Clear the oobCode from URL to prevent reuse
                    setOobCode(null);
                }
            } catch (error: any) {
                console.error('Error handling action code:', error);
                setActionError(error.message || 'Invalid or expired action code. Please try again.');
            } finally {
                setProcessing(false);
            }
        };

        handleActionCode();
    }, [oobCode, mode, setOobCode]);

    const handleResetPassword = async (values: typeof resetPasswordForm.values) => {
        if (!oobCode) {
            setActionError('Missing action code. Please use the link from your email.');
            return;
        }

        setProcessing(true);
        setActionError(null);

        try {
            // Confirm the password reset
            await confirmPasswordReset(auth, oobCode, values.newPassword);
            setActionCompleted(true);
            
            // Clear the oobCode from URL to prevent reuse
            setOobCode(null);
            
            notifications.show({
                title: 'Success',
                message: 'Your password has been reset successfully. You can now log in with your new password.',
                color: 'green',
            });
        } catch (error: any) {
            console.error('Error resetting password:', error);
            setActionError(error.message || 'Failed to reset password. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (processing) {
        return (
            <>
                <Header />
                <Center style={{ height: '60vh' }}>
                    <Stack align="center" justify="center">
                        <Loader size="xl" mx="auto" />
                        <Text ta="center" mt="md">Processing your request...</Text>
                    </Stack>
                </Center>
            </>
        );
    }

    // Render error state for verification
    if ((mode === 'resetPassword' || mode === 'verifyEmail') && actionError) {
        return (
            <>
                <Header />
                <Container size="md" py={40}>
                    <Paper radius="md" p="xl" withBorder>
                        <Title order={2} ta="center" mt="md" mb="md">
                            {mode === 'resetPassword' ? 'Password Reset Failed' : 'Email Verification Failed'}
                        </Title>
                        
                        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md">
                            {actionError}
                        </Alert>
                        
                        <Button fullWidth mt="xl" onClick={() => router.push('/auth')}>
                            Back to Login
                        </Button>
                    </Paper>
                </Container>
            </>
        );
    }

    // Render password reset form
    if (mode === 'resetPassword' && oobCode && !actionCompleted) {
        return (
            <>
                <Header />
                <Container size="md" py={40}>
                    <Paper radius="md" p="xl" withBorder>
                        <Title order={2} ta="center" mt="md" mb="md">
                            Reset Your Password
                        </Title>
                        
                        {actionEmail && (
                            <Text c="dimmed" size="sm" ta="center" mb="lg">
                                Create a new password for {actionEmail}
                            </Text>
                        )}
                        
                        {actionError && (
                            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md">
                                {actionError}
                            </Alert>
                        )}
                        
                        <form onSubmit={resetPasswordForm.onSubmit(handleResetPassword)}>
                            <PasswordInput
                                label="New Password"
                                placeholder="Enter your new password"
                                required
                                mt="md"
                                {...resetPasswordForm.getInputProps('newPassword')}
                            />
                            <PasswordInput
                                label="Confirm Password"
                                placeholder="Confirm your new password"
                                required
                                mt="md"
                                {...resetPasswordForm.getInputProps('confirmPassword')}
                            />
                            <Button fullWidth mt="xl" type="submit" loading={processing}>
                                Reset Password
                            </Button>
                            
                            <Text c="dimmed" size="sm" ta="center" mt="lg">
                                Remember your password?{" "}
                                <Anchor href="/auth" size="sm">
                                    Back to login
                                </Anchor>
                            </Text>
                        </form>
                    </Paper>
                </Container>
            </>
        );
    }

    // Render email verification success
    if (mode === 'verifyEmail' && actionCompleted) {
        return (
            <>
                <Header />
                <Container size="md" py={40}>
                    <Paper radius="md" p="xl" withBorder>
                        <Title order={2} ta="center" mt="md" mb="md">
                            Email Verified
                        </Title>
                        
                        <Alert icon={<IconCheck size={16} />} title="Success" color="green" mb="md">
                            Your email has been successfully verified. You can now use all features of your account.
                        </Alert>
                        
                        <Button fullWidth mt="xl" onClick={() => router.push('/authenticated/dashboard')}>
                            Go to Dashboard
                        </Button>
                        
                        <Text c="dimmed" size="sm" ta="center" mt="lg">
                            Not signed in?{" "}
                            <Anchor href="/auth" size="sm">
                                Sign in now
                            </Anchor>
                        </Text>
                    </Paper>
                </Container>
            </>
        );
    }

    // Render password reset success
    if (mode === 'resetPassword' && actionCompleted) {
        return (
            <>
                <Header />
                <Container size="md" py={40}>
                    <Paper radius="md" p="xl" withBorder>
                        <Title order={2} ta="center" mt="md" mb="md">
                            Password Reset Complete
                        </Title>
                        
                        <Alert icon={<IconCheck size={16} />} title="Success" color="green" mb="md">
                            Your password has been reset successfully. You can now log in with your new password.
                        </Alert>
                        
                        <Button fullWidth mt="xl" onClick={() => router.push('/auth')}>
                            Go to Login
                        </Button>
                    </Paper>
                </Container>
            </>
        );
    }
}