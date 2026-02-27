import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { verifyRequestCookies } from '@/lib/requestUtils';

export async function POST(request: NextRequest) {
    try {
        const { shouldReturn, response, userId } = await verifyRequestCookies(request);
        if (shouldReturn) {
            return response;
        }

        const body = await request.json();
        const { characterId, purchaseType } = body;

        if (!characterId || !purchaseType) {
            return NextResponse.json(
                { error: 'Character ID and purchase type are required' },
                { status: 400 }
            );
        }

        if (!['license', 'full_claim'].includes(purchaseType)) {
            return NextResponse.json(
                { error: 'Invalid purchase type. Must be "license" or "full_claim"' },
                { status: 400 }
            );
        }

        const db = getFirestore(adminApp);

        // Get character details
        const characterRef = db.collection('marketplace-characters').doc(characterId);
        const characterDoc = await characterRef.get();

        if (!characterDoc.exists) {
            return NextResponse.json(
                { error: 'Character not found' },
                { status: 404 }
            );
        }

        const character = characterDoc.data() as any;

        // Check if character is already fully claimed
        if (character.fullyClaimed) {
            return NextResponse.json(
                { error: 'This character has already been exclusively claimed' },
                { status: 400 }
            );
        }

        // Check if user already owns this character
        const userCharactersRef = db.collection('users').doc(userId).collection('characters');
        const existingPurchase = await userCharactersRef.where('characterId', '==', characterId).get();

        if (!existingPurchase.empty) {
            const existingData = existingPurchase.docs[0].data();
            if (existingData.purchaseType === 'full_claim') {
                return NextResponse.json(
                    { error: 'You already own the exclusive rights to this character' },
                    { status: 400 }
                );
            }
            if (purchaseType === 'license') {
                return NextResponse.json(
                    { error: 'You already own a license for this character' },
                    { status: 400 }
                );
            }
        }

        // Determine the cost
        const cost = purchaseType === 'full_claim' ? character.fullClaimPrice : character.licensePrice;

        // Check if licenses are available (for license purchase only)
        if (purchaseType === 'license') {
            if (character.licensesSold >= character.maxLicenses) {
                return NextResponse.json(
                    { error: 'No licenses available for this character' },
                    { status: 400 }
                );
            }
        }

        // Get user's token balance
        const userSystemRef = db.collection('users').doc(userId).collection('private').doc('system');
        const userSystemDoc = await userSystemRef.get();

        if (!userSystemDoc.exists) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            );
        }

        const userData = userSystemDoc.data();
        const currentTokens = userData?.tokens || 0;

        if (currentTokens < cost) {
            return NextResponse.json(
                { error: `Insufficient tokens. You need ${cost} tokens but have ${currentTokens}` },
                { status: 400 }
            );
        }

        // Perform the purchase in a transaction
        await db.runTransaction(async (transaction) => {
            // Deduct tokens
            const newTokenBalance = currentTokens - cost;
            transaction.update(userSystemRef, { tokens: newTokenBalance });

            // Update character document
            if (purchaseType === 'full_claim') {
                transaction.update(characterRef, {
                    fullyClaimed: true,
                    claimedBy: userId,
                    claimedAt: FieldValue.serverTimestamp(),
                });
            } else {
                transaction.update(characterRef, {
                    licensesSold: FieldValue.increment(1),
                });
            }

            // Add character to user's collection
            const userCharacterRef = userCharactersRef.doc();
            transaction.set(userCharacterRef, {
                characterId,
                characterName: character.name,
                characterImage: character.image,
                purchaseType,
                cost,
                loraUrl: character.loraUrl || '',
                loraKeyword: character.loraKeyword || '',
                purchasedAt: FieldValue.serverTimestamp(),
            });

            // Create purchase log
            const purchaseLogRef = db.collection('marketplace-purchases').doc();
            transaction.set(purchaseLogRef, {
                userId,
                characterId,
                characterName: character.name,
                purchaseType,
                cost,
                timestamp: FieldValue.serverTimestamp(),
            });
        });

        return NextResponse.json({
            success: true,
            message: 'Purchase successful',
            tokensRemaining: currentTokens - cost,
        });

    } catch (error: any) {
        console.error('Error in marketplace purchase endpoint:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process purchase' },
            { status: 500 }
        );
    }
}
