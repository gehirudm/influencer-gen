"use server"

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server action to log out a user by deleting their session cookie
 * @returns Success status and message
 */
export async function clearSessionCookie(): Promise<boolean> {
    try {
        // Delete the session cookie
        (await cookies()).delete({
            name: 'session',
            path: '/',
            // Use the same settings that were used when creating the cookie
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        return true;
    } catch (error) {
        console.error('Error during clearning session cookie:', error);
        return false;
    }
}