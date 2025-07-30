'use server';

import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { revalidatePath } from 'next/cache';

// Define the cost of generating an image
const IMAGE_GENERATION_COST = 1; // Cost in tokens
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const WEBHOOK_URL = "https://influencer-gen.vercel.app/api/webhook";

// Valid keys for request body validation
const VALID_INPUT_KEYS = [
    'prompt', 'negative_prompt', 'width', 'height', 'steps', 'cfg_scale',
    'seed', 'batch_size', 'solver_order', 'base_img', 'strength', 'mask_img', 'model_name',
    'auto_mask_clothes', 'generation_type'
] as const;

const MODEL_ENDPOINTS = {
    "realism": "https://api.runpod.ai/v2/9c6y8ue4f8ie0e/run",
    "lustify": "https://api.runpod.ai/v2/n0uzbkcyeh2nor/run",
};

async function verifySessionCookie(sessionCookie: string) {
    const decodedClaims = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
}

async function checkAndDeductTokens(userId: string, db: FirebaseFirestore.Firestore) {
    const userRef = db.collection('users').doc(userId).collection('private').doc('system');
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new Error('User profile not found');
    }

    const userData = userDoc.data();
    const currentTokens = userData?.tokens || 0;

    if (currentTokens < IMAGE_GENERATION_COST) {
        throw new Error('Insufficient tokens');
    }

    await db.runTransaction(async (transaction) => {
        const userDocInTransaction = await transaction.get(userRef);
        if (!userDocInTransaction.exists) {
            throw new Error('User document does not exist');
        }

        const userDataInTransaction = userDocInTransaction.data();
        const updatedTokens = (userDataInTransaction?.tokens || 0) - IMAGE_GENERATION_COST;

        if (updatedTokens < 0) {
            throw new Error('Insufficient tokens');
        }

        transaction.update(userRef, { tokens: updatedTokens });
    });

    console.log(`Deducted ${IMAGE_GENERATION_COST} tokens from user ${userId}`);
    return currentTokens - IMAGE_GENERATION_COST;
}

async function handleBaseAndMaskImages(storage: any, userId: string, jobId: string, cleanedBody: Partial<StableDiffusionRequestInput>) {
    // Handle image uploads if present
    const imageFiles: { baseImagePath?: string, maskImagePath?: string } = {};

    // Upload base_img if present
    if (cleanedBody.base_img) {
        const baseImagePath = await uploadImageToStorage(
            storage,
            userId,
            jobId,
            cleanedBody.base_img as string,
            'base.png'
        );
        imageFiles.baseImagePath = baseImagePath;
    }

    // Upload mask_img if present
    if (cleanedBody.mask_img) {
        const maskImagePath = await uploadImageToStorage(
            storage,
            userId,
            jobId,
            cleanedBody.mask_img as string,
            'mask.png'
        );
        imageFiles.maskImagePath = maskImagePath;
    }

    return imageFiles;
}

async function uploadImageToStorage(storage: any, userId: string, jobId: string, imageData: string, fileName: string) {
    // Remove the data URL prefix (e.g., "data:image/png;base64,")
    const base64Data = imageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const filePath = `job-meta-images/${userId}/${jobId}/${fileName}`;
    const file = storage.bucket().file(filePath);

    await file.save(buffer, {
        metadata: {
            contentType: 'image/png'
        }
    });

    return filePath;
}

