import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestCookies } from '@/lib/requestUtils';
import { verifyDennisRole } from '@/lib/roleUtils';
import adminApp from '@/lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import workflowTemplate from '@/workflows/ltx2.3_video_api.json';

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const VIDEO_ENDPOINT_ID = process.env.VIDEO_RUNPOD_ENDPOINT_ID;

const VIDEO_GENERATION_COST = 100;

const AVAILABLE_LORAS = [
    { name: 'hxwoman_lora_v1_FINAL.safetensors', label: 'hxwoman v1 Final (Recommended)' },
    { name: 'hxwoman_lora_v1_000005500.safetensors', label: 'hxwoman v1 — Iteration 5500' },
    { name: 'hxwoman_lora_v1_000004000.safetensors', label: 'hxwoman v1 — Iteration 4000' },
] as const;

interface VideoGenerateBody {
    prompt: string;
    negativePrompt?: string;
    frameRate?: number;
    length?: number;
    resolution?: string;
    steps?: number;
    cfg?: number;
    seed?: number;
    loraStrength?: number;
    loraName?: string;
}

function updateVideoWorkflow(
    workflow: any,
    params: Required<Pick<VideoGenerateBody, 'prompt'>> & Omit<VideoGenerateBody, 'prompt'>
): any {
    const updated = JSON.parse(JSON.stringify(workflow));

    // Node 303 — Positive prompt
    if (updated['303']?.inputs) {
        updated['303'].inputs.text = params.prompt.trim();
    }

    // Node 313 — Negative prompt
    if (updated['313']?.inputs) {
        updated['313'].inputs.text = (params.negativePrompt || '').trim();
    }

    // Node 323 — KSampler (seed, steps, cfg)
    if (updated['323']?.inputs) {
        updated['323'].inputs.seed = params.seed ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        updated['323'].inputs.steps = params.steps ?? 9;
        updated['323'].inputs.cfg = params.cfg ?? 1;
    }

    // Node 301 — Length (frames)
    if (updated['301']?.inputs) {
        updated['301'].inputs.value = params.length ?? 241;
    }

    // Node 304 — LTXVConditioning (frame_rate)
    if (updated['304']?.inputs) {
        updated['304'].inputs.frame_rate = params.frameRate ?? 24;
    }

    // Node 295 — EmptyLTXVLatentVideo (width, height)
    const resolution = params.resolution ?? '1920x1088';
    const [width, height] = resolution.split('x').map(Number);
    if (updated['295']?.inputs) {
        updated['295'].inputs.width = width || 1920;
        updated['295'].inputs.height = height || 1088;
    }

    // Node 285 — LoraLoaderModelOnly (lora_name, strength_model)
    const selectedLora = params.loraName ?? AVAILABLE_LORAS[0].name;
    if (updated['285']?.inputs) {
        updated['285'].inputs.lora_name = selectedLora;
        updated['285'].inputs.strength_model = params.loraStrength ?? 1.1;
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

        if (currentTokens < VIDEO_GENERATION_COST) {
            throw new Error(`Insufficient tokens. You need ${VIDEO_GENERATION_COST} tokens but have ${currentTokens}`);
        }

        tokensRemaining = currentTokens - VIDEO_GENERATION_COST;
        transaction.update(userRef, { tokens: tokensRemaining });
    });

    console.log(`Deducted ${VIDEO_GENERATION_COST} tokens from user ${userId}`);
    return tokensRemaining;
}

export async function POST(request: NextRequest) {
    try {
        const { shouldReturn, response, userId } = await verifyRequestCookies(request);
        if (shouldReturn) {
            return response;
        }

        await verifyDennisRole(userId);

        const body: VideoGenerateBody = await request.json();
        const { prompt, negativePrompt, frameRate, length, resolution, steps, cfg, seed, loraStrength, loraName } = body;

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        if (!RUNPOD_API_KEY) {
            return NextResponse.json({ error: 'RunPod API key not configured' }, { status: 500 });
        }

        if (!VIDEO_ENDPOINT_ID) {
            return NextResponse.json({ error: 'Video endpoint not configured' }, { status: 500 });
        }

        if (loraName && !AVAILABLE_LORAS.some((l) => l.name === loraName)) {
            return NextResponse.json(
                { error: `Invalid LoRA name. Available: ${AVAILABLE_LORAS.map((l) => l.name).join(', ')}` },
                { status: 400 }
            );
        }

        const db = getFirestore(adminApp);
        const tokensRemaining = await checkAndDeductTokens(userId, db);

        const updatedWorkflow = updateVideoWorkflow(workflowTemplate, {
            prompt,
            negativePrompt,
            frameRate,
            length,
            resolution,
            steps,
            cfg,
            seed,
            loraStrength,
            loraName,
        });

        const runpodResponse = await fetch(
            `https://api.runpod.ai/v2/${VIDEO_ENDPOINT_ID}/run`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RUNPOD_API_KEY}`,
                },
                body: JSON.stringify({
                    input: { workflow: updatedWorkflow },
                }),
            }
        );

        if (!runpodResponse.ok) {
            const errorData = await runpodResponse.json().catch(() => ({}));
            console.error('RunPod API error:', errorData);
            return NextResponse.json(
                { error: 'Failed to submit video workflow to RunPod', details: errorData },
                { status: runpodResponse.status }
            );
        }

        const runpodData: { id: string; status: string } = await runpodResponse.json();

        console.log(`Video generation for user ${userId}:`, runpodData);

        const jobRef = db.collection('jobs').doc(runpodData.id);
        await jobRef.create({
            userId,
            status: runpodData.status,
            generationType: 'video',
            metadata: {
                prompt: prompt.trim(),
                negative_prompt: (negativePrompt || '').trim(),
                frame_rate: frameRate ?? 24,
                length: length ?? 241,
                resolution: resolution ?? '1920x1088',
                steps: steps ?? 9,
                cfg: cfg ?? 1,
                seed: seed ?? null,
                lora_name: loraName ?? AVAILABLE_LORAS[0].name,
                lora_strength: loraStrength ?? 1.1,
                generation_type: 'video',
            },
            createdAt: new Date().toISOString(),
            ['statusTimestamps.IN_QUEUE']: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            jobId: runpodData.id,
            status: runpodData.status,
            tokensRemaining,
        });
    } catch (error: any) {
        console.error('Error in video generate endpoint:', error);

        if (error.message?.includes('Insufficient tokens')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error.message?.includes('Access denied') || error.message?.includes('Dennis role')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json(
            { error: error.message || 'Failed to process video generation request' },
            { status: 500 }
        );
    }
}
