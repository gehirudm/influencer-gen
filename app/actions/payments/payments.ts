'use server';

import firebaseApp from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Define subscription tiers and their prices
const SUBSCRIPTION_TIERS = {
    basic: {
        name: "Basic Plan",
        price: 39.99,
        tokens: 1000
    },
    premium: {
        name: "Premium Plan",
        price: 64.99,
        tokens: 10000
    }
};

// NOW Payments API key
const NOW_PAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOW_PAYMENTS_API_URL = "https://api.nowpayments.io/v1/invoice";

type CreateInvoiceResult = {
    success: boolean;
    orderId?: string;
    invoiceId?: string;
    invoiceUrl?: string;
    message?: string;
    error?: string;
};

export async function createInvoice(formData: FormData): Promise<CreateInvoiceResult> {
    try {
        const tier = formData.get('tier') as string;
        const cookieStore = await cookies();

        // Initialize Firebase Admin
        const db = getFirestore(firebaseApp);
        const auth = getAuth(firebaseApp);

        // Get session cookie
        const sessionCookie = cookieStore.get('session')?.value;

        // Validate required parameters
        if (!tier || !sessionCookie) {
            return {
                success: false,
                error: "Subscription tier and authentication are required"
            };
        }

        // Validate tier
        if (!SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
            return {
                success: false,
                error: "Invalid subscription tier"
            };
        }

        // Verify user authentication
        let userId;
        try {
            const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
            userId = decodedToken.uid;
        } catch (error) {
            return {
                success: false,
                error: "Invalid or expired authentication"
            };
        }

        // Get subscription details
        const subscriptionTier = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

        // Generate a unique order ID
        const orderRef = db.collection('orders').doc();
        const orderId = orderRef.id;

        // Create the order document in Firestore
        const orderData = {
            userId,
            tier,
            amount: subscriptionTier.price,
            tokens: subscriptionTier.tokens,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Create invoice with NOW Payments API
        if (!NOW_PAYMENTS_API_KEY) {
            await orderRef.set({
                ...orderData,
                status: 'failed',
                error: 'NOW_PAYMENTS_API_KEY not configured'
            });
            return {
                success: false,
                error: "Payment service configuration error"
            };
        }

        const invoiceResponse = await fetch(NOW_PAYMENTS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": NOW_PAYMENTS_API_KEY
            },
            body: JSON.stringify({
                price_amount: subscriptionTier.price,
                price_currency: "USD",
                order_id: orderId,
                order_description: `Subscription to ${subscriptionTier.name}`,
                ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${orderId}`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?orderId=${orderId}`,
            })
        });

        if (!invoiceResponse.ok) {
            const errorData = await invoiceResponse.json();
            console.error("NOW Payments API error:", errorData);

            // Update order with error status
            await orderRef.set({
                ...orderData,
                status: 'failed',
                error: JSON.stringify(errorData)
            });

            return {
                success: false,
                error: "Failed to create payment invoice"
            };
        }

        const invoiceData = await invoiceResponse.json();

        // Update order with invoice details
        await orderRef.set({
            ...orderData,
            invoiceId: invoiceData.id,
            invoiceUrl: invoiceData.invoice_url,
            paymentStatus: invoiceData.payment_status,
        });

        return {
            success: true,
            orderId,
            invoiceId: invoiceData.id,
            invoiceUrl: invoiceData.invoice_url,
            message: "Payment invoice created successfully"
        };

    } catch (error) {
        console.error("Error creating payment invoice:", error);
        return {
            success: false,
            error: "Failed to process payment request"
        };
    }
}

// Helper action to redirect to payment page after invoice creation
export async function createInvoiceAndRedirect(formData: FormData) {
    const result = await createInvoice(formData);
    
    if (result.success && result.invoiceUrl) {
        redirect(result.invoiceUrl);
    } else {
        // Redirect to error page with the error message
        redirect(`/payment/error?message=${encodeURIComponent(result.error || 'Unknown error')}`);
    }
}