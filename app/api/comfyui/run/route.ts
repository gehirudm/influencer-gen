import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';
import workflowTemplate from '@/workflows/dynamic_lora_test.json';

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
 * Updates the dynamic LoRA workflow with user inputs:
 * - Node 6: Positive prompt (CLIPTextEncode)
 * - Node 7: Negative prompt (CLIPTextEncode)
 * - Node 32: LoRA URL (Load LoRA From URL)
 */
function updateWorkflow(
    workflow: any,
    prompt: string,
    negativePrompt: string,
    loraUrl: string
): any {
    const updated = JSON.parse(JSON.stringify(workflow));

    // Node 6 — Positive prompt
    if (updated["6"]?.inputs) {
        updated["6"].inputs.text = prompt;
    }

    // Node 7 — Negative prompt
    if (updated["7"]?.inputs) {
        updated["7"].inputs.text = negativePrompt;
    }

    // Node 32 — LoRA URL
    if (updated["32"]?.inputs) {
        updated["32"].inputs.url = loraUrl;
    }

    // Randomise seed so each generation is unique
    if (updated["3"]?.inputs) {
        updated["3"].inputs.seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }

    return updated;
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
        const { prompt, negativePrompt, loraUrl } = body;

        // Validate required fields
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        if (!loraUrl || typeof loraUrl !== 'string' || loraUrl.trim().length === 0) {
            return NextResponse.json(
                { error: 'LoRA URL is required' },
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

        // Build the updated workflow
        const updatedWorkflow = updateWorkflow(
            workflowTemplate,
            prompt.trim(),
            (negativePrompt || '').trim(),
            loraUrl.trim()
        );

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

        console.log(`ComfyUI LoRA job submitted for user ${userId}:`, runpodData);

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
