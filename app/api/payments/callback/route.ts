import { NextRequest, NextResponse } from 'next/server';
import firebaseApp from "@/lib/firebaseAdmin";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { createHmac } from 'crypto';

// Define subscription tiers and their token amounts
const SUBSCRIPTION_CREDITS = {
  basic: {
    tokens: 1000,
    name: "Basic Plan"
  },
  premium: {
    tokens: 10000,
    name: "Premium Plan"
  }
};

export async function POST(request: NextRequest) {
  if (!process.env.NOWPAYMENTS_IPN_KEY) {
    console.error("NOW Payments API key not configured");
    return NextResponse.json({ error: "NOW Payments API key not configured" }, { status: 500 });
  }

  try {
    // Initialize Firestore
    const db = getFirestore(firebaseApp);

    // Get the webhook payload
    const webhookData = await request.json();

    const bodySign = getCallbackBodySignature(webhookData, process.env.NOWPAYMENTS_IPN_KEY);
    const headerSign = request.headers.get('x-nowpayments-sig');

    if (!headerSign || bodySign !== headerSign) {
      console.error("Invalid signature:", {
        headerSign,
        bodySign
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("NowPayment payment webhook received:", webhookData);

    // Check if payment is completed
    if (webhookData.payment_status !== 'finished') {
      // Update order status but don't process further
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

    // Get subscription tier and user ID from the order
    const { tier, userId } = orderData;

    // Get the token amount for the subscription tier
    const subscriptionDetails = SUBSCRIPTION_CREDITS[tier as keyof typeof SUBSCRIPTION_CREDITS];

    // Update user's subscription tier in system document
    db.collection('users').doc(userId).collection('private').doc('system').set({
      tokens: FieldValue.increment(subscriptionDetails.tokens),
      subscription_tier: tier,
      updatedAt: new Date().toISOString()
    });

    // Update the order status to completed
    await updateOrderStatus(db, webhookData.order_id, 'completed', webhookData);

    console.log(`Successfully processed payment for order ${webhookData.order_id}. Added ${subscriptionDetails.tokens} tokens to user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully"
    });

  } catch (error) {
    console.error("Error processing payment webhook:", error);
    return NextResponse.json({ error: "Failed to process payment webhook" }, { status: 500 });
  }
}

// Helper function to update order status
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