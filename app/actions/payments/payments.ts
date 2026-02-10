'use server';

import firebaseApp from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { cookies } from 'next/headers';
import { ALL_PRODUCTS, type PaymentMethod } from './products';

// ──────────── Payment Provider Config ────────────

const NOW_PAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOW_PAYMENTS_API_URL = "https://api.nowpayments.io/v1/invoice";

const LUXFINTECH_API_KEY = process.env.LUXFINTECH_API_KEY;
const LUXFINTECH_BASE_URL = "https://luxfin.org";

// ──────────── Shared Types ────────────

type CreatePaymentResult = {
    success: boolean;
    orderId?: string;
    redirectUrl?: string;
    message?: string;
    error?: string;
};

// ──────────── Helper: Auth + Order Setup ────────────

async function authenticateAndCreateOrder(productId: string) {
    const cookieStore = await cookies();
    const db = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    const sessionCookie = cookieStore.get('__session')?.value;
    if (!productId || !sessionCookie) {
        return { error: "Product selection and authentication are required" };
    }

    const product = ALL_PRODUCTS.find(p => p.id === productId);
    if (!product) {
        return { error: "Invalid product selection" };
    }

    let userId: string;
    let userEmail: string | undefined;
    try {
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        userId = decodedToken.uid;
        userEmail = decodedToken.email;
    } catch (error) {
        console.error("Session cookie verification failed:", error);
        return { error: "Invalid or expired authentication" };
    }

    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;

    const orderData = {
        userId,
        userEmail: userEmail || '',
        productId: product.id,
        productType: product.type,
        productName: product.name,
        amount: product.price,
        tokens: product.tokens,
        loraTokens: product.loraTokens,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return { db, product, userId, userEmail, orderRef, orderId, orderData };
}

function getBaseUrl() {
    return `${process.env.NODE_ENV === 'production' ? "https://" : ""}${process.env.NEXT_PUBLIC_APP_URL}`;
}

// ──────────── Exported Server Actions ────────────

export async function getProductById(productId: string) {
    return ALL_PRODUCTS.find(p => p.id === productId);
}

// ──────────── NowPayments (Crypto) ────────────

export async function createCryptoPayment(productId: string): Promise<CreatePaymentResult> {
    try {
        const result = await authenticateAndCreateOrder(productId);
        if ('error' in result) return { success: false, error: result.error };

        const { db, product, orderRef, orderId, orderData } = result;

        if (!NOW_PAYMENTS_API_KEY) {
            await orderRef.set({ ...orderData, status: 'failed', error: 'NOW_PAYMENTS_API_KEY not configured' });
            return { success: false, error: "Payment service configuration error" };
        }

        const baseUrl = getBaseUrl();

        const invoiceResponse = await fetch(NOW_PAYMENTS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": NOW_PAYMENTS_API_KEY,
            },
            body: JSON.stringify({
                price_amount: product.price,
                price_currency: "USD",
                order_id: orderId,
                order_description: `${product.name} — ${product.description}`,
                ipn_callback_url: `${baseUrl}/api/payments/callback`,
                success_url: `${baseUrl}/pricing/?status=success&orderId=${orderId}`,
                cancel_url: `${baseUrl}/pricing/?status=cancel&orderId=${orderId}`,
            }),
        });

        if (!invoiceResponse.ok) {
            const errorData = await invoiceResponse.json();
            console.error("NOW Payments API error:", errorData);
            await orderRef.set({ ...orderData, status: 'failed', error: JSON.stringify(errorData) });
            return { success: false, error: "Failed to create payment invoice" };
        }

        const invoiceData = await invoiceResponse.json();

        await orderRef.set({
            ...orderData,
            paymentProvider: 'nowpayments',
            invoiceId: invoiceData.id,
            invoiceUrl: invoiceData.invoice_url,
            paymentStatus: "invoice created",
        });

        return {
            success: true,
            orderId,
            redirectUrl: invoiceData.invoice_url,
            message: "Crypto payment invoice created",
        };
    } catch (error) {
        console.error("Error creating crypto payment:", error);
        return { success: false, error: "Failed to process payment request" };
    }
}

// ──────────── LuxFinTech (PayPal / Venmo / Card) ────────────

const LUXFINTECH_ENDPOINTS: Record<string, string> = {
    paypal: '/payment/paypal',
    venmo: '/payment/order',
    card: '/card',
};

export async function createLuxfintechPayment(
    productId: string,
    method: 'paypal' | 'venmo' | 'card'
): Promise<CreatePaymentResult> {
    try {
        const result = await authenticateAndCreateOrder(productId);
        if ('error' in result) return { success: false, error: result.error };

        const { db, product, userEmail, orderRef, orderId, orderData } = result;

        if (!LUXFINTECH_API_KEY) {
            await orderRef.set({ ...orderData, status: 'failed', error: 'LUXFINTECH_API_KEY not configured' });
            return { success: false, error: "Payment service configuration error" };
        }

        const endpoint = LUXFINTECH_ENDPOINTS[method];
        if (!endpoint) {
            return { success: false, error: "Invalid payment method" };
        }

        const baseUrl = getBaseUrl();

        const response = await fetch(`${LUXFINTECH_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LUXFINTECH_API_KEY}`,
            },
            body: JSON.stringify({
                amount: product.price,
                currency: "USD",
                customer: userEmail || `user-${orderId}@fantazy.pro`,
                product: `${product.name} — ${product.description}`,
                redirect_url: `${baseUrl}/pricing/?status=success&orderId=${orderId}`,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error(`LuxFinTech ${method} API error:`, errorData);
            await orderRef.set({ ...orderData, status: 'failed', paymentProvider: 'luxfintech', error: JSON.stringify(errorData) });
            return { success: false, error: `Failed to create ${method} payment` };
        }

        const data = await response.json();

        await orderRef.set({
            ...orderData,
            paymentProvider: 'luxfintech',
            paymentMethod: method,
            luxfintechOrderId: String(data.order_id),
            paymentStatus: "order created",
        });

        // Store mapping from luxfintech order_id → our orderId for webhook lookup
        await db.collection('luxfintech_orders').doc(String(data.order_id)).set({
            firestoreOrderId: orderId,
            createdAt: new Date().toISOString(),
        });

        return {
            success: true,
            orderId,
            redirectUrl: data.order_url,
            message: `${method} payment created`,
        };
    } catch (error) {
        console.error(`Error creating LuxFinTech ${method} payment:`, error);
        return { success: false, error: "Failed to process payment request" };
    }
}