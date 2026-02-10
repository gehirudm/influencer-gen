"use server"

import { cookies } from 'next/headers';
import firebaseApp from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

/**
 * Validates the current session cookie on the server side.
 * Returns true if valid, false if missing/invalid/expired/mismatched.
 */
export async function validateSession(): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('__session')?.value;

        if (!sessionCookie) {
            return false;
        }

        const auth = getAuth(firebaseApp);
        await auth.verifySessionCookie(sessionCookie, true);
        return true;
    } catch (error) {
        console.error("Session validation failed:", error);
        return false;
    }
}
