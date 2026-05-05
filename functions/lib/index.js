"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoThumbnail = exports.generateThumbnail = void 0;
const storage_1 = require("firebase-functions/v2/storage");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const storage_2 = require("firebase-admin/storage");
const sharp_1 = __importDefault(require("sharp"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
(0, app_1.initializeApp)();
const BUCKET_NAME = "influncer-gen.firebasestorage.app";
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_QUALITY = 80;
/**
 * Cloud Function: generateThumbnail
 *
 * Triggers when a new file is uploaded to Firebase Storage.
 * If the file matches `generated-images/{userId}/{imageId}.png`,
 * it creates a 300px-wide JPEG thumbnail at
 * `generated-images/{userId}/thumbnails/{imageId}_thumb.jpg`
 * and updates the Firestore `images/{imageId}` document with the thumbnail URL.
 */
exports.generateThumbnail = (0, storage_1.onObjectFinalized)({
    bucket: BUCKET_NAME,
    memory: "512MiB",
    timeoutSeconds: 120,
    region: "us-central1",
}, async (event) => {
    const filePath = event.data.name;
    if (!filePath) {
        console.log("No file path in event, skipping.");
        return;
    }
    // Only process files in generated-images/{userId}/{imageId}.png
    // Skip thumbnails, base images, masks, and other files
    const match = filePath.match(/^generated-images\/([^/]+)\/([^/]+)\.png$/);
    if (!match) {
        console.log(`Skipping non-matching path: ${filePath}`);
        return;
    }
    const userId = match[1];
    const imageId = match[2];
    // Skip if this is a base or mask image (they contain 'base' or 'mask' in the name)
    if (imageId === "base" || imageId === "mask") {
        console.log(`Skipping base/mask image: ${filePath}`);
        return;
    }
    // Skip if it's already a thumbnail
    if (imageId.endsWith("_thumb")) {
        console.log(`Skipping thumbnail: ${filePath}`);
        return;
    }
    const storage = (0, storage_2.getStorage)();
    const bucket = storage.bucket(BUCKET_NAME);
    const db = (0, firestore_1.getFirestore)();
    const thumbnailFileName = `${imageId}_thumb.jpg`;
    const thumbnailPath = `generated-images/${userId}/thumbnails/${thumbnailFileName}`;
    console.log(`Processing: ${filePath} → thumbnail at ${thumbnailPath}`);
    try {
        // Download the original image
        const originalFile = bucket.file(filePath);
        const [buffer] = await originalFile.download();
        // Resize with sharp
        const thumbnailBuffer = await (0, sharp_1.default)(buffer)
            .resize(THUMBNAIL_WIDTH, null, {
            fit: "inside",
            withoutEnlargement: true,
        })
            .jpeg({ quality: THUMBNAIL_QUALITY })
            .toBuffer();
        // Upload the thumbnail
        const thumbnailFile = bucket.file(thumbnailPath);
        await thumbnailFile.save(thumbnailBuffer, {
            metadata: {
                contentType: "image/jpeg",
                metadata: {
                    originalPath: filePath,
                    generatedBy: "generateThumbnail",
                },
            },
        });
        // Generate a signed URL (long expiry)
        const [thumbnailUrl] = await thumbnailFile.getSignedUrl({
            action: "read",
            expires: "2100-01-01",
        });
        // Update the Firestore image document with thumbnailUrl
        const imageDocRef = db.collection("images").doc(imageId);
        const imageDoc = await imageDocRef.get();
        if (imageDoc.exists) {
            await imageDocRef.update({ thumbnailUrl });
            console.log(`Updated images/${imageId} with thumbnailUrl`);
        }
        else {
            console.log(`Image document images/${imageId} not found, skipping Firestore update`);
        }
        console.log(`Thumbnail generated successfully: ${thumbnailPath}`);
    }
    catch (error) {
        console.error(`Error generating thumbnail for ${filePath}:`, error);
        throw error;
    }
});
/**
 * Extracts the first frame from a video file using ffmpeg.
 * Returns a Buffer containing the JPEG-encoded frame.
 */
function extractVideoFrame(videoPath) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const child = (0, child_process_1.spawn)(ffmpeg_static_1.default !== null && ffmpeg_static_1.default !== void 0 ? ffmpeg_static_1.default : "ffmpeg", [
            "-i",
            videoPath,
            "-vframes",
            "1",
            "-f",
            "image2pipe",
            "-vcodec",
            "mjpeg",
            "-an",
            "-y",
            "pipe:1",
        ]);
        child.stdout.on("data", (chunk) => {
            chunks.push(chunk);
        });
        child.stdout.on("end", () => {
            if (chunks.length === 0) {
                reject(new Error("No frame extracted from video"));
            }
            else {
                resolve(Buffer.concat(chunks));
            }
        });
        child.on("error", reject);
        child.stderr.on("data", () => {
            // ffmpeg logs info to stderr, not errors
        });
    });
}
/**
 * Cloud Function: generateVideoThumbnail
 *
 * Triggers when a new video file is uploaded to Firebase Storage
 * at generated-videos/{userId}/{outputId}.{ext}.
 * Extracts the first frame, creates a 300px-wide JPEG thumbnail at
 * generated-videos/{userId}/thumbnails/{outputId}_thumb.jpg
 * and updates the Firestore images/{outputId} document with thumbnailUrl.
 */
