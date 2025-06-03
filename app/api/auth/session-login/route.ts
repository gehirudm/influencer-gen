import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';
import csrf from "csrf";
import { serialize } from 'cookie';

const tokens = new csrf();
const secret = process.env.CSRF_SECRET || tokens.secretSync();
const db = getFirestore(adminApp);

export async function POST(request: NextRequest) {
    const { idToken, remember } = await request.json();
    const csrfToken = request.headers.get("x-csrf-token");

    const auth = getAuth(adminApp);

    if (!csrfToken || !tokens.verify(secret, csrfToken)) {
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    try {
        const decoded = await verifyIdToken(auth, idToken);
        const sessionCookie = await createSessionCookie(auth, idToken, remember);
        const cookie = createCookie(sessionCookie, remember);

        const nextPage = await ensureUserDocumentExists(decoded);

        const response = NextResponse.json({ message: "ok", next: nextPage });
        response.headers.set("Set-Cookie", cookie);

        return response;
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function verifyIdToken(auth: any, idToken: string): Promise<DecodedIdToken> {
    try {
        return await auth.verifyIdToken(idToken);
    } catch (error) {
        throw new Error("Invalid ID token");
    }
}

async function createSessionCookie(auth: any, idToken: string, remember: boolean): Promise<string> {
    const expiresIn = remember ? 60 * 60 * 24 * 14 * 1000 : 60 * 60 * 24 * 5 * 1000;
    return await auth.createSessionCookie(idToken, { expiresIn });
}

function createCookie(sessionCookie: string, remember: boolean): string {
    const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
    };

    if (remember) {
        cookieOptions.maxAge = 60 * 60 * 24 * 14;
    }

    return serialize("session", sessionCookie, cookieOptions);
}

async function ensureUserDocumentExists(decoded: DecodedIdToken): Promise<string> {
    const userId = decoded.uid;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        const userData = {
            createdAt: new Date().toISOString(),
            email: decoded.email || null,
            avatarUrl: decoded.picture || null,
            displayName: decoded.name || null,
        };

        await userRef.set(userData);

        await userRef.collection('private').doc('system').set({
            tokens: 100,
        });

        console.log(`User document created for user ID: ${userId}`);
        return "/landing";
    }

    return "/discover";
}