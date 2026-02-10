export enum FeatureId {
    IMAGE_GENENRATION_SIMPLE = 'image_generation_simple',
    IMAGE_GENERATION_ADVANCED = 'image_generation_advanced',
    IMAGE_GENERATION_IMG2IMG = 'image_generation_img2img',
    IMAGE_EDITING = 'image_editing',
    IMAGE_GENERATION_WITH_CHARACTER = 'image_generation_with_character',
    CHARACTER_ENGINE_TRAINING = 'character_engine_training',
    IMAGE_GENERATION_CHARACTER_ENGINE = 'image_generation_character_engine',
    NUDIFY = 'nudify',
    CHARACTER_CREATION = 'character_creation',
    PROJECT_CREATION = 'project_creation',
}

const _ALL_FEATURES = Object.values(FeatureId);

export const FeatureDisplayNames: Record<FeatureId, string> = {
    [FeatureId.IMAGE_GENENRATION_SIMPLE]: 'AI Image Generation (Simple)',
    [FeatureId.IMAGE_GENERATION_ADVANCED]: 'AI Image Generation (Advanced)',
    [FeatureId.IMAGE_GENERATION_IMG2IMG]: 'Image to Image Generation',
    [FeatureId.IMAGE_EDITING]: 'Image Editing',
    [FeatureId.IMAGE_GENERATION_WITH_CHARACTER]: 'Character-based Image Generation',
    [FeatureId.CHARACTER_ENGINE_TRAINING]: 'Character Engine Training',
    [FeatureId.IMAGE_GENERATION_CHARACTER_ENGINE]: 'Trained Character Image Generation',
    [FeatureId.NUDIFY]: 'Nudify',
    [FeatureId.CHARACTER_CREATION]: 'Character Creation',
    [FeatureId.PROJECT_CREATION]: 'Project Creation',
}

// User access levels: free, paid, or admin
export type UserAccessLevel = 'free' | 'paid' | 'admin';

// Kept for backward compat with existing code that references this type
export const SUBSCRIPTION_TIERS = ["free", "paid"] as const;
export type SUBSCRIPTION_TIERS_TYPE = 'free' | 'paid';

// Feature sets per access level
export const SUBSCRIPTION_FEATURES: Record<UserAccessLevel, FeatureId[]> = {
    // Free tier has basic generation features only
    'free': [
        FeatureId.IMAGE_GENENRATION_SIMPLE,
        FeatureId.IMAGE_GENERATION_ADVANCED,
        FeatureId.IMAGE_GENERATION_IMG2IMG,
        FeatureId.IMAGE_EDITING,
        FeatureId.PROJECT_CREATION,
    ],

    // Paid users get ALL features
    'paid': _ALL_FEATURES,

    // Admin gets all features
    'admin': _ALL_FEATURES,
};

export const GenerationRequestFeatureCheck: Record<FeatureId, (req: ImageGenerationRequestInput) => boolean> = {
    [FeatureId.IMAGE_GENENRATION_SIMPLE]: (req) => req.generation_type === 'simple',
    [FeatureId.IMAGE_GENERATION_ADVANCED]: (req) => req.generation_type === 'advanced',
    [FeatureId.IMAGE_GENERATION_IMG2IMG]: (req) => req.generation_type === 'advanced' && !!req.base_img,
    [FeatureId.IMAGE_EDITING]: (req) => !!req.base_img && !!req.mask_img,
    [FeatureId.IMAGE_GENERATION_WITH_CHARACTER]: (req) => req.generation_type === 'advanced' && !!req.base_img,
    [FeatureId.CHARACTER_ENGINE_TRAINING]: (req) => false,
    [FeatureId.IMAGE_GENERATION_CHARACTER_ENGINE]: (req) => false,
    [FeatureId.NUDIFY]: (req) => req.generation_type === "nudify",
    [FeatureId.CHARACTER_CREATION]: (req) => false,
    [FeatureId.PROJECT_CREATION]: (req) => false,
}

export const getSubscriptionTierForFeature = (featureId: FeatureId): UserAccessLevel => {
    if (SUBSCRIPTION_FEATURES['free'].includes(featureId)) {
        return 'free';
    }
    return 'paid';
}

export const getUserAccessLevel = (isPaidCustomer?: boolean, isAdmin?: boolean): UserAccessLevel => {
    if (isAdmin) return 'admin';
    if (isPaidCustomer) return 'paid';
    return 'free';
}

export const checkGenerateRequestUserAllowance = (request: ImageGenerationRequestInput, accessLevel: UserAccessLevel): boolean => {
    for (const feature of _ALL_FEATURES) {
        if (GenerationRequestFeatureCheck[feature](request)
            && !SUBSCRIPTION_FEATURES[accessLevel].includes(feature))
            return false;
    }

    return true;
}