exports.generateVideoThumbnail = (0, storage_1.onObjectFinalized)({
    bucket: BUCKET_NAME,
    memory: "1GiB",
    timeoutSeconds: 300,
    region: "us-central1",
}, async (event) => {
    const filePath = event.data.name;
    if (!filePath) {
        console.log("No file path in event, skipping video thumbnail.");
        return;
    }
    const match = filePath.match(/^generated-videos\/([^/]+)\/([^/]+)\.(mp4|webm|avi|mov)$/);
    if (!match) {
        console.log(`Skipping non-video path: ${filePath}`);
        return;
    }
    const userId = match[1];
    const outputId = match[2];
    const ext = match[3];
    if (outputId.includes("_thumb")) {
        console.log(`Skipping thumbnail itself: ${filePath}`);
        return;
    }
    const storage = (0, storage_2.getStorage)();
    const bucket = storage.bucket(BUCKET_NAME);
    const db = (0, firestore_1.getFirestore)();
    const thumbnailFileName = `${outputId}_thumb.jpg`;
    const thumbnailPath = `generated-videos/${userId}/thumbnails/${thumbnailFileName}`;
    console.log(`Processing video: ${filePath} → thumbnail at ${thumbnailPath}`);
    const originalFile = bucket.file(filePath);
    const tempVideoPath = path.join(os.tmpdir(), `${outputId}.${ext}`);
    try {
        await originalFile.download({ destination: tempVideoPath });
        console.log(`Downloaded video to ${tempVideoPath}`);
        const frameBuffer = await extractVideoFrame(tempVideoPath);
        const thumbnailBuffer = await (0, sharp_1.default)(frameBuffer)
            .resize(THUMBNAIL_WIDTH, null, {
            fit: "inside",
            withoutEnlargement: true,
        })
            .jpeg({ quality: THUMBNAIL_QUALITY })
            .toBuffer();
        const thumbnailFile = bucket.file(thumbnailPath);
        await thumbnailFile.save(thumbnailBuffer, {
            metadata: {
                contentType: "image/jpeg",
                metadata: {
                    originalPath: filePath,
                    generatedBy: "generateVideoThumbnail",
                },
            },
        });
        const [thumbnailUrl] = await thumbnailFile.getSignedUrl({
            action: "read",
            expires: "2100-01-01",
        });
        const imageDocRef = db.collection("images").doc(outputId);
        try {
            await imageDocRef.get();
            await imageDocRef.update({ thumbnailUrl });
            console.log(`Updated images/${outputId} with video thumbnailUrl`);
        }
        catch (_a) {
            console.log(`Image doc images/${outputId} not found, skipping Firestore update`);
        }
        console.log(`Video thumbnail generated: ${thumbnailPath}`);
    }
    catch (error) {
        console.error(`Error generating video thumbnail for ${filePath}:`, error);
        throw error;
    }
    finally {
        try {
            fs.unlinkSync(tempVideoPath);
        }
        catch (_b) {
            // best effort cleanup
        }
    }
});
//# sourceMappingURL=index.js.map