import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

const GENERATION_COST = 40;

export async function POST(request: NextRequest) {
    try {
        const { shouldReturn, response, userId } = await verifyRequestCookies(request);
        if (shouldReturn) {
            return response;
        }

        const db = getFirestore(adminApp);
        const userRef = db.collection('users').doc(userId!).collection('private').doc('system');

        let tokensRemaining = 0;

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
                throw new Error('User profile not found');
            }

            const userData = userDoc.data();
            const currentTokens = userData?.tokens || 0;

            if (currentTokens < GENERATION_COST) {
                throw new Error(`Insufficient tokens. You need ${GENERATION_COST} tokens but have ${currentTokens}`);
            }

            tokensRemaining = currentTokens - GENERATION_COST;
            transaction.update(userRef, { tokens: tokensRemaining });
        });

        return NextResponse.json({
            success: true,
            tokensRemaining,
            cost: GENERATION_COST
        });

    } catch (error: any) {
        console.error('Token deduction error:', error);

        if (error.message?.includes('Insufficient tokens')) {
            return NextResponse.json(
                { error: error.message },
                { status: 402 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to deduct tokens' },
            { status: 500 }
        );
    }
}
