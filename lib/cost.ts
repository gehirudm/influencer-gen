import { FeatureId, GenerationRequestFeatureCheck } from "./subscriptions";

export type BillableFeatureIds =
    | FeatureId.IMAGE_GENENRATION_SIMPLE
    | FeatureId.IMAGE_GENERATION_ADVANCED
    | FeatureId.IMAGE_GENERATION_IMG2IMG
    | FeatureId.IMAGE_EDITING
    | FeatureId.IMAGE_GENERATION_WITH_CHARACTER
    | FeatureId.CHARACTER_ENGINE_TRAINING
    | FeatureId.IMAGE_GENERATION_CHARACTER_ENGINE
    | FeatureId.NUDIFY;

export const COST_MAP: Record<BillableFeatureIds, number> = {
    [FeatureId.IMAGE_GENENRATION_SIMPLE]: 10,
    [FeatureId.IMAGE_GENERATION_ADVANCED]: 10,
    [FeatureId.IMAGE_GENERATION_IMG2IMG]: 10,
    [FeatureId.IMAGE_EDITING]: 10,
    [FeatureId.IMAGE_GENERATION_WITH_CHARACTER]: 10,
    [FeatureId.CHARACTER_ENGINE_TRAINING]: 100,
    [FeatureId.IMAGE_GENERATION_CHARACTER_ENGINE]: 20,
    [FeatureId.NUDIFY]: 5
}

/**
 * Calculates the total cost of an image generation request based on the features it uses.
 * @param request The image generation request input
 * @returns The total cost in tokens
 */
export const calculateRequestCost = (request: ImageGenerationRequestInput): number => {
    let totalCost = 0;
    
    // Check each billable feature to see if it applies to this request
    for (const featureId of Object.keys(COST_MAP) as BillableFeatureIds[]) {
        // Use the feature check functions from subscriptions.ts to determine if this feature is used
        if (GenerationRequestFeatureCheck[featureId](request)) {
            totalCost += COST_MAP[featureId];
        }
    }
    
    // If no specific features were matched, default to a minimum cost
    // This is a safeguard in case the request doesn't match any known billable features
    if (totalCost === 0) {
        totalCost = COST_MAP[FeatureId.IMAGE_GENENRATION_SIMPLE];
    }
    
    return totalCost;
}