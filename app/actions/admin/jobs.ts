'use server'

import firebaseApp from '@/lib/firebaseAdmin';
import { getSessionUid } from '../actions';
import { getFirestore } from 'firebase-admin/firestore';

const adminDb = getFirestore(firebaseApp);

interface FetchJobsParams {
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
}

/**
 * Admin action: Fetch all image generation jobs with pagination and optional filtering.
 */
export async function fetchAllJobs(params: FetchJobsParams) {
    try {
        const uid = await getSessionUid();
        if (!uid) {
            return { success: false, error: 'Authentication required', jobs: [], total: 0 };
        }

        // Verify admin
        const systemRef = adminDb.doc(`users/${uid}/private/system`);
        const systemDoc = await systemRef.get();
        const systemData = systemDoc.data();

        if (!systemData?.isAdmin) {
            return { success: false, error: 'Admin access required', jobs: [], total: 0 };
        }

        const { page, pageSize, status, search } = params;

        // Build base query
        let baseQuery: FirebaseFirestore.Query = adminDb.collection('jobs');

        // Status filter (applied at Firestore level)
        if (status && status !== 'all') {
            baseQuery = baseQuery.where('status', '==', status);
        }

        baseQuery = baseQuery.orderBy('createdAt', 'desc');

        // Fetch all matching for total count (Firestore doesn't have a native count with filters)
        // For large datasets we'd use a counter, but for admin this is fine
        const allSnapshot = await baseQuery.get();
        let allDocs = allSnapshot.docs;

        // Client-side search filter (Firestore doesn't support full-text search)
        if (search && search.trim()) {
            const searchLower = search.trim().toLowerCase();
            allDocs = allDocs.filter((doc) => {
                const data = doc.data();
                const userId = (data.userId || '').toLowerCase();
                const prompt = (data.metadata?.prompt || '').toLowerCase();
                const jobId = doc.id.toLowerCase();
                return userId.includes(searchLower) || prompt.includes(searchLower) || jobId.includes(searchLower);
            });
        }

        const total = allDocs.length;

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const paginatedDocs = allDocs.slice(startIndex, startIndex + pageSize);

        const jobs = paginatedDocs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId || '',
                status: data.status || 'UNKNOWN',
                metadata: {
                    prompt: data.metadata?.prompt || '',
                    neg_prompt: data.metadata?.neg_prompt || '',
                    width: data.metadata?.width || 0,
                    height: data.metadata?.height || 0,
                    cfg: data.metadata?.cfg || 0,
                    seed: data.metadata?.seed || '',
                    base_img: data.metadata?.base_img || false,
                    generation_type: data.metadata?.generation_type || '',
                },
                createdAt: data.createdAt || null,
                imageUrls: data.imageUrls || [],
                executionTime: data.executionTime || null,
                error: data.error || null,
                errorDetails: data.errorDetails || null,
                contentModerationStatus: data.contentModerationStatus || null,
            };
        });

        return { success: true, jobs, total };
    } catch (error: any) {
        console.error('Error fetching jobs:', error);
        return { success: false, error: error.message || 'Failed to fetch jobs', jobs: [], total: 0 };
    }
}

interface FetchImagesParams {
    page: number;
    pageSize: number;
    search?: string;
}

/**
 * Admin action: Fetch all images with pagination and optional search by userId.
 */
export async function fetchAllImages(params: FetchImagesParams) {
    try {
        const uid = await getSessionUid();
        if (!uid) {
            return { success: false, error: 'Authentication required', images: [], total: 0 };
        }

        // Verify admin
        const systemRef = adminDb.doc(`users/${uid}/private/system`);
        const systemDoc = await systemRef.get();
        const systemData = systemDoc.data();

        if (!systemData?.isAdmin) {
            return { success: false, error: 'Admin access required', images: [], total: 0 };
        }

        const { page, pageSize, search } = params;

        let baseQuery: FirebaseFirestore.Query = adminDb.collection('images')
            .orderBy('createdAt', 'desc');

        const allSnapshot = await baseQuery.get();
        let allDocs = allSnapshot.docs;

        // Client-side search by userId or imageId
        if (search && search.trim()) {
            const searchLower = search.trim().toLowerCase();
            allDocs = allDocs.filter((doc) => {
                const data = doc.data();
                const userId = (data.userId || '').toLowerCase();
                const imageId = doc.id.toLowerCase();
                const prompt = (data.metadata?.prompt || '').toLowerCase();
                return userId.includes(searchLower) || imageId.includes(searchLower) || prompt.includes(searchLower);
            });
        }

        const total = allDocs.length;

        // Pagination
        const startIndex = (page - 1) * pageSize;
        const paginatedDocs = allDocs.slice(startIndex, startIndex + pageSize);

        const images = paginatedDocs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                userId: data.userId || '',
                publicUrl: data.publicUrl || '',
                privateUrl: data.privateUrl || '',
                thumbnailUrl: data.thumbnailUrl || null,
                metadata: {
                    prompt: data.metadata?.prompt || '',
                    neg_prompt: data.metadata?.neg_prompt || '',
                    width: data.metadata?.width || 0,
                    height: data.metadata?.height || 0,
                },
                contentModerationStatus: data.contentModerationStatus || null,
                createdAt: data.createdAt || null,
                jobId: data.jobId || null,
            };
        });

        return { success: true, images, total };
    } catch (error: any) {
        console.error('Error fetching images:', error);
        return { success: false, error: error.message || 'Failed to fetch images', images: [], total: 0 };
    }
}
