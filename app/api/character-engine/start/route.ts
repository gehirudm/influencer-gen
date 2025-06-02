import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import firebaseApp from "@/lib/firebaseAdmin";

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

export async function POST(request: Request) {
    try {
        // Initialize Firebase Admin
        const db = getFirestore(firebaseApp);
        const auth = getAuth(firebaseApp);

        // Get request data
        const { characterId, sessionCookie } = await request.json();

        // Validate required parameters
        if (!characterId) {
            return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
        }

        if (!sessionCookie) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // Verify user authentication
        const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
        const userId = decodedToken.uid;

        // Check if user has character-engine privilege
        const userSystemDoc = await db.collection('users').doc(userId).collection('system').doc('settings').get();
        const userSystemData = userSystemDoc.data();
        
        if (!userSystemData || !userSystemData.allowCharacterEngine) {
            return NextResponse.json({ error: "You don't have permission to use the character engine" }, { status: 403 });
        }

        // Verify character belongs to user
        const characterDoc = await db.collection('characters').doc(characterId).get();
        if (!characterDoc.exists) {
            return NextResponse.json({ error: "Character not found" }, { status: 404 });
        }
        
        const characterData = characterDoc.data();
        if (characterData?.userId !== userId) {
            return NextResponse.json({ error: "You don't have permission to access this character" }, { status: 403 });
        }

        // Start RunPods pod with character ID
        const podResponse = await fetch("https://rest.runpod.io/v1/pods", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RUNPOD_API_KEY}`
            },
            body: JSON.stringify({
                "allowedCudaVersions": ["12.8"],
                "cloudType": "SECURE",
                "computeType": "GPU",
                "containerDiskInGb": 50,
                "containerRegistryAuthId": "cmali9l900001jx08hknn7ysk",
                "countryCodes": [""],
                "cpuFlavorIds": ["cpu3c"],
                "cpuFlavorPriority": "availability",
                "dataCenterIds": [],
                "dataCenterPriority": "availability",
                "dockerEntrypoint": [],
                "dockerStartCmd": [],
                "env": {
                    "CHARACTER_ID": characterId,
                    "USER_ID": userId
                },
                "gpuCount": 1,
                "gpuTypeIds": [
                    "NVIDIA A100 80GB PCIe",
                    "NVIDIA GeForce RTX 3080 Ti",
                    "NVIDIA H100 80GB HBM3"
                ],
                "gpuTypePriority": "availability",
                "interruptible": false,
                "locked": false,
                "minDiskBandwidthMBps": 1,
                "minDownloadMbps": 1,
                "minRAMPerGPU": 8,
                "minUploadMbps": 1,
                "minVCPUPerGPU": 2,
                "name": `Character Engine - ${characterId}`,
                "ports": [
                    "8888/http",
                    "22/tcp"
                ],
                "supportPublicIp": true,
                "templateId": "lsxbetpmei",
                "vcpuCount": 2,
                "volumeInGb": 20,
                "volumeMountPath": "/workspace"
            })
        });

        const podData = await podResponse.json();

        if (!podResponse.ok) {
            console.error("RunPods API error:", podData);
            return NextResponse.json({ error: "Failed to start character engine" }, { status: 500 });
        }

        // Create a record in Firestore to track the pod
        await db.collection('character_engine_pods').doc(podData.id).set({
            userId,
            characterId,
            podId: podData.id,
            status: "starting",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            podId: podData.id,
            message: "Character engine started successfully"
        });

    } catch (error) {
        console.error("Error starting character engine:", error);
        return NextResponse.json({ error: "Failed to start character engine" }, { status: 500 });
    }
}