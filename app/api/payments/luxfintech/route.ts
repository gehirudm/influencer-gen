import { NextRequest, NextResponse } from 'next/server';
import firebaseApp from "@/lib/firebaseAdmin";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { createHmac } from 'crypto';
import { createPurchaseNotification } from '@/app/actions/notifications/notifications';

export async function POST(request: NextRequest) {
    const LUXFINTECH_SECRET = process.env.LUXFINTECH_API_SECRET;

    if (!LUXFINTECH_SECRET) {
        console.error("LUXFINTECH_API_SECRET not configured");
        return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    try {
        const db = getFirestore(firebaseApp);

        // Read raw body for signature verification
        const rawBody = await request.text();
        const webhookData = JSON.parse(rawBody);

        // Verify signature: HMAC-SHA256 of raw body using API secret
        const expectedSignature = request.headers.get('x-luxfintech-signature');
        const computedSignature = createHmac('sha256', LUXFINTECH_SECRET)
            .update(rawBody)
            .digest('hex');

        if (!expectedSignature || computedSignature !== expectedSignature) {
            console.error("LuxFinTech webhook: invalid signature", {
                expected: expectedSignature,
                computed: computedSignature,
            });
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        console.log("LuxFinTech webhook received:", webhookData);

        const { order_id, status, amount, product } = webhookData;

        if (!order_id) {
            console.error("LuxFinTech webhook: missing order_id");
            return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
        }

        // Look up our internal order ID via the luxfintech_orders mapping
        const mappingDoc = await db.collection('luxfintech_orders').doc(String(order_id)).get();

        if (!mappingDoc.exists) {
            console.error("LuxFinTech webhook: order mapping not found for order_id:", order_id);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const { firestoreOrderId } = mappingDoc.data() as { firestoreOrderId: string };

        // Get the order from Firestore
        const orderRef = db.collection('orders').doc(firestoreOrderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            console.error("LuxFinTech webhook: Firestore order not found:", firestoreOrderId);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const orderData = orderDoc.data()!;

        // Update order with webhook status
        await orderRef.update({
            status: status === 'SUCCESS' ? 'completed' : status.toLowerCase(),
            paymentStatus: status,
            updatedAt: new Date().toISOString(),
            webhookData,
        });

        // Only credit tokens on SUCCESS
        if (status !== 'SUCCESS') {
            console.log(`LuxFinTech webhook: order ${firestoreOrderId} status=${status}, not crediting`);
            return NextResponse.json({ success: true });
        }

        // Prevent double-crediting
        if (orderData.status === 'completed') {
            console.log(`LuxFinTech webhook: order ${firestoreOrderId} already completed, skipping`);
            return NextResponse.json({ success: true });
        }

        const { userId, tokens, loraTokens, productName } = orderData;

        // Build the update
        const updateData: Record<string, any> = {
            isPaidCustomer: true,
            updatedAt: new Date().toISOString(),
        };

        if (tokens && tokens > 0) {
            updateData.tokens = FieldValue.increment(tokens);
        }
        if (loraTokens && loraTokens > 0) {
            updateData.loraTokens = FieldValue.increment(loraTokens);
        }

        // Update user's system document
        const userSystemRef = db.collection('users').doc(userId).collection('private').doc('system');
        const userSystemDoc = await userSystemRef.get();

        if (userSystemDoc.exists) {
            await userSystemRef.update(updateData);
        } else {
            await userSystemRef.set({
                tokens: tokens || 0,
                loraTokens: loraTokens || 0,
                isPaidCustomer: true,
                updatedAt: new Date().toISOString(),
            });
        }

        // Build notification
        const tokenParts: string[] = [];
        if (tokens && tokens > 0) tokenParts.push(`${tokens} Tokens`);
        if (loraTokens && loraTokens > 0) tokenParts.push(`${loraTokens} LoRA Token${loraTokens > 1 ? 's' : ''}`);
        const creditDescription = tokenParts.join(' + ');

        // Send purchase notification
        await createPurchaseNotification(userId, productName || 'Purchase', tokens || 0);

        console.log(`LuxFinTech: Successfully processed payment for order ${firestoreOrderId}. Added ${creditDescription} to user ${userId}`);

        return NextResponse.json({ success: true, message: "Payment processed" });
    } catch (error) {
        console.error("Error processing LuxFinTech webhook:", error);
        return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
    }
}
