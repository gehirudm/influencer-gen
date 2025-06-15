"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, TextInput, PasswordInput, Container, Paper, Title, Text, Divider, Anchor, Group, Transition, Checkbox, Center, Loader, Box } from "@mantine/core";
import { hasLength, isEmail, useForm } from "@mantine/form";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendSignInLinkToEmail, signInWithPopup, GoogleAuthProvider, ActionCodeSettings, isSignInWithEmailLink, signInWithEmailLink, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import app from "@/lib/firebase";
import { notifications } from "@mantine/notifications";
import { useRouter } from 'next/navigation'
import { useCsrfToken } from "@/hooks/useCsrfToken";
import { IconBrandGoogle, IconBrandGoogleFilled } from "@tabler/icons-react";
import { Header } from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";


const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function AuthPage() {
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [isEmailLinkAuthenticating, setIsEmailLinkAuthenticating] = useState(false);

	const router = useRouter()

	const csrfToken = useCsrfToken();

	useEffect(() => {
		// Skip if CSRF token is not available yet
		if (!csrfToken) return;

		// Check if the current URL contains a sign-in link
		if (isSignInWithEmailLink(auth, window.location.href)) {
			// Set loading state
			setIsEmailLinkAuthenticating(true);

			// Get the email from localStorage (saved when the link was sent)
			let email = window.localStorage.getItem('emailForSignIn');

			// If email is not found in localStorage, prompt the user
			if (!email) {
				email = window.prompt('Please provide your email for confirmation');
			}

			if (email) {
				// Complete the sign-in process with the email link
				signInWithEmailLink(auth, email, window.location.href)
					.then(async (userCredential) => {
						// Clear the email from localStorage
						window.localStorage.removeItem('emailForSignIn');

						// Get the ID token
						const idToken = await userCredential.user.getIdToken();

						// Create a session on the server
						const res = await fetch("/api/auth/session-login", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"X-CSRF-TOKEN": csrfToken as string,
							},
							body: JSON.stringify({
								idToken,
								remember: true // Usually magic links imply "remember me"
							}),
						});

						const { next } = await res.json();

						// Show success notification
						notifications.show({
							position: "top-center",
							color: "green",
							title: "Success",
							message: "Signed in successfully with magic link!",
						});

						// Redirect to the appropriate page
						router.replace(next);
					})
					.catch((error) => {
						// Handle errors
						notifications.show({
							position: "top-center",
							color: "red",
							title: "Error",
							message: error.message || "Failed to sign in with magic link. Please try again."
						});

						// Reset loading state
						setIsEmailLinkAuthenticating(false);
					});
			} else {
				// If no email was provided
				notifications.show({
					position: "top-center",
					color: "red",
					title: "Error",
					message: "Email is required to complete sign in with magic link."
				});

				// Reset loading state
				setIsEmailLinkAuthenticating(false);
			}
		}
	}, [auth, router, csrfToken]);

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

	const handleGoogleSignIn = async () => {
		setIsAuthenticating(true); // Set loading state
		try {
			const userCredential = await signInWithPopup(auth, provider);

			// Get the ID token
			const idToken = await userCredential.user.getIdToken();

			// Send the token to the backend to create a session
			const res = await fetch("/api/auth/session-login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRF-TOKEN": csrfToken as string,
				},
				body: JSON.stringify({
					idToken,
					remember: form.values.rememberMe // Use the remember me value from the form
				}),
			});

			const { next } = await res.json();

			notifications.show({
				position: "top-center",
				color: "green",
				title: "Success",
				message: "Signed in successfully with Google!",
			});

			router.replace(next);
		} catch (error: any) {
			notifications.show({
				position: "top-center",
				color: "red",
				title: "Error",
				message: error.message || "Failed to authenticate with Google. Please try again.",
			});
		} finally {
			setIsAuthenticating(false); // Reset loading state
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
		<>
			<Header></Header>
			<Group w="full" my={40} align="center" justify="center" gap={30}>
				<Box p={30} mt={30} w={380}>
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
						<Button variant="outline" onClick={handleGoogleSignIn} leftSection={<IconBrandGoogleFilled></IconBrandGoogleFilled>}>
							Google
						</Button>
					</Group>
				</Box>
				<div className="relative text-center lg:text-left lg:w-1/2 max-w-lg mantine-visible-from-md">
					<img src="/landing/signin.png" alt="signup_model" className="rounded-3xl hidden lg:block brightness-90" />
					<div className="absolute inset-0 flex-col items-center justify-center w-full h-full text-center text-white text-6xl font-bold font-['Outfit'] hidden lg:flex">
						<span>Very good things</span><span>are waiting for</span><span>you!!!</span>
					</div>
				</div>
			</Group>
			<Footer></Footer>
		</>
	);
}