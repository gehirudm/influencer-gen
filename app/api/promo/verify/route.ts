import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseApp from '@/lib/firebaseAdmin';
import { createCreditsNotification } from '@/app/actions/notifications/notifications';

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    const db = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify the session cookie
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // Get request data
    const { promoCode } = await request.json();

    if (!promoCode || typeof promoCode !== 'string') {
      return NextResponse.json({ error: "Valid promo code is required" }, { status: 400 });
    }

    // Normalize promo code to uppercase
    const normalizedPromoCode = promoCode.trim().toUpperCase();

    // Get the promo code document
    const promoRef = db.collection('promo-codes').doc(normalizedPromoCode);

    // Use transaction to ensure atomic operations
    const result = await db.runTransaction(async (transaction) => {
      // First, check if the user has already used any promo code
      const userTokenHistoryRef = db.collection('users').doc(userId).collection('tokenHistory');
      const promoUsageQuery = await transaction.get(
        userTokenHistoryRef.where('type', '==', 'promo')
      );

      if (!promoUsageQuery.empty) {
        throw new Error("You have already redeemed a promo code on this account");
      }

      const promoDoc = await transaction.get(promoRef);

      // Check if promo code exists
      if (!promoDoc.exists) {
        throw new Error("Invalid promo code");
      }

      const promoData = promoDoc.data();

      // Check if promo code is already used
      if (promoData?.isUsed) {
        throw new Error("This promo code has already been used");
      }

      // Check if promo code is expired
      const expiresAt = new Date(promoData?.expiresAt);
      const now = new Date();

      if (expiresAt < now) {
        throw new Error("This promo code has expired");
      }

      // Get user's system document
      const userSystemRef = db.collection('users').doc(userId).collection('private').doc('system');
      const userSystemDoc = await transaction.get(userSystemRef);

      if (!userSystemDoc.exists) {
        // Create system document if it doesn't exist
        transaction.set(userSystemRef, {
          isPaidCustomer: false,
          tokens: promoData?.tokenAmount,
          loraTokens: 0,
          lastUpdated: new Date().toISOString(),
          hasUsedPromoCode: true
        });

        // Mark promo code as used
        transaction.update(promoRef, {
          isUsed: true,
          usedBy: userId,
          usedAt: new Date().toISOString()
        });

        return {
          success: true,
          tokenAmount: promoData?.tokenAmount,
          newBalance: promoData?.tokenAmount,
          message: "Promo code redeemed successfully!"
        };
      }

      // Update existing user system document
      const userData = userSystemDoc.data();
      const currentTokens = userData?.tokens || 0;
      const tokenAmount = promoData?.tokenAmount;

      // Mark promo code as used
      transaction.update(promoRef, {
        isUsed: true,
        usedBy: userId,
        usedAt: new Date().toISOString()
      });

      // Add tokens to user's account
      transaction.update(userSystemRef, {
        tokens: currentTokens + tokenAmount,
        lastUpdated: new Date().toISOString(),
        hasUsedPromoCode: true
      });

      // Add redemption record to user's history
      const historyRef = db.collection('users').doc(userId).collection('tokenHistory').doc();
      transaction.set(historyRef, {
        type: 'promo',
        amount: tokenAmount,
        promoCode: normalizedPromoCode,
        description: promoData?.description || "Promo code redemption",
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        tokenAmount,
        previousBalance: currentTokens,
        newBalance: currentTokens + tokenAmount,
        message: "Promo code redeemed successfully!"
      };
    });

    // Send credits notification after successful redemption
    if (result.success) {
      await createCreditsNotification(userId, result.tokenAmount, 'promo code');
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error redeeming promo code:", error);

    return NextResponse.json({
      success: false,
      error: error.message || "Failed to redeem promo code"
    }, { status: 400 });
  }
}