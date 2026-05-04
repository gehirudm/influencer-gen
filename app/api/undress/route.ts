import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';
import workflowTemplate from '@/workflows/undress_workflow_working.json';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const UNDRESS_RUNPOD_ENDPOINT_ID = process.env.UNDRESS_RUNPOD_ENDPOINT_ID || 'hxppbocrongwcv';

interface RunPodRunResponse {
    id: string;
    status: string;
    error?: string;
}

export async function POST(request: NextRequest) {
    try {
        const { shouldReturn, response } = await verifyRequestCookies(request);
        if (shouldReturn) {
            return response;
        }

        const body = await request.json();
        const { image, mode } = body as { image?: string; mode?: string };

        if (mode && mode !== 'Undress') {
            return NextResponse.json(
                { error: 'Only Undress mode is currently supported' },
                { status: 400 }
            );
        }

        if (!image || typeof image !== 'string') {
            return NextResponse.json(
                { error: 'image is required' },
                { status: 400 }
            );
        }

        if (!RUNPOD_API_KEY) {
            return NextResponse.json(
                { error: 'RunPod API key not configured' },
                { status: 500 }
            );
        }

        const runpodResponse = await fetch(
            `https://api.runpod.ai/v2/${UNDRESS_RUNPOD_ENDPOINT_ID}/run`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RUNPOD_API_KEY}`,
                },
                body: JSON.stringify({
                    input: {
                        image,
                        workflow: workflowTemplate,
                    },
                }),
            }
        );

        const runpodData: RunPodRunResponse & Record<string, any> = await runpodResponse.json();

        if (!runpodResponse.ok) {
            return NextResponse.json(
                {
                    error: runpodData.error || 'Failed to start RunPod job',
                    details: runpodData,
                },
                { status: runpodResponse.status }
            );
        }

        return NextResponse.json({
            success: true,
            jobId: runpodData.id,
            status: runpodData.status,
        });
    } catch (error: any) {
        console.error('Error creating undress RunPod job:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to start undress generation' },
            { status: 500 }
        );
    }
}
