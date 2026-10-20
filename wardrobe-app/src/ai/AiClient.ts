import type {
  CapsulePlanText,
  Category,
  GarmentAnalysis,
  InspirationAnalysis,
  Occasion,
  ProductAnalysis,
  Result,
  Season,
} from '@/domain/types';

export interface AnalyzeGarmentInput {
  imageUri?: string;
  text?: string;
}

export interface AnalyzeProductPageInput {
  /** Empty string = no page; analyse only the label photo / pasted text. */
  url: string;
  pastedText?: string;
  labelImageUri?: string;
}

export interface AnalyzeInspirationInput {
  imageUris: string[];
  sourceUrl?: string;
}

/** Aggregated, non-personal summary used to phrase the capsule plan; no photos are sent. */
export interface GapPlanInput {
  language: 'tr' | 'en';
  season?: Season;
  wardrobeCounts: Partial<Record<Category, number>>;
  frequentOccasions: Occasion[];
  gaps: { title: string; reason: string; priority: number }[];
}

export interface CallOptions {
  signal?: AbortSignal;
}

export interface AiClient {
  readonly kind: 'proxy' | 'direct' | 'mock';
  analyzeGarment(input: AnalyzeGarmentInput, options?: CallOptions): Promise<Result<GarmentAnalysis>>;
  analyzeProductPage(input: AnalyzeProductPageInput, options?: CallOptions): Promise<Result<ProductAnalysis>>;
  analyzeInspiration(input: AnalyzeInspirationInput, options?: CallOptions): Promise<Result<InspirationAnalysis>>;
  gapPlan(input: GapPlanInput, options?: CallOptions): Promise<Result<CapsulePlanText>>;
}
