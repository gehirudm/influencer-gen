/**
 * One-off script to set LoRA tokens for an admin user.
 * Run with: npx tsx scripts/set-admin-lora-tokens.ts
 */

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert(serviceAccount),
    });

const db = getFirestore(app);

const ADMIN_UID = "svOQT6MEUVhH5ScHmGMGTU04Q3c2";
const LORA_TOKENS = 10;

async function main() {
    const ref = db.doc(`users/${ADMIN_UID}/private/system`);
    const doc = await ref.get();

    if (!doc.exists) {
        console.error("System doc not found for user:", ADMIN_UID);
        process.exit(1);
    }

    const current = doc.data();
    console.log("Current data:", current);

    await ref.update({ loraTokens: LORA_TOKENS });

    const updated = (await ref.get()).data();
    console.log("Updated data:", updated);
    console.log(`✅ Set loraTokens to ${LORA_TOKENS} for admin ${ADMIN_UID}`);
}

main().catch(console.error);
