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

async function generateImage(metadata: ImageGenerationMetadata) {
    const url = "https://api.runpod.ai/v2/k7649vd0rf6sof/run";

    const input: any = {
        prompt: metadata.prompt,
        width: metadata.width,
        height: metadata.height,
        negative_prompt: metadata.neg_prompt
    };

    if (metadata.cfg !== undefined) input.cfg_scale = metadata.cfg;
    if (metadata.seed !== undefined) input.seed = metadata.seed;
    if (metadata.n_samples !== undefined) input.batch_size = metadata.n_samples;
    if (metadata.base_img !== undefined) {
        if (metadata.base_img.startsWith('data:image')) {
            // Strip the data URL prefix to get only the base64 encoded data
            input.base_img = metadata.base_img.split(',')[1];
        } else {
            input.base_img = metadata.base_img;
        }
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RUNPOD_API_KEY}`
        },
        body: JSON.stringify({
            input,
            webhook: "https://influencer-gen.vercel.app//api/webhook"
        })
    });

    console.log(response.body);

    if (!response.ok) {
        throw new Error('Failed to generate image');
    }

    const data: RunPodsCompletedResponseData = await response.json();
    return data; // Return the entire response data
}

async function createJobDocument(
    db: FirebaseFirestore.Firestore,
    userId: string,
    jobData: RunPodsCompletedResponseData,
    metadata: ImageGenerationMetadata
) {
    // @ts-ignore
    metadata.base_img = null;
    const jobRef = db.collection('jobs').doc(jobData.id.toString());
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

        const body: Partial<ImageGenerationMetadata> = await request.json();
        const { prompt, width = 720, height = 1024, neg_prompt = "ugly, distorted, low quality", cfg, seed, n_samples, base_img } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const db = getFirestore(adminApp);
        const tokensRemaining = await checkAndDeductTokens(userId, db);

        console.log('Image generation requested:', { prompt, width, height, neg_prompt, cfg, seed, n_samples, base_img: base_img?.slice(0, 20) + '...' });

        // Create metadata object without undefined fields
        const metadata: ImageGenerationMetadata = {
            height,
            width,
            prompt,
            neg_prompt,
            ...(cfg !== undefined && { cfg }),
            ...(seed !== undefined && { seed }),
            ...(n_samples !== undefined && { n_samples }),
            ...(cfg !== undefined && { guidance_scale: cfg }),
            ...(base_img !== undefined && { base_img: base_img }),
        };

        const jobData = await generateImage(metadata);

        // Create a job document in Firestore
        await createJobDocument(db, userId, jobData, metadata);

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