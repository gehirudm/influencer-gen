'use server';

import firebaseApp from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Product catalog
export type ProductType = 'plan' | 'tokens' | 'loraTokens';

export interface Product {
    id: string;
    name: string;
    type: ProductType;
    price: number;           // USD
    tokens: number;           // Generation tokens included
    loraTokens: number;       // LoRA tokens included
    description: string;
}

// Plans
const PLANS: Product[] = [
    {
        id: 'basic_plan',
        name: 'Basic Plan',
        type: 'plan',
        price: 39.99,
        tokens: 1000,
        loraTokens: 1,
        description: '1,000 Tokens + 1 LoRA Token',
    },
    {
        id: 'premium_plan',
        name: 'Premium Plan',
        type: 'plan',
        price: 64.99,
        tokens: 10000,
        loraTokens: 2,
        description: '10,000 Tokens + 2 LoRA Tokens',
    },
];

// Token packs (minimum 1000 tokens)
export const TOKEN_PACKS: Product[] = [
    {
        id: 'tokens_1000',
        name: '1,000 Tokens',
        type: 'tokens',
        price: 10,
        tokens: 1000,
        loraTokens: 0,
        description: '1,000 generation tokens',
    },
    {
        id: 'tokens_2000',
        name: '2,000 Tokens',
        type: 'tokens',
        price: 18,
        tokens: 2000,
        loraTokens: 0,
        description: '2,000 generation tokens — 10% off',
    },
    {
        id: 'tokens_5000',
        name: '5,000 Tokens',
        type: 'tokens',
        price: 40,
        tokens: 5000,
        loraTokens: 0,
        description: '5,000 generation tokens — 20% off',
    },
    {
        id: 'tokens_10000',
        name: '10,000 Tokens',
        type: 'tokens',
        price: 70,
        tokens: 10000,
        loraTokens: 0,
        description: '10,000 generation tokens — 30% off',
    },
];

// LoRA token packs
export const LORA_TOKEN_PACKS: Product[] = [
    {
        id: 'lora_1',
        name: '1 LoRA Token',
        type: 'loraTokens',
        price: 60,
        tokens: 0,
        loraTokens: 1,
        description: '1 LoRA character training token',
    },
    {
        id: 'lora_2',
        name: '2 LoRA Tokens',
        type: 'loraTokens',
        price: 108,
        tokens: 0,
        loraTokens: 2,
        description: '2 LoRA tokens — 10% off',
    },
    {
        id: 'lora_3',
        name: '3 LoRA Tokens',
        type: 'loraTokens',
        price: 144,
        tokens: 0,
        loraTokens: 3,
        description: '3 LoRA tokens — 20% off',
    },
    {
        id: 'lora_5',
        name: '5 LoRA Tokens',
        type: 'loraTokens',
        price: 210,
        tokens: 0,
        loraTokens: 5,
        description: '5 LoRA tokens — 30% off',
    },
];

// All products combined for lookup
const ALL_PRODUCTS: Product[] = [...PLANS, ...TOKEN_PACKS, ...LORA_TOKEN_PACKS];

export async function getProductById(productId: string): Promise<Product | undefined> {
    return ALL_PRODUCTS.find(p => p.id === productId);
}

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
        const productId = formData.get('productId') as string;
        const cookieStore = await cookies();

        // Initialize Firebase Admin
        const db = getFirestore(firebaseApp);
        const auth = getAuth(firebaseApp);

        // Get session cookie
        const sessionCookie = cookieStore.get('__session')?.value;

        // Validate required parameters
        if (!productId || !sessionCookie) {
            return {
                success: false,
                error: "Product selection and authentication are required"
            };
        }

        const product = await getProductById(productId);

        // Validate product
        if (!product) {
            return {
                success: false,
                error: "Invalid product selection"
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

        // Generate a unique order ID
        const orderRef = db.collection('orders').doc();
        const orderId = orderRef.id;

        // Create the order document in Firestore
        const orderData = {
            userId,
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

        const baseUrl = `${process.env.NODE_ENV === 'production' ? "https://" : ""}${process.env.NEXT_PUBLIC_APP_URL}`;

        const invoiceResponse = await fetch(NOW_PAYMENTS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": NOW_PAYMENTS_API_KEY
            },
            body: JSON.stringify({
                price_amount: product.price,
                price_currency: "USD",
                order_id: orderId,
                order_description: `${product.name} — ${product.description}`,
                ipn_callback_url: `${baseUrl}/api/payments/callback`,
                success_url: `${baseUrl}/pricing/?status=success&orderId=${orderId}`,
                cancel_url: `${baseUrl}/pricing/?status=cancel&orderId=${orderId}`,
            })
        });

        if (!invoiceResponse.ok) {
            const errorData = await invoiceResponse.json();
            console.error("NOW Payments API error:", errorData);

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
            paymentStatus: "invoice created",
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
        redirect(`/pricing?error=${encodeURIComponent(result.error || 'Unknown error')}`);
    }
}