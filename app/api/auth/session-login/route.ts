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

    if (!csrfToken) {
        return NextResponse.json({ error: "CSRF token not provided" }, { status: 403 });
    }

    if (!tokens.verify(secret, csrfToken)) {
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    let decoded: DecodedIdToken;

    try {
        decoded = await auth.verifyIdToken(idToken);
    } catch (error) {
        return NextResponse.json({ error: "Invalid ID token" }, { status: 403 });
    }

    const userId = decoded.uid;

    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: 60 * 60 * 24 * 5 * 1000,
    });

    const cookieOptions: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
    };

    if (remember) {
        cookieOptions.maxAge = 60 * 60 * 24 * 14;
    }

    const cookie = serialize("session", sessionCookie, cookieOptions);

    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // Create a new user document with default tokens
            await userRef.set({
                createdAt: new Date().toISOString(),
            });

            // Set tokens in the private subcollection
            await userRef.collection('private').doc('data').set({
                tokens: 100,
            });

            console.log(`User document created for user ID: ${userId}`);
        }

        const nextPage = userDoc.exists ? "/discover" : "/landing";

        const response = NextResponse.json({ message: "ok", next: nextPage });
        response.headers.set("Set-Cookie", cookie);

        return response;
    } catch (error) {
        console.error('Error verifying session or checking/creating user document:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}