async function generateImage(input: Partial<ImageGenerationRequestInput & { user_id: string }>) {
    const response = await fetch(MODEL_ENDPOINTS[input.model_name ? input.model_name : "lustify"], {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RUNPOD_API_KEY}`
        },
        body: JSON.stringify({
            input,
            webhook: WEBHOOK_URL
        })
    });

    const bodyJson = await response.json();
    console.log(bodyJson);

    if (!response.ok) {
        throw new Error('Failed to generate image');
    }

    const data: RunPodsCompletedResponseData = bodyJson;
    return data;
}

async function createJobDocument(
    db: FirebaseFirestore.Firestore,
    userId: string,
    jobData: RunPodsCompletedResponseData,
    metadata: Partial<StableDiffusionRequestInput>,
    imageFiles: { baseImagePath?: string, maskImagePath?: string }
) {
    // Create a sanitized copy of metadata without large base64 strings
    const sanitizedMetadata = {
        ...metadata,
        // Set base_img to true if it exists in the metadata, and set the path if it does
        base_img: !!metadata.base_img,
        ...(metadata.base_img && { base_img_path: imageFiles.baseImagePath }),

        // Set mask_img to true if it exists in the metadata, and set the path if it does
        mask_img: !!metadata.mask_img,
        ...(metadata.mask_img && { mask_img_path: imageFiles.maskImagePath }),
    };

    const jobRef = db.collection('jobs').doc(jobData.id.toString());
    await jobRef.create({
        userId,
        status: jobData.status,
        metadata: sanitizedMetadata,
        createdAt: new Date().toISOString(),
        ["statusTimestamps.IN_QUEUE"]: new Date().toISOString(),
    });
}

// Define the type for the input
type GenerateImageInput = {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    cfg_scale?: number;
    seed?: number;
    batch_size?: number;
    solver_order?: number;
    base_img?: string;
    strength?: number;
    mask_img?: string;
    model_name?: string;
    auto_mask_clothes?: boolean;
    generation_type: 'simple' | 'advanced' | 'nudify';
};

// Define the type for the response
type GenerateImageResponse = {
    success: boolean;
    jobId?: string;
    tokensRemaining?: number;
    error?: string;
};

// The main server action function
export async function generateImageAction(input: GenerateImageInput): Promise<GenerateImageResponse> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return {
                success: false,
                error: 'Unauthorized: No session found'
            };
        }

        let userId: string;

        try {
            userId = await verifySessionCookie(sessionCookie);
        } catch (error) {
            return {
                success: false,
                error: 'Unauthorized: Unable to verify session'
            };
        }

        // Clean and validate the input
        const cleanedBody: Partial<ImageGenerationRequestInput> = {};

        for (const key of VALID_INPUT_KEYS) {
            if (input[key as keyof GenerateImageInput] !== undefined) {
                cleanedBody[key] = input[key] as any;
            }
        }

        const { prompt, generation_type } = cleanedBody;

        // Validate prompt
        if (!prompt) {
            return {
                success: false,
                error: 'Prompt is required'
            };
        }

        // Validate generation_type
        if (!generation_type) {
            return {
                success: false,
                error: 'generation_type is required'
            };
        }

        // Validate generation_type values
        const validGenerationTypes = ['simple', 'advanced', 'nudify'];
        if (!validGenerationTypes.includes(generation_type)) {
            return {
                success: false,
                error: 'Invalid generation_type. Must be one of: simple, advanced, nudify'
            };
        }

        const db = getFirestore(adminApp);
        const storage = getStorage(adminApp);
        const tokensRemaining = await checkAndDeductTokens(userId, db);

        console.log('Image generation requested:', {
            ...cleanedBody,
            base_img: cleanedBody.base_img ? 'base_img present' : null,
            mask_img: cleanedBody.mask_img ? 'mask_img present' : null,
        });

        const jobData = await generateImage({
            ...cleanedBody,
            user_id: userId
        });
        const jobId = jobData.id.toString();

        const imageFiles = await handleBaseAndMaskImages(storage, userId, jobId, cleanedBody);

        // Create a job document in Firestore
        await createJobDocument(db, userId, jobData, cleanedBody, imageFiles);

        // Revalidate the path to update the UI
        revalidatePath('/authenticated/dashboard/generate');

        return {
            success: true,
            jobId: jobData.id,
            tokensRemaining
        };

    } catch (error: any) {
        console.error('Error in image generation server action:', error);
        return {
            success: false,
            error: error.message || 'Failed to process image generation request'
        };
    }
}