import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
    try {
        const { shouldReturn, response, userId } = await verifyRequestCookies(request);
        if (shouldReturn) {
            return response;
        }

        const db = getFirestore(adminApp);

        const jobsSnapshot = await db
            .collection('jobs')
            .where('userId', '==', userId)
            .where('generationType', '==', 'video')
            .where('status', '==', 'completed')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const videos: Array<{
            jobId: string;
            imageUrls: Array<{ publicUrl: string; privateUrl: string }>;
            metadata: Record<string, any>;
            createdAt: string;
            executionTime: number | null;
        }> = [];

        jobsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.imageUrls && data.imageUrls.length > 0) {
                videos.push({
                    jobId: doc.id,
                    imageUrls: data.imageUrls || [],
                    metadata: data.metadata || {},
                    createdAt: data.createdAt,
                    executionTime: data.executionTime ?? null,
                });
            }
        });

        return NextResponse.json({ videos });
    } catch (error: any) {
        console.error('Error fetching video history:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch video history' },
            { status: 500 }
        );
    }
}
