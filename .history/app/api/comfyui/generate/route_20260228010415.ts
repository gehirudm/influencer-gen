import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import workflowTemplate from '@/workflows/dynamic_lora_test.json';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const COMFYUI_ENDPOINT_ID = process.env.COMFYUI_ENDPOINT_ID;

const LORA_GENERATION_COST = 40; // Cost in tokens per LoRA generation

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

async function checkAndDeductTokens(userId: string, db: FirebaseFirestore.Firestore) {
    const userRef = db.collection('users').doc(userId).collection('private').doc('system');

    let tokensRemaining = 0;

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
            throw new Error('User profile not found');
        }

        const userData = userDoc.data();
        const currentTokens = userData?.tokens || 0;

        if (currentTokens < LORA_GENERATION_COST) {
            throw new Error(`Insufficient tokens. You need ${LORA_GENERATION_COST} tokens but have ${currentTokens}`);
        }

        tokensRemaining = currentTokens - LORA_GENERATION_COST;
        transaction.update(userRef, { tokens: tokensRemaining });
    });

    console.log(`Deducted ${LORA_GENERATION_COST} tokens from user ${userId}`);
    return tokensRemaining;
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
        const { prompt, negativePrompt, loraUrl, loraKeyword } = body;

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

        // Deduct tokens before submitting the job
        const db = getFirestore(adminApp);
        const tokensRemaining = await checkAndDeductTokens(userId, db);

        // Prepend LoRA keyword to prompt if provided
        const finalPrompt = loraKeyword && loraKeyword.trim()
            ? `${loraKeyword.trim()} , ${prompt.trim()}`
            : prompt.trim();

        // Build the updated workflow
        const updatedWorkflow = updateWorkflow(
            workflowTemplate,
            finalPrompt,
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

        console.log(`ComfyUI LoRA generation for user ${userId}:`, runpodData);

        // Create a job document in Firestore so the image appears in assets
        const jobRef = db.collection('jobs').doc(runpodData.id);
        await jobRef.create({
            userId,
            status: runpodData.status,
            generationType: 'comfyui_lora',
            metadata: {
                prompt: finalPrompt,
                negative_prompt: (negativePrompt || '').trim(),
                loraUrl: loraUrl.trim(),
                loraKeyword: (loraKeyword || '').trim(),
                generation_type: 'comfyui_lora',
            },
            createdAt: new Date().toISOString(),
            ["statusTimestamps.IN_QUEUE"]: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            jobId: runpodData.id,
            status: runpodData.status,
            tokensRemaining
        });

    } catch (error: any) {
        console.error('Error in ComfyUI generate endpoint:', error);

        // Return appropriate status code for token errors
        if (error.message?.includes('Insufficient tokens')) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to process generation request' },
            { status: 500 }
        );
    }
}
