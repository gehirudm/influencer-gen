"use client";

import { useState } from "react";
import { Button, TextInput, PasswordInput, Container, Paper, Title, Text, Divider, Anchor, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendSignInLinkToEmail, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import app from "@/lib/firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "passwordless">("signin");
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value: string) =>
        mode !== "passwordless" && value.length < 6 ? "Password should be at least 6 characters" : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
        alert("Signed up successfully!");
      } else if (mode === "signin") {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        alert("Signed in successfully!");
      } else if (mode === "passwordless") {
        const actionCodeSettings = {
          url: window.location.href,
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, values.email, actionCodeSettings);
        window.localStorage.setItem("emailForSignIn", values.email);
        alert("Passwordless email link sent! Check your inbox.");
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      alert("Signed in with Google!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title fw={900}>
        Welcome to InfluncerGen
      </Title>
      <Text c="dimmed" size="sm" mt={5}>
        {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
        <Anchor size="sm" component="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
          {mode === "signup" ? "Sign in" : "Sign up"}
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            required
            {...form.getInputProps("email")}
          />
          {mode !== "passwordless" && (
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              mt="md"
              {...form.getInputProps("password")}
            />
          )}
          <Button fullWidth mt="xl" type="submit">
            {mode === "signup" ? "Sign Up" : mode === "signin" ? "Sign In" : "Send Sign-In Link"}
          </Button>
        </form>

        <Divider label="Or continue with" labelPosition="center" my="lg" />

        <Group grow mb="md" mt="md">
          <Button variant="outline" onClick={handleGoogleSignIn}>
            Google
          </Button>
        </Group>

        <Anchor
          component="button"
          type="button"
          c="dimmed"
          onClick={() => setMode(mode === "passwordless" ? "signin" : "passwordless")}
          size="xs"
          mt="sm"
        >
          {mode === "passwordless" ? "Back to Sign In" : "Or sign in with a magic link"}
        </Anchor>
      </Paper>
    </Container>
  );
}