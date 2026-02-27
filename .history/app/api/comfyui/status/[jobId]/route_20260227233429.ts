import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const COMFYUI_ENDPOINT_ID = process.env.COMFYUI_ENDPOINT_ID;

interface ComfyUIStatusResponse {
    id: string;
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    delayTime?: number;
    executionTime?: number;
    output?: {
        images?: Array<{
            filename: string;
            type: 'base64' | 's3_url';
            data: string;
        }>;
        errors?: string[];
    };
    error?: string;
}

/**
 * Save a base64 image to Firebase Storage and return signed URLs.
 */
async function saveImageToStorage(
    storage: ReturnType<typeof getStorage>,
    userId: string,
    imageId: string,
    base64Data: string
) {
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `generated-images/${userId}/${imageId}.png`;
    const file = storage.bucket('influncer-gen.firebasestorage.app').file(filePath);

    await file.save(buffer, {
        metadata: { contentType: 'image/png' },
    });

    const fileUrl = await file.getSignedUrl({
        action: 'read',
        expires: '2100-01-01',
    });

    return { publicUrl: fileUrl[0], privateUrl: fileUrl[0] };
}

/**
 * Persist completed ComfyUI images to Storage + Firestore so they
 * appear in the user's assets. Runs only once per job (idempotent).
 */
async function persistCompletedImages(
    jobId: string,
    userId: string,
    statusData: ComfyUIStatusResponse
) {
    const db = getFirestore(adminApp);
    const storage = getStorage(adminApp);

    // Idempotency: check if the job was already persisted
    const jobRef = db.collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();

    // If the job doc already has status 'completed', images were already saved
    if (jobDoc.exists && jobDoc.data()?.status === 'completed') {
        console.log(`ComfyUI job ${jobId} already persisted, skipping.`);
        return;
    }

    const images = statusData.output?.images ?? [];
    const imageIds: string[] = [];
    const imageUrls: { publicUrl: string; privateUrl: string }[] = [];

    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imageId = `${jobId}-image_${i}`;

        let urls: { publicUrl: string; privateUrl: string };

        if (img.type === 'base64') {
            // Save base64 image to Firebase Storage
            urls = await saveImageToStorage(storage, userId, imageId, img.data);
        } else {
            // s3_url — use the URL directly
            urls = { publicUrl: img.data, privateUrl: img.data };
        }

        // Create an image document in Firestore
        const imageDocRef = db.collection('images').doc(imageId);
        await imageDocRef.set({
            userId,
            jobId,
            isPublic: false,
            metadata: jobDoc.exists ? (jobDoc.data()?.metadata ?? {}) : {},
            contentModerationStatus: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...urls,
        });

        imageIds.push(imageId);
        imageUrls.push(urls);
    }

    // Update the job document with completed status + image references
    const updateData: Record<string, any> = {
        status: 'completed',
        imageIds,
        imageUrls,
        updatedAt: new Date().toISOString(),
        [`statusTimestamps.COMPLETED`]: new Date().toISOString(),
    };

    if (statusData.delayTime != null) updateData.delayTime = statusData.delayTime;
    if (statusData.executionTime != null) updateData.executionTime = statusData.executionTime;

    if (jobDoc.exists) {
        await jobRef.update(updateData);
    } else {
        // Fallback: create the job doc if it wasn't created during generation
        await jobRef.set({
            userId,
            ...updateData,
            createdAt: new Date().toISOString(),
        });
    }

    console.log(`Persisted ${imageIds.length} image(s) for ComfyUI job ${jobId}`);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        // Verify user authentication
        const { shouldReturn, response, userId } = await verifyRequestCookies(request);
        if (shouldReturn) {
            return response;
        }

        const { jobId } = await params;

        if (!jobId) {
            return NextResponse.json(
                { error: 'Job ID is required' },
                { status: 400 }
            );
        }

        if (!RUNPOD_API_KEY) {
            return NextResponse.json(
                { error: 'RunPod API key not configured' },
                { status: 500 }
            );
        }

        if (!COMFYUI_ENDPOINT_ID) {
            return NextResponse.json(
                { error: 'ComfyUI endpoint not configured' },
                { status: 500 }
            );
        }

        // Check job status from RunPod
        const statusResponse = await fetch(
            `https://api.runpod.ai/v2/${COMFYUI_ENDPOINT_ID}/status/${jobId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${RUNPOD_API_KEY}`
                }
            }
        );

        if (!statusResponse.ok) {
            const errorData = await statusResponse.json().catch(() => ({}));
            console.error('RunPod status API error:', errorData);
            return NextResponse.json(
                { error: 'Failed to get job status from RunPod', details: errorData },
                { status: statusResponse.status }
            );
        }

        const statusData: ComfyUIStatusResponse = await statusResponse.json();

        // Log for debugging
        console.log(`ComfyUI job status for ${jobId}:`, {
            status: statusData.status,
            hasOutput: !!statusData.output,
            imageCount: statusData.output?.images?.length ?? 0,
            userId
        });

        // When the job completes, persist images to Storage + Firestore
        if (statusData.status === 'COMPLETED' && statusData.output?.images?.length) {
            try {
                await persistCompletedImages(jobId, userId, statusData);
            } catch (persistError: any) {
                // Log but don't fail the status response — the client still gets its images
                console.error(`Failed to persist ComfyUI images for job ${jobId}:`, persistError);
            }
        }

        // If the job failed, update the job document
        if (statusData.status === 'FAILED') {
            try {
                const db = getFirestore(adminApp);
                const jobRef = db.collection('jobs').doc(jobId);
                const jobDoc = await jobRef.get();
                if (jobDoc.exists && jobDoc.data()?.status !== 'FAILED') {
                    await jobRef.update({
                        status: 'FAILED',
                        updatedAt: new Date().toISOString(),
                        [`statusTimestamps.FAILED`]: new Date().toISOString(),
                        error: {
                            message: statusData.error || 'ComfyUI job failed',
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
            } catch (failError: any) {
                console.error(`Failed to update failed job ${jobId}:`, failError);
            }
        }

        // Return the status and output if completed
        return NextResponse.json({
            id: statusData.id,
            status: statusData.status,
            delayTime: statusData.delayTime,
            executionTime: statusData.executionTime,
            output: statusData.output,
            error: statusData.error
        });

    } catch (error: any) {
        console.error('Error in ComfyUI status endpoint:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get job status' },
            { status: 500 }
        );
    }
}
