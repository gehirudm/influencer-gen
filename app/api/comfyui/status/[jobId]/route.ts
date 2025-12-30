import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';

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

        // Log for debugging (remove in production)
        console.log(`ComfyUI job status for ${jobId}:`, {
            status: statusData.status,
            hasOutput: !!statusData.output,
            userId
        });

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
