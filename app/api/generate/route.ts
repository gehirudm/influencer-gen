import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

// Define the cost of generating an image
const IMAGE_GENERATION_COST = 1; // Cost in tokens

export async function POST(request: NextRequest) {
    try {
        // Check authentication using session cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        // If no session cookie exists, return unauthorized
        if (!sessionCookie) {
            return NextResponse.json(
                { error: 'Unauthorized: No session found' },
                { status: 401 }
            );
        }

        // Verify the session cookie and get user ID
        let userId;
        try {
            const decodedClaims = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
            userId = decodedClaims.uid;
            console.log('Authenticated user:', userId);
        } catch (error) {
            console.error('Invalid session cookie:', error);
            return NextResponse.json(
                { error: 'Unauthorized: Invalid session' },
                { status: 401 }
            );
        }

        // Parse the request body
        const body = await request.json();

        // Extract parameters from the request
        const { prompt, width, height, style } = body;

        // Validate required parameters
        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Get Firestore instance
        const db = getFirestore(adminApp);

        // Check user's token balance
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            );
        }

        const userData = userDoc.data();
        const currentTokens = userData?.tokens || 0;

        // Check if user has enough tokens
        if (currentTokens < IMAGE_GENERATION_COST) {
            return NextResponse.json(
                {
                    error: 'Insufficient tokens',
                    currentTokens,
                    requiredTokens: IMAGE_GENERATION_COST
                },
                { status: 403 }
            );
        }

        // Update token balance in a transaction to ensure atomicity
        try {
            await db.runTransaction(async (transaction) => {
                // Get the latest user data within the transaction
                const userDocInTransaction = await transaction.get(userRef);
                if (!userDocInTransaction.exists) {
                    throw new Error('User document does not exist');
                }

                const userDataInTransaction = userDocInTransaction.data();
                const updatedTokens = (userDataInTransaction?.tokens || 0) - IMAGE_GENERATION_COST;

                if (updatedTokens < 0) {
                    throw new Error('Insufficient tokens');
                }

                // Update the token balance
                transaction.update(userRef, { tokens: updatedTokens });
            });

            console.log(`Deducted ${IMAGE_GENERATION_COST} tokens from user ${userId}`);
        } catch (error) {
            console.error('Failed to update token balance:', error);
            return NextResponse.json(
                { error: 'Failed to process token deduction' },
                { status: 500 }
            );
        }

        // Log the request
        console.log('Image generation requested:', {
            prompt,
            width: width || 512,
            height: height || 512,
            style: style || 'default'
        });

        // Here you would normally call your image generation service
        // But we're returning a dummy response instead

        // Dummy response
        const dummyResponse = {
            success: true,
            imageUrl: 'https://example.com/generated-image.png',
            parameters: {
                prompt,
                width: width || 512,
                height: height || 512,
                style: style || 'default'
            },
            generationTime: '1.2s',
            tokensRemaining: currentTokens - IMAGE_GENERATION_COST
        };

        return NextResponse.json(dummyResponse);

    } catch (error) {
        console.error('Error in image generation endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to process image generation request' },
            { status: 500 }
        );
    }
}