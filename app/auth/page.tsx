"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, TextInput, PasswordInput, Container, Paper, Title, Text, Divider, Anchor, Group, Transition, Checkbox, Center, Loader } from "@mantine/core";
import { hasLength, isEmail, useForm } from "@mantine/form";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendSignInLinkToEmail, signInWithPopup, GoogleAuthProvider, ActionCodeSettings, isSignInWithEmailLink, signInWithEmailLink, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import app from "@/lib/firebase";
import { notifications } from "@mantine/notifications";
import { useRouter } from 'next/navigation'
import { useCsrfToken } from "@/hooks/useCsrfToken";


const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function AuthPage() {
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [isEmailLinkAuthenticating, setIsEmailLinkAuthenticating] = useState(false);

	const router = useRouter()

	const csrfToken = useCsrfToken();

	const form = useForm({
		initialValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
		validate: {
			email: isEmail("Invalid email"),
			password: (value) => {
				if (mode === "signup") { // Only validate password in signup mode
					if (value.length < 10) {
						return "Password must be at least 10 characters long";
					}
					if (!/[A-Z]/.test(value)) {
						return "Password must contain at least one uppercase character";
					}
					if (!/[^a-zA-Z0-9]/.test(value)) {
						return "Password must contain at least one non-alphanumeric character";
					}
				}
				return null;
			},
		},
		validateInputOnChange: true,
	});

	useEffect(() => {
		if (!csrfToken) return;

		// Check if the current URL is a sign-in link
		if (isSignInWithEmailLink(auth, window.location.href)) {
			setIsEmailLinkAuthenticating(true);
			let email = window.localStorage.getItem('emailForSignIn');
			if (!email) {
				email = window.prompt('Please provide your email for confirmation');
			}
			if (email) {
				signInWithEmailLink(auth, email, window.location.href)
					.then(async (userCredential) => {
						window.localStorage.removeItem('emailForSignIn');

						const idToken = await userCredential.user.getIdToken();

						const res = await fetch("/api/auth/session-login", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"X-CSRF-TOKEN": csrfToken as string,
							},
							body: JSON.stringify({ idToken }),
						});

						const { next } = await res.json();
						router.replace(next);
					})
					.catch((error) => {
						notifications.show({
							position: "top-center",
							color: "red",
							title: "Error",
							message: error.message || "Failed to sign in with magic link. Please try again."
						});
						setIsEmailLinkAuthenticating(false);
					});
			}
		}
	}, [auth, router, csrfToken]);

	const handleSubmit = async (values: typeof form.values) => {
		setIsAuthenticating(true); // Set loading state
		try {
			const userCredential = await
				(mode === "signin" ?
					signInWithEmailAndPassword(auth, values.email, values.password) :
					createUserWithEmailAndPassword(auth, values.email, values.password));

			console.log(userCredential);

			const idToken = await userCredential.user.getIdToken();

			const res = await fetch("/api/auth/session-login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRF-TOKEN": csrfToken as string,
				},
				body: JSON.stringify({ idToken, remember: values.rememberMe }),
			});

			const { next } = await res.json();

			notifications.show({
				position: "top-center",
				color: "green",
				title: "Success",
				message: "Signed up successfully!",
			});

			router.replace(next);
		} catch (error: any) {
			notifications.show({
				position: "top-center",
				color: "red",
				title: "Error",
				message: error.message || "Failed to authenticate. Please try again.",
			});
		} finally {
			setIsAuthenticating(false); // Reset loading state
		}
	};

	const handleMagicLink = useCallback(async (email: string) => {
		const actionCodeSettings: ActionCodeSettings = {
			url: window.location.href,
			handleCodeInApp: true,
		};

		setIsSendingMagicLink(true);

		try {
			await sendSignInLinkToEmail(auth, email, actionCodeSettings);
			window.localStorage.setItem("emailForSignIn", email);
			notifications.show({
				position: "top-center",
				color: "green",
				title: "Magic Link Sent",
				message: "Magic Sign In link has been sent to your Inbox!"
			});
		} catch (error: any) {
			notifications.show({
				position: "top-center",
				color: "red",
				title: "Error",
				message: error.message || "Failed to send magic link. Please try again."
			});
		} finally {
			setIsSendingMagicLink(false);
		}
	}, []);

	const handleGoogleSignIn = async () => {
		try {
			await signInWithPopup(auth, provider);
			notifications.show({
				position: "top-center",
				color: "green",
				title: "Success",
				message: "Signed in successfully!",
			});
		} catch (error: any) {
			alert(error.message);
		}
	};

	if (!csrfToken || isEmailLinkAuthenticating) {
		return (
			<Center style={{ height: '100vh' }}>
				<Loader size="xl" />
			</Center>
		);
	}

	return (
		<Container size={420} my={40}>
			<Title fw={900}>
				Welcome to InfluncerGen
			</Title>

			<Paper withBorder shadow="md" p={30} mt={30} radius="md">
				<Title order={2} mt="md">
					{mode === "signup" ? "Sign Up" : "Sign In"}
				</Title>
				<Text c="dimmed" size="sm" mt={5} mb={20}>
					{mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
					<Anchor size="sm" component="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
						{mode === "signup" ? "Sign in" : "Sign up"}
					</Anchor>
				</Text>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<TextInput
						withAsterisk
						label="Email"
						placeholder="you@example.com"
						required
						{...form.getInputProps('email')}
					/>
					<Transition
						mounted={form.isValid('email')}
						transition="fade"
						duration={400}
						timingFunction="ease"
					>
						{(styles) => <div style={styles}>
							<Button fullWidth mt="md" onClick={() => handleMagicLink(form.values.email)} loading={isSendingMagicLink}>
								Send Magic Link
							</Button>
						</div>}
					</Transition>
					<PasswordInput
						label="Password"
						placeholder="Your password"
						required
						mt="md"
						{...form.getInputProps('password')}
					/>
					<Checkbox
						label="Remember Me"
						mt="md"
						{...form.getInputProps('rememberMe', { type: 'checkbox' })}
					/>
					<Button fullWidth mt="xl" type="submit" loading={isAuthenticating}>
						{mode === "signup" ? "Sign Up" : mode === "signin" ? "Sign In" : "Send Sign-In Link"}
					</Button>
				</form>

				<Divider label="Or continue with" labelPosition="center" my="lg" />

				<Group grow mb="md" mt="md">
					<Button variant="outline" onClick={handleGoogleSignIn}>
						Google
					</Button>
				</Group>
			</Paper>
		</Container>
	);
}