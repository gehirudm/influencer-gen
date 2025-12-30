import { NextRequest, NextResponse } from 'next/server';
import firebaseApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

export async function POST(request: NextRequest) {
    try {
        // Initialize Firebase Admin
        const db = getFirestore(firebaseApp);
        const auth = getAuth(firebaseApp);

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('__session')?.value;

        // Get request data
        const { jobId } = await request.json();

        // Validate required parameters
        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        if (!sessionCookie) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // Verify user authentication
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        const userId = decodedToken.uid;

        // Check if job exists and belongs to the user
        const jobRef = db.collection('jobs').doc(jobId);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const jobData = jobDoc.data();
        if (jobData?.userId !== userId) {
            return NextResponse.json({ error: "You don't have permission to access this job" }, { status: 403 });
        }

        // Determine which RunPods endpoint to use based on the job's metadata
        const modelName = jobData?.metadata?.model_name || "lustify";
        const endpointId = modelName === "realism" ? "9c6y8ue4f8ie0e" : "k7649vd0rf6sof";

        // Query RunPods API for job status
        const response = await fetch(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RUNPOD_API_KEY}`
            }
        });

        if (!response.ok) {
            console.error(`RunPods API error: ${response.status} ${response.statusText}`);
            return NextResponse.json({ error: "Failed to fetch job status from RunPods" }, { status: 500 });
        }

        const runpodData = await response.json();
        const currentStatus = runpodData.status;

        // Update job document with new status if it has changed
        if (currentStatus && currentStatus !== jobData.status) {
            const updateData: any = {
                status: currentStatus,
                updatedAt: new Date().toISOString(),
                [`statusTimestamps.${currentStatus}`]: new Date().toISOString(),
            };

            await jobRef.update(updateData);
        }

        // Return the current status and any relevant data
        return NextResponse.json({
            success: true,
            jobId,
            status: currentStatus,
            lastUpdated: new Date().toISOString(),
            output: currentStatus === 'COMPLETED' ? runpodData.output : null
        });

    } catch (error) {
        console.error("Error checking job status:", error);
        return NextResponse.json({ error: "Failed to check job status" }, { status: 500 });
    }
}