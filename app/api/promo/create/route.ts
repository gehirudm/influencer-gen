import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseApp from '@/lib/firebaseAdmin';

const FREE_PROMO_CREDIT_AMOUNT = 50;

// Function to generate a random promo code
function generatePromoCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

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

    // Check if user is an admin
    const userSystemRef = db.collection('users').doc(userId).collection('private').doc('system');
    const userSystemDoc = await userSystemRef.get();

    if (!userSystemDoc.exists) {
      return NextResponse.json({ error: "User system data not found" }, { status: 404 });
    }

    const userData = userSystemDoc.data();
    
    if (!userData?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required" }, { status: 403 });
    }

    // Get request data
    const { 
      tokenAmount = 500, 
      description = "Promotional tokens",
      expirationDays = 7 // Default to 7 days if not provided
    } = await request.json();

    // Validate token amount
    if (typeof tokenAmount !== 'number' || tokenAmount <= 0 || tokenAmount > 10000) {
      return NextResponse.json({ 
        error: "Invalid token amount. Must be a number between 1 and 10000" 
      }, { status: 400 });
    }

    // Generate a unique promo code
    let promoCode = generatePromoCode();
    let isUnique = false;
    
    // Ensure the promo code is unique
    while (!isUnique) {
      const promoRef = db.collection('promo-codes').doc(promoCode);
      const promoDoc = await promoRef.get();
      
      if (!promoDoc.exists) {
        isUnique = true;
      } else {
        promoCode = generatePromoCode();
      }
    }

    // Calculate expiration date based on the provided expirationDays
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    // Create the promo code document
    const promoData = {
      code: promoCode,
      tokenAmount: FREE_PROMO_CREDIT_AMOUNT,
      description,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      expiresAt: expirationDate.toISOString(),
      isUsed: false,
      usedBy: null,
      usedAt: null
    };

    // Save to Firestore
    await db.collection('promo-codes').doc(promoCode).set(promoData);

    return NextResponse.json({
      success: true,
      promoCode,
      tokenAmount,
      expiresAt: expirationDate.toISOString()
    });

  } catch (error: any) {
    console.error("Error creating promo code:", error);
    
    return NextResponse.json({ 
      error: "Failed to create promo code", 
      details: error.message 
    }, { status: 500 });
  }
}