export enum FeatureId {
    IMAGE_GENENRATION_SIMPLE = 'image_generation_simple',
    IMAGE_GENERATION_ADVANCED = 'image_generation_advanced',
    IMAGE_GENERATION_IMG2IMG = 'image_generation_img2img',
    IMAGE_GENERATION_NO_WATERMARK = 'image_generation_no_watermark',
    IMAGE_EDITING = 'image_editing',
    IMAGE_GENERATION_WITH_CHARACTER = 'image_generation_with_character',
    CHARACTER_ENGINE_TRAINING = 'character_engine_training',
    IMAGE_GENERATION_CHARACTER_ENGINE = 'image_generation_character_engine',
    NUDIFY = 'nudify',
    CHARACTER_CREATION = 'character_creation',
    PROJECT_CREATION = 'project_creation',
}

export const FeatureDisplayNames: Record<FeatureId, string> = {
    [FeatureId.IMAGE_GENENRATION_SIMPLE]: 'AI Image Generation (Simple)',
    [FeatureId.IMAGE_GENERATION_ADVANCED]: 'AI Image Generation (Advanced)',
    [FeatureId.IMAGE_GENERATION_IMG2IMG]: 'Image 2 Image Generation',
    [FeatureId.IMAGE_GENERATION_NO_WATERMARK]: 'Image generation without watermark',
    [FeatureId.IMAGE_EDITING]: 'Image Editing',
    [FeatureId.IMAGE_GENERATION_WITH_CHARACTER]: 'Character-based Image Generation',
    [FeatureId.CHARACTER_ENGINE_TRAINING]: 'Character Engine Training',
    [FeatureId.IMAGE_GENERATION_CHARACTER_ENGINE]: 'Trained Character Image Generation',
    [FeatureId.NUDIFY]: 'Nudify',
    [FeatureId.CHARACTER_CREATION]: 'Character Creation',
    [FeatureId.PROJECT_CREATION]: 'Project Creation',
}

export const SUBSCRIPTION_TIERS = ["free", "Basic Plan", "Premium Plan", "Promo"] as const;

export type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<
    infer ElementType
>
    ? ElementType
    : never

export type SUBSCRIPTION_TIERS_TYPE = ElementType<typeof SUBSCRIPTION_TIERS>

type USER_LEVEL = ElementType<typeof SUBSCRIPTION_TIERS> | "admin";

export const SUBSCRIPTION_FEATURES: Record<USER_LEVEL, FeatureId[]> = {
    // Free tier has basic features
    'free': [],

    // Promo tier has all basic features plus no watermark
    'Promo': [
        FeatureId.IMAGE_GENENRATION_SIMPLE,
        FeatureId.IMAGE_GENERATION_ADVANCED,
        FeatureId.IMAGE_GENERATION_IMG2IMG,
        FeatureId.IMAGE_EDITING,
        FeatureId.IMAGE_GENERATION_WITH_CHARACTER,
        FeatureId.NUDIFY,
        FeatureId.CHARACTER_CREATION,
        FeatureId.PROJECT_CREATION,
    ],

    // Basic Plan has more features
    'Basic Plan': [
        FeatureId.IMAGE_GENENRATION_SIMPLE,
        FeatureId.IMAGE_GENERATION_ADVANCED,
        FeatureId.IMAGE_GENERATION_IMG2IMG,
        FeatureId.IMAGE_GENERATION_NO_WATERMARK,
        FeatureId.IMAGE_EDITING,
        FeatureId.IMAGE_GENERATION_WITH_CHARACTER,
        FeatureId.NUDIFY,
        FeatureId.CHARACTER_CREATION,
        FeatureId.PROJECT_CREATION,
    ],

    // Premium Plan has all features
    'Premium Plan': [
        FeatureId.IMAGE_GENENRATION_SIMPLE,
        FeatureId.IMAGE_GENERATION_ADVANCED,
        FeatureId.IMAGE_GENERATION_IMG2IMG,
        FeatureId.IMAGE_GENERATION_NO_WATERMARK,
        FeatureId.IMAGE_EDITING,
        FeatureId.IMAGE_GENERATION_WITH_CHARACTER,
        FeatureId.CHARACTER_ENGINE_TRAINING,
        FeatureId.IMAGE_GENERATION_CHARACTER_ENGINE,
        FeatureId.NUDIFY,
        FeatureId.CHARACTER_CREATION,
        FeatureId.PROJECT_CREATION,
    ],

    // Admin tier has all features
    'admin': [
        FeatureId.IMAGE_GENENRATION_SIMPLE,
        FeatureId.IMAGE_GENERATION_ADVANCED,
        FeatureId.IMAGE_GENERATION_IMG2IMG,
        FeatureId.IMAGE_GENERATION_NO_WATERMARK,
        FeatureId.IMAGE_EDITING,
        FeatureId.IMAGE_GENERATION_WITH_CHARACTER,
        FeatureId.CHARACTER_ENGINE_TRAINING,
        FeatureId.IMAGE_GENERATION_CHARACTER_ENGINE,
        FeatureId.NUDIFY,
        FeatureId.CHARACTER_CREATION,
        FeatureId.PROJECT_CREATION,
    ],
};

export const TOKEN_AMOUNT_PER_SUBSCRIPTION: Record<ElementType<typeof SUBSCRIPTION_TIERS>, number> = {
    "free": 0,
    "Promo": 50,
    "Basic Plan": 1000,
    "Premium Plan": 10000,
}

export const getSubscriptionTierForFeature = (featureId: FeatureId): SUBSCRIPTION_TIERS_TYPE => {
    for (const tier of SUBSCRIPTION_TIERS) {
        if (SUBSCRIPTION_FEATURES[tier as USER_LEVEL].includes(featureId)) {
            return tier as SUBSCRIPTION_TIERS_TYPE;
        }
    }

    return "Premium Plan";
}