import { NextRequest, NextResponse } from 'next/server';
import firebaseApp from "@/lib/firebaseAdmin";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { createHmac } from 'crypto';
import { createPurchaseNotification } from '@/app/actions/notifications/notifications';

export async function POST(request: NextRequest) {
  if (!process.env.NOWPAYMENTS_IPN_KEY) {
    console.error("NOW Payments API key not configured");
    return NextResponse.json({ error: "NOW Payments API key not configured" }, { status: 500 });
  }

  try {
    const db = getFirestore(firebaseApp);
    const webhookData = await request.json();

    const bodySign = getCallbackBodySignature(webhookData, process.env.NOWPAYMENTS_IPN_KEY);
    const headerSign = request.headers.get('x-nowpayments-sig');

    if (!headerSign || bodySign !== headerSign) {
      console.error("Invalid signature:", { headerSign, bodySign });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("NowPayment payment webhook received:", webhookData);

    // Check if payment is completed
    if (webhookData.payment_status !== 'finished') {
      await updateOrderStatus(db, webhookData.order_id, webhookData.payment_status, webhookData);
      return NextResponse.json({ success: true });
    }

    // Get the order from Firestore
    const orderRef = db.collection('orders').doc(webhookData.order_id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      console.error("Order not found:", webhookData.order_id);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderDoc.data() as FirebaseFirestore.DocumentData;
    const { userId, tokens, loraTokens, productName, productType } = orderData;

    // Build the update object
    const updateData: Record<string, any> = {
      isPaidCustomer: true,
      updatedAt: new Date().toISOString(),
    };

    // Add tokens if applicable
    if (tokens && tokens > 0) {
      updateData.tokens = FieldValue.increment(tokens);
    }

    // Add LoRA tokens if applicable
    if (loraTokens && loraTokens > 0) {
      updateData.loraTokens = FieldValue.increment(loraTokens);
    }

    // Update user's system document
    const userSystemRef = db.collection('users').doc(userId).collection('private').doc('system');
    const userSystemDoc = await userSystemRef.get();

    if (userSystemDoc.exists) {
      await userSystemRef.update(updateData);
    } else {
      // If system doc doesn't exist, set it with defaults
      await userSystemRef.set({
        tokens: tokens || 0,
        loraTokens: loraTokens || 0,
        isPaidCustomer: true,
        updatedAt: new Date().toISOString(),
      });
    }

    // Update the order status to completed
    await updateOrderStatus(db, webhookData.order_id, 'completed', webhookData);

    // Build notification message
    const tokenParts: string[] = [];
    if (tokens && tokens > 0) tokenParts.push(`${tokens} Tokens`);
    if (loraTokens && loraTokens > 0) tokenParts.push(`${loraTokens} LoRA Token${loraTokens > 1 ? 's' : ''}`);
    const creditDescription = tokenParts.join(' + ');

    // Send purchase notification
    await createPurchaseNotification(userId, productName || 'Purchase', tokens || 0);

    console.log(`Successfully processed payment for order ${webhookData.order_id}. Added ${creditDescription} to user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully"
    });

  } catch (error) {
    console.error("Error processing payment webhook:", error);
    return NextResponse.json({ error: "Failed to process payment webhook" }, { status: 500 });
  }
}

async function updateOrderStatus(
  db: FirebaseFirestore.Firestore,
  orderId: string,
  status: string,
  webhookData: any
) {
  await db.collection('orders').doc(orderId).update({
    status,
    paymentStatus: webhookData.payment_status,
    updatedAt: new Date().toISOString(),
    webhookData: webhookData,
  });
}

function getCallbackBodySignature(params: any, ipnKey: string) {
  function sortObject(obj: any) {
    return Object.keys(obj).sort().reduce(
      (result, key) => {
        // @ts-ignore
        result[key] = (obj[key] && typeof obj[key] === 'object') ? sortObject(obj[key]) : obj[key]
        return result
      },
      {}
    )
  }

  const hmac = createHmac('sha512', ipnKey);
  hmac.update(JSON.stringify(sortObject(params)));
  const signature = hmac.digest('hex');

  return signature;
}