import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';
import "./globals.css";
import "@/theme/styles.css"

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { shadcnTheme } from "@/theme/theme";
import { shadcnCssVariableResolver } from "@/theme/cssVariableResolver";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FantazyPro",
  description: "Create Virtual Influences quick and easily!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      // className={`antialiased`}
      >
        <ColorSchemeScript forceColorScheme="dark" />
        <MantineProvider forceColorScheme="dark" theme={shadcnTheme} cssVariablesResolver={shadcnCssVariableResolver}>
          <Notifications />
          <NuqsAdapter>
            <Suspense>
              {children}
            </Suspense>
          </NuqsAdapter>
        </MantineProvider>
      </body>
    </html>
  );
}
