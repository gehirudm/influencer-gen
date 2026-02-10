// Product catalog types and data — shared between client and server

export type ProductType = 'plan' | 'tokens' | 'loraTokens';
export type PaymentMethod = 'crypto' | 'paypal' | 'venmo' | 'card';

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
export const PLANS: Product[] = [
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
export const ALL_PRODUCTS: Product[] = [...PLANS, ...TOKEN_PACKS, ...LORA_TOKEN_PACKS];
