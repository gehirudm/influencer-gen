import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const UNDRESS_RUNPOD_ENDPOINT_ID = process.env.UNDRESS_RUNPOD_ENDPOINT_ID || 'hxppbocrongwcv';

interface RunPodStatusResponse {
    id: string;
    status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';
    output?: any;
    error?: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { shouldReturn, response } = await verifyRequestCookies(request);
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

        const statusResponse = await fetch(
            `https://api.runpod.ai/v2/${UNDRESS_RUNPOD_ENDPOINT_ID}/status/${jobId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${RUNPOD_API_KEY}`,
                },
            }
        );

        const statusData: RunPodStatusResponse & Record<string, any> = await statusResponse.json();

        if (!statusResponse.ok) {
            return NextResponse.json(
                {
                    error: statusData.error || 'Failed to get RunPod job status',
                    details: statusData,
                },
                { status: statusResponse.status }
            );
        }

        return NextResponse.json(statusData);
    } catch (error: any) {
        console.error('Error checking undress RunPod job status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check undress generation status' },
            { status: 500 }
        );
    }
}
