import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';
import workflowTemplate from '@/workflows/z_image_turbo_api_workflow.json';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const COMFYUI_ENDPOINT_ID = process.env.COMFYUI_ENDPOINT_ID;

if (!COMFYUI_ENDPOINT_ID) {
    console.warn('COMFYUI_ENDPOINT_ID environment variable is not set');
}

interface ComfyUIRunResponse {
    id: string;
    status: string;
}

/**
 * Updates the prompt in the API workflow
 */
function updateWorkflowWithPrompt(workflow: typeof workflowTemplate, prompt: string): typeof workflowTemplate {
    // Deep clone the workflow to avoid mutating the original
    const updatedWorkflow = JSON.parse(JSON.stringify(workflow)) as typeof workflowTemplate;

    // Update node 45 (CLIPTextEncode for prompt) with the user's prompt
    if (updatedWorkflow["45"] && updatedWorkflow["45"].inputs) {
        updatedWorkflow["45"].inputs.text = prompt;
    }

    return updatedWorkflow;
}

export async function POST(request: NextRequest) {
    try {
        // Verify user authentication
        const { shouldReturn, response, userId } = await verifyRequestCookies(request);
        if (shouldReturn) {
            return response;
        }

        // Parse request body
        const body = await request.json();
        const { prompt } = body;

        // Validate prompt
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: 'Prompt is required' },
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

        // Update workflow with user's prompt
        const updatedWorkflow = updateWorkflowWithPrompt(workflowTemplate, prompt.trim());

        // Submit to RunPod ComfyUI endpoint
        const runpodResponse = await fetch(
            `https://api.runpod.ai/v2/${COMFYUI_ENDPOINT_ID}/run`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RUNPOD_API_KEY}`
                },
                body: JSON.stringify({
                    input: {
                        workflow: updatedWorkflow
                    }
                })
            }
        );

        if (!runpodResponse.ok) {
            const errorData = await runpodResponse.json().catch(() => ({}));
            console.error('RunPod API error:', errorData);
            return NextResponse.json(
                { error: 'Failed to submit workflow to RunPod', details: errorData },
                { status: runpodResponse.status }
            );
        }

        const runpodData: ComfyUIRunResponse = await runpodResponse.json();

        console.log(`ComfyUI job submitted for user ${userId}:`, runpodData);

        return NextResponse.json({
            success: true,
            jobId: runpodData.id,
            status: runpodData.status
        });

    } catch (error: any) {
        console.error('Error in ComfyUI run endpoint:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process workflow request' },
            { status: 500 }
        );
    }
}
