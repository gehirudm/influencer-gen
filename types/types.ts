type WithId<T> = T & { id: string };

interface ImageGenerationMetadata {
    height: number;
    width: number;
    prompt: string;
    neg_prompt?: string;
    cfg?: number;
    seed?: string;
    n_samples?: number;
    guidance_scale?: number;
    base_img?: string;
    batch_size?: number;
}

interface CharacterAttribute {
    name: string;
    value: string;
}

// Interface for the 'users' collection
interface UserProfile {
    username: string;
    displayName: string;
    createdAt: string;
    bio: string;
    avatar: string;
}

// Interface for the 'users/{userid}/private' collection
interface UserPrivateProfileData {
    password: string;
    tokens: number;
}

// Interface for the 'projects' collection
interface UserProject {
    userId: string;
    name: string;
    description: string;
}

// Interface for the 'characters' collection
interface UserCharacter {
    userId: string;
    name: string;
    imageIds: string[];
    imageUrls: string[];
    createdAt: string;
    description: string;
    characteristics: CharacterAttribute[];
}

// Interface for the 'images' collection
interface UserImage {
    userId: string;
    projectId: string;
    characterId: string;
    isPublic: boolean;
    metadata: ImageGenerationMetadata;
    createdAt: string;
}

// Interface for the 'likes' collection
interface ImageLike {
    imageId: string;
    userId: string;
    createdAt: string;
}

// Interface for the 'comments' collection
interface ImageComment {
    imageId: string;
    userId: string;
    text: string;
    createdAt: string;
}

// Interface for the 'jobs' collection
interface ImageGenerationJob {
    status: string;
    prompt: string;
    createdAt: string;
    delayTime: number;
    executionTime: number;
    imageIds: string[];
    metadata: ImageGenerationMetadata;
    statusTimestamps: {
        [key: string]: string;
    };
    updatedAt: string;
    userId: string;
    tokens: number;
}

interface RunPodsCompletedResponseData {
    "delayTime": number,      // Time in queue (ms)
    "executionTime": number, // Processing time (ms)
    "id": string, // Job ID
    "output": {
        "image": string, // Base64 encoded image data
    }[],
    "status": string
}

interface StableDiffusionRequestInput {
    /**
     * The text prompt to guide image generation (required)
     */
    prompt: string;

    /**
     * Text prompt specifying what should not appear in the image
     * @default "ugly, distorted, low quality"
     */
    negative_prompt?: string;

    /**
     * Width of the generated image in pixels
     * @default 1024
     */
    width?: number;

    /**
     * Height of the generated image in pixels
     * @default 1024
     */
    height?: number;

    /**
     * Number of denoising steps (more steps = higher quality but slower)
     * @default 30
     */
    steps?: number;

    /**
     * Classifier-free guidance scale (how closely to follow the prompt)
     * @default 3
     */
    cfg_scale?: number;

    /**
     * Random seed for reproducible results (if not provided, a random seed is used)
     */
    seed?: number;

    /**
     * Number of images to generate in a single request (1-4)
     * @default 1
     * @min 1
     * @max 4
     */
    batch_size?: number;

    /**
     * DPM++ solver order (2 or 3)
     * @default 2
     */
    solver_order?: 2 | 3;

    /**
     * Base64-encoded image for img2img generation
     * If provided, the model will transform this image rather than generate from scratch
     */
    base_img?: string;

    /**
     * Base64-encoded image for img2img generation
     * If provided, the model will transform this image rather than generate from scratch
     */
    mask_img?: string;

    /**
     * Strength of transformation for img2img (0.0 = no change, 1.0 = complete change)
     * Only used when base_img is provided
     * @default 0.75
     * @min 0
     * @max 1
     */
    strength?: number;

    /**
     * Will trigger the auto cloth masking and image inpainting for the base image
     */
    auto_mask_clothes?: boolean;

    /**
     * Will add the watermark to the image
     */
    add_watermark?: boolean;
}

type ImageGenerationRequestInput =
    StableDiffusionRequestInput &
    {
        model_name: "lustify" | "realism",
        generation_type: "simple" | "advanced" | "nudify",
    };