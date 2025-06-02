import { NextRequest, NextResponse } from 'next/server';
import firebaseApp from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

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

// NOW Payments API key for verification
const NOW_PAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Initialize Firestore
    const db = getFirestore(firebaseApp);
    
    // Get the webhook payload
    const webhookData = await request.json();
    
    // Basic validation of the webhook data
    if (!webhookData || !webhookData.order_id || !webhookData.payment_status) {
      console.error("Invalid webhook data received:", webhookData);
      return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 });
    }
    
    console.log("Payment webhook received:", JSON.stringify(webhookData));
    
    // Check if payment is completed
    if (webhookData.payment_status !== 'finished') {
      // Update order status but don't process further
      await updateOrderStatus(db, webhookData.order_id, webhookData.payment_status, webhookData);
      return NextResponse.json({ success: true, status: "Payment not yet completed" });
    }
    
    // Get the order from Firestore
    const orderRef = db.collection('orders').doc(webhookData.order_id);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      console.error("Order not found:", webhookData.order_id);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    
    const orderData = orderDoc.data();
    if (!orderData) {
      return NextResponse.json({ error: "Order data is empty" }, { status: 500 });
    }
    
    // Verify the payment amount matches the order amount
    // This is a basic check - you might want to add more verification
    if (parseFloat(webhookData.price_amount) !== orderData.amount) {
      console.error("Payment amount mismatch:", {
        expected: orderData.amount,
        received: webhookData.price_amount
      });
      
      await updateOrderStatus(db, webhookData.order_id, 'amount_mismatch', webhookData);
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
    }
    
    // Get subscription tier and user ID from the order
    const { tier, userId } = orderData;
    
    if (!tier || !userId || !SUBSCRIPTION_CREDITS[tier as keyof typeof SUBSCRIPTION_CREDITS]) {
      console.error("Invalid tier or userId in order:", { tier, userId });
      await updateOrderStatus(db, webhookData.order_id, 'invalid_data', webhookData);
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }
    
    // Get the token amount for the subscription tier
    const subscriptionDetails = SUBSCRIPTION_CREDITS[tier as keyof typeof SUBSCRIPTION_CREDITS];
    
    // Update user's subscription tier in system document
    const userSystemRef = db.collection('users').doc(userId).collection('system').doc('settings');
    const userSystemDoc = await userSystemRef.get();
    
    if (!userSystemDoc.exists) {
      // Create the system document if it doesn't exist
      await userSystemRef.set({
        subscription_tier: tier,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update the existing system document
      await userSystemRef.update({
        subscription_tier: tier,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Update user's tokens in private document
    const userPrivateRef = db.collection('users').doc(userId).collection('private').doc('data');
    const userPrivateDoc = await userPrivateRef.get();
    
    if (!userPrivateDoc.exists) {
      // Create the private document if it doesn't exist
      await userPrivateRef.set({
        tokens: subscriptionDetails.tokens,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update the existing tokens, adding the new tokens to any existing balance
      const userData = userPrivateDoc.data();
      const currentTokens = userData?.tokens || 0;
      await userPrivateRef.update({
        tokens: currentTokens + subscriptionDetails.tokens,
        updatedAt: new Date().toISOString()
      });
    }
    
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
  const orderRef = db.collection('orders').doc(orderId);
  
  await orderRef.update({
    status,
    paymentStatus: webhookData.payment_status,
    updatedAt: new Date().toISOString(),
    webhookData: webhookData,
  });
}