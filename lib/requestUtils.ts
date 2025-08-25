import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import firebaseApp from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

export async function verifyRequestCookies(request: NextRequest): Promise<{ shouldReturn: boolean, response: NextResponse, userId: string }> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    // Validate required parameters
    if (!sessionCookie) {
        return {
            shouldReturn: true,
            response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
            userId: ''
        };
    }
    const auth = getAuth(firebaseApp);

    // Verify user authentication
    let userId;
    try {
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        userId = decodedToken.uid;
    } catch (error) {
        return {
            shouldReturn: true,
            response: NextResponse.json({ error: "Invalid or expired authentication" }, { status: 401 }),
            userId: ''
        }
    }

    return {
        shouldReturn: false,
        // @ts-ignore
        response: null as NextResponse,
        userId
    }
}