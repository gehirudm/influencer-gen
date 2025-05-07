import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

// Define the cost of generating an image
const IMAGE_GENERATION_COST = 1; // Cost in tokens
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

async function verifySessionCookie(sessionCookie: string) {
    try {
        const decodedClaims = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
        return decodedClaims.uid;
    } catch (error) {
        console.error('Invalid session cookie:', error);
        throw new Error('Unauthorized: Invalid session');
    }
}

async function checkAndDeductTokens(userId: string, db: FirebaseFirestore.Firestore) {
    const userRef = db.collection('users').doc(userId).collection('private').doc('data');
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new Error('User profile not found');
    }

    const userData = userDoc.data();
    const currentTokens = userData?.tokens || 0;

    if (currentTokens < IMAGE_GENERATION_COST) {
        throw new Error('Insufficient tokens');
    }

    await db.runTransaction(async (transaction) => {
        const userDocInTransaction = await transaction.get(userRef);
        if (!userDocInTransaction.exists) {
            throw new Error('User document does not exist');
        }

        const userDataInTransaction = userDocInTransaction.data();
        const updatedTokens = (userDataInTransaction?.tokens || 0) - IMAGE_GENERATION_COST;

        if (updatedTokens < 0) {
            throw new Error('Insufficient tokens');
        }

        transaction.update(userRef, { tokens: updatedTokens });
    });

    console.log(`Deducted ${IMAGE_GENERATION_COST} tokens from user ${userId}`);
    return currentTokens - IMAGE_GENERATION_COST;
}

async function generateImage(prompt: string, width: number, height: number, style: string) {
    const url = "https://api.runpod.ai/v2/k7649vd0rf6sof/run";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RUNPOD_API_KEY}`
        },
        body: JSON.stringify({
            input: {
                prompt,
                width,
                height,
                style
            },
            webhook: "https://influencer-gen.vercel.app/api/webhook"
        })
    });

    console.log(response.body)

    if (!response.ok) {
        throw new Error('Failed to generate image');
    }

    const data = await response.json();
    return data; // Return the entire response data
}

async function createJobDocument(db: FirebaseFirestore.Firestore, userId: string, jobData: any, metadata: any) {
    const jobRef = db.collection('jobs').doc(jobData.id);
    await jobRef.set({
        userId,
        status: jobData.status,
        metadata,
        createdAt: new Date().toISOString(),
    });
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json(
                { error: 'Unauthorized: No session found' },
                { status: 401 }
            );
        }

        const userId = await verifySessionCookie(sessionCookie);

        const body = await request.json();
        const { prompt, width = 512, height = 512, style = 'default' } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const db = getFirestore(adminApp);
        const tokensRemaining = await checkAndDeductTokens(userId, db);

        console.log('Image generation requested:', { prompt, width, height, style });

        const jobData = await generateImage(prompt, width, height, style);

        // Create a job document in Firestore
        await createJobDocument(db, userId, jobData, { prompt, width, height, style });

        const response = {
            success: true,
            jobId: jobData.id,
            tokensRemaining
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Error in image generation endpoint:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process image generation request' },
            { status: 500 }
        );
    }
}