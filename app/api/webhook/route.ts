import { NextRequest, NextResponse } from 'next/server';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { encode } from 'blurhash';
import { createCanvas, loadImage } from 'canvas';

async function getJobData(db: FirebaseFirestore.Firestore, jobId: string) {
    const jobRef = db.collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
        throw new Error(`Job not found with ID ${jobId}`);
    }

    return jobDoc.data();
}

async function saveImage(storage: Storage, userId: string, imageId: string, imageData: string) {
    if (!imageData) {
        throw new Error('Image data is undefined or empty');
    }

    const base64Data = imageData;

    if (!base64Data) {
        throw new Error('Invalid image data format');
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `generated-images/${userId}/${imageId}.png`;
    const file = storage.bucket("influncer-gen.firebasestorage.app").file(filePath);

    await file.save(buffer, {
        metadata: { contentType: 'image/png' },
    });
}

async function createImageDocument(db: FirebaseFirestore.Firestore, imageId: string, userId: string, jobData: any, blurHash: string) {
    const imageDocRef = db.collection('images').doc(imageId);
    await imageDocRef.set({
        userId,
        projectId: jobData.projectId || null,
        isPublic: false, // Default to false
        metadata: jobData.metadata,
        createdAt: new Date().toISOString(),
        blurHash,
    });
}

async function generateBlurHash(imageData: string): Promise<string> {
    const buffer = Buffer.from(imageData, 'base64');
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const imageDataObj = ctx.getImageData(0, 0, img.width, img.height);
    const blurHash = encode(imageDataObj.data, imageDataObj.width, imageDataObj.height, 4, 4);

    return blurHash;
}

async function processImages(storage: any, db: FirebaseFirestore.Firestore, userId: string, jobId: string, output: any, jobData: any) {
    return Promise.all(output.images.map(async (imageData: string, index: number) => {
        const imageId = `${jobId}-image_${index}`;
        await saveImage(storage, userId, imageId, imageData);
        const blurHash = await generateBlurHash(imageData);
        await createImageDocument(db, imageId, userId, jobData, blurHash);
        return imageId; 
    }));
}

export async function POST(request: NextRequest) {
    try {
        const db = getFirestore(adminApp);
        const storage = getStorage(adminApp);
        const body = await request.json();

        const { id, status, output, delayTime, executionTime, workerId } = body;

        console.log('Received webhook request', {
            jobId: id,
            status,
            delayTime,
            executionTime,
            workerId,
            outputSummary: output ? `Images count: ${output.images.length}` : 'No output',
            parameters: output.parameters ? output.parameters : {},
        });

        if (!id || !status) {
            console.error('Invalid request: Missing required fields');
            return NextResponse.json(
                { error: 'Invalid request: Missing required fields' },
                { status: 400 }
            );
        }

        const jobData = await getJobData(db, id);
        const userId = jobData?.userId;

        if (!userId) {
            console.error('User ID not found in job document');
            return NextResponse.json(
                { error: 'User ID not found in job document' },
                { status: 400 }
            );
        }

        const updateData: any = {
            status,
            delayTime,
            executionTime,
            updatedAt: new Date().toISOString(),
            [`statusTimestamps.${status}`]: new Date().toISOString(),
        };

        if (status === 'COMPLETED' && output && output.images) {
            const imageIds = await processImages(storage, db, userId, id, output, jobData); // Pass jobData here
            updateData.imageIds = imageIds;
        }

        await db.collection('jobs').doc(id).update(updateData);

        console.log(`Job ${id} updated successfully with status: ${status}`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating job status:', error);
        return NextResponse.json(
            { error: 'Failed to update job status' },
            { status: 500 }
        );
    }
}