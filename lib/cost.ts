import { FeatureId } from "./subscriptions";

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