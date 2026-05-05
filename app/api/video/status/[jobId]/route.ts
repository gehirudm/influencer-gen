import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const VIDEO_ENDPOINT_ID = process.env.VIDEO_RUNPOD_ENDPOINT_ID;

interface VideoStatusResponse {
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

function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : 'mp4';
}

function getContentType(ext: string): string {
    const mimeMap: Record<string, string> = {
        mp4: 'video/mp4',
        webm: 'video/webm',
        avi: 'video/avi',
        mov: 'video/quicktime',
        gif: 'image/gif',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
    };
    return mimeMap[ext] || 'video/mp4';
}

async function saveOutputToStorage(
    storage: ReturnType<typeof getStorage>,
    userId: string,
    outputId: string,
    base64Data: string,
    filename: string
) {
    const ext = getFileExtension(filename);
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `generated-videos/${userId}/${outputId}.${ext}`;
    const file = storage.bucket('influncer-gen.firebasestorage.app').file(filePath);

    await file.save(buffer, {
        metadata: { contentType: getContentType(ext) },
    });

    const fileUrl = await file.getSignedUrl({
        action: 'read',
        expires: '2100-01-01',
    });

    return { publicUrl: fileUrl[0], privateUrl: fileUrl[0] };
}

async function persistCompletedOutput(
    jobId: string,
    userId: string,
    statusData: VideoStatusResponse
) {
    const db = getFirestore(adminApp);
    const storage = getStorage(adminApp);

    const jobRef = db.collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();

    if (jobDoc.exists && jobDoc.data()?.status === 'completed') {
        console.log(`Video job ${jobId} already persisted, skipping.`);
        return;
    }

    const outputs = statusData.output?.images ?? [];
    const outputIds: string[] = [];
    const outputUrls: { publicUrl: string; privateUrl: string }[] = [];

    for (let i = 0; i < outputs.length; i++) {
        const item = outputs[i];
        const outputId = `${jobId}-output_${i}`;

        let urls: { publicUrl: string; privateUrl: string };

        if (item.type === 'base64') {
            urls = await saveOutputToStorage(storage, userId, outputId, item.data, item.filename);
        } else {
            urls = { publicUrl: item.data, privateUrl: item.data };
        }

        const imageDocRef = db.collection('images').doc(outputId);
        await imageDocRef.set({
            userId,
            jobId,
            isPublic: false,
            isVideo: true,
            metadata: jobDoc.exists ? (jobDoc.data()?.metadata ?? {}) : {},
            contentModerationStatus: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            outputType: getFileExtension(item.filename),
            originalFilename: item.filename,
            ...urls,
        });

        outputIds.push(outputId);
        outputUrls.push(urls);
    }

    const updateData: Record<string, any> = {
        status: 'completed',
        imageIds: outputIds,
        imageUrls: outputUrls,
        updatedAt: new Date().toISOString(),
        ['statusTimestamps.COMPLETED']: new Date().toISOString(),
    };

    if (statusData.delayTime != null) updateData.delayTime = statusData.delayTime;
    if (statusData.executionTime != null) updateData.executionTime = statusData.executionTime;

    if (jobDoc.exists) {
        await jobRef.update(updateData);
    } else {
        await jobRef.set({
            userId,
            ...updateData,
            createdAt: new Date().toISOString(),
        });
    }

    console.log(`Persisted ${outputIds.length} output(s) for video job ${jobId}`);
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { shouldReturn, response, userId } = await verifyRequestCookies(request);
        if (shouldReturn) {
            return response;
        }

        const { jobId } = await params;

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        if (!RUNPOD_API_KEY) {
            return NextResponse.json({ error: 'RunPod API key not configured' }, { status: 500 });
        }

        if (!VIDEO_ENDPOINT_ID) {
            return NextResponse.json({ error: 'Video endpoint not configured' }, { status: 500 });
        }

        const statusResponse = await fetch(
            `https://api.runpod.ai/v2/${VIDEO_ENDPOINT_ID}/status/${jobId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${RUNPOD_API_KEY}`,
                },
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

        const statusData: VideoStatusResponse = await statusResponse.json();

        console.log(`Video job status for ${jobId}:`, {
            status: statusData.status,
            hasOutput: !!statusData.output,
            outputCount: statusData.output?.images?.length ?? 0,
            userId,
        });

        if (statusData.status === 'COMPLETED' && statusData.output?.images?.length) {
            try {
                await persistCompletedOutput(jobId, userId, statusData);
            } catch (persistError: any) {
                console.error(`Failed to persist video output for job ${jobId}:`, persistError);
            }
        }

        if (statusData.status === 'FAILED') {
            try {
                const db = getFirestore(adminApp);
                const jobRef = db.collection('jobs').doc(jobId);
                const jobDoc = await jobRef.get();
                if (jobDoc.exists && jobDoc.data()?.status !== 'FAILED') {
                    await jobRef.update({
                        status: 'FAILED',
                        updatedAt: new Date().toISOString(),
                        ['statusTimestamps.FAILED']: new Date().toISOString(),
                        error: {
                            message: statusData.error || 'Video job failed',
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
            } catch (failError: any) {
                console.error(`Failed to update failed video job ${jobId}:`, failError);
            }
        }

        return NextResponse.json({
            id: statusData.id,
            status: statusData.status,
            delayTime: statusData.delayTime,
            executionTime: statusData.executionTime,
            output: statusData.output,
            error: statusData.error,
        });
    } catch (error: any) {
        console.error('Error in video status endpoint:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get video job status' },
            { status: 500 }
        );
    }
}
