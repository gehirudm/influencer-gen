import { NextRequest, NextResponse } from 'next/server';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getPlaiceholder } from "plaiceholder";
import { randomUUID } from 'crypto';

async function getJobData(db: FirebaseFirestore.Firestore, jobId: string) {
    const jobRef = db.collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
        throw new Error(`Job not found with ID ${jobId}`);
    }

    return jobDoc.data();
}

async function getImageUrls(storage: Storage, imageId: string, userId: string) {
    const filePath = `generated-images/${userId}/${imageId}.png`;
    const file = storage.bucket("influncer-gen.firebasestorage.app").file(filePath);

    const fileUrl = await file.getSignedUrl({
        action: 'read',
        expires: "2100-01-01"
    });

    return { publicUrl: fileUrl[0], privateUrl: fileUrl[0] };
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
        metadata: { contentType: 'image/png', },
    });

    const fileUrl = await file.getSignedUrl({
        action: 'read',
        expires: "2100-01-01"
    });

    return { publicUrl: fileUrl[0], privateUrl: fileUrl[0] };
}

async function createImageDocument(db: FirebaseFirestore.Firestore, imageId: string, userId: string, jobData: any, blurHash: string, imageURLs: { publicUrl: string, privateUrl: string }) {
    const imageDocRef = db.collection('images').doc(imageId);
    await imageDocRef.set({
        userId,
        projectId: jobData.projectId || null,
        isPublic: false, // Default to false
        metadata: jobData.metadata,
        createdAt: new Date().toISOString(),
        blurHash,
        ...imageURLs
    });
}

async function generateBlurHash(imageData: string): Promise<string> {
    const buffer = Buffer.from(imageData, 'base64');
    const { base64 } = await getPlaiceholder(buffer);
    return base64;
}

async function processImages(storage: any, db: FirebaseFirestore.Firestore, userId: string, jobId: string, output: any, jobData: any): Promise<{ imageId: string, imageURLs: { privateUrl: string, publicUrl: string } }[]> {
    return Promise.all(output.images.map(async (imageData: string, index: number) => {
        const imageId = `${jobId}-image_${index}`;
        const imageURLs = await saveImage(storage, userId, imageId, imageData);
        const blurHash = await generateBlurHash(imageData);
        await createImageDocument(db, imageId, userId, jobData, blurHash, imageURLs);
        return { imageId, imageURLs };
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
            output
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

        if (status === 'COMPLETED' && output && (output.images || output.image_ids)) {
            if (output.images !== undefined) {
                const imageData = await processImages(storage, db, userId, id, output, jobData); // Pass jobData here
                updateData.imageIds = imageData.map((imageData) => imageData.imageId);
                updateData.imageUrls = imageData.map((imageData) => imageData.imageURLs);
            } else {
                updateData.imageIds = output.image_ids;
                updateData.imageUrls = await Promise.all(output.image_ids.map((imageId: string) => getImageUrls(storage, imageId, userId)));
            }
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