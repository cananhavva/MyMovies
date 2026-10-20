import { z } from 'zod';
import { CATEGORIES, FIBER_TYPES, OCCASIONS, PATTERNS, SEASONS, WEATHERS, includesValue } from '@/domain/taxonomy';
import type {
  CapsulePlanText,
  FiberPart,
  Formality,
  GarmentAnalysis,
  InspirationAnalysis,
  ProductAnalysis,
} from '@/domain/types';

/**
 * Lists drop unknown members instead of failing the whole response: one stray "fall" should not
 * cost the user an otherwise good analysis.
 */
function tolerantList<T extends string>(values: readonly T[]) {
  return z.array(z.string()).transform((items) => [...new Set(items.filter((v): v is T => includesValue(values, v)))]);
}

const scale1to5 = z
  .number()
  .transform((n) => Math.round(n))
  .pipe(z.number().int().min(1).max(5))
  .transform((n) => n as Formality);

const fiberPart = z
  .object({
    fiber: z.string().transform((f) => (includesValue(FIBER_TYPES, f) ? f : 'other')),
    percent: z.number().min(0).max(100),
  })
  .transform((part): FiberPart => part);

const composition = z.array(fiberPart);
const SALVAGED_CONFIDENCE = 0.3;
const confidence = z.number().transform((n) => Math.min(1, Math.max(0, n)));
const colors = z.array(z.string().min(1)).transform((list) => list.map((c) => c.trim().toLowerCase()));
const optionalText = z
  .string()
  .optional()
  .nullable()
  .transform((s) => (s ? s.trim() || undefined : undefined));

const garmentFields = {
  name: z.string().min(1),
  category: z.enum(CATEGORIES),
  subcategory: optionalText,
  colors,
  pattern: z.enum(PATTERNS).optional().nullable().transform((p) => p ?? undefined),
  seasons: tolerantList(SEASONS),
  weather: tolerantList(WEATHERS),
  occasions: tolerantList(OCCASIONS),
  formality: scale1to5.optional().nullable().transform((n) => n ?? undefined),
  warmth: scale1to5.optional().nullable().transform((n) => n ?? undefined),
  compositionGuess: composition.optional().nullable().transform((c) => c ?? undefined),
  confidence,
  isGarment: z.boolean().optional(),
};

export const garmentAnalysisSchema: z.ZodType<GarmentAnalysis> = z.object(garmentFields);

/** Second-chance schema used after the repair request also failed: every field falls back. */
export const lenientGarmentAnalysisSchema: z.ZodType<GarmentAnalysis> = z.object({
  name: garmentFields.name.catch(''),
  category: garmentFields.category.catch('top'),
  subcategory: garmentFields.subcategory.catch(undefined),
  colors: garmentFields.colors.catch([]),
  pattern: garmentFields.pattern.catch(undefined),
  seasons: garmentFields.seasons.catch([]),
  weather: garmentFields.weather.catch([]),
  occasions: garmentFields.occasions.catch([]),
  formality: garmentFields.formality.catch(undefined),
  warmth: garmentFields.warmth.catch(undefined),
  compositionGuess: garmentFields.compositionGuess.catch(undefined),
  // A salvaged answer is by definition uncertain; keep it below the low-confidence threshold.
  confidence: confidence.catch(SALVAGED_CONFIDENCE).transform(() => SALVAGED_CONFIDENCE),
  isGarment: garmentFields.isGarment.catch(undefined),
});

const price = z.object({ amount: z.number().nonnegative(), currency: z.string().min(1).max(5) });

export const productAnalysisSchema: z.ZodType<ProductAnalysis> = z.object({
  name: garmentFields.name.optional().catch(undefined),
  category: garmentFields.category.optional().catch(undefined),
  subcategory: garmentFields.subcategory.catch(undefined),
  colors: garmentFields.colors.optional().catch(undefined),
  pattern: garmentFields.pattern.catch(undefined),
  seasons: garmentFields.seasons.optional().catch(undefined),
  weather: garmentFields.weather.optional().catch(undefined),
  occasions: garmentFields.occasions.optional().catch(undefined),
  formality: garmentFields.formality.catch(undefined),
  warmth: garmentFields.warmth.catch(undefined),
  confidence: confidence.optional().catch(undefined),
  brand: optionalText.catch(undefined),
  productName: optionalText.catch(undefined),
  price: price.optional().nullable().transform((p) => p ?? undefined).catch(undefined),
  composition: composition.optional().nullable().transform((c) => c ?? undefined),
  compositionFound: z.boolean(),
  imageUrl: optionalText.catch(undefined),
});

const inspirationItem = z.object({
  category: z.enum(CATEGORIES),
  subcategory: optionalText,
  colors,
  pattern: garmentFields.pattern.catch(undefined),
  formality: garmentFields.formality.catch(undefined),
  description: z.string().default(''),
  likelyBrands: z.array(z.string()).optional().catch(undefined),
});

export const inspirationAnalysisSchema: z.ZodType<InspirationAnalysis> = z.object({
  hasOutfit: z.boolean(),
  items: z.array(inspirationItem),
  occasions: tolerantList(OCCASIONS),
  seasons: tolerantList(SEASONS),
});

/** Keeps the items that are individually valid when the full response is not. */
export const lenientInspirationAnalysisSchema: z.ZodType<InspirationAnalysis> = z.object({
  hasOutfit: z.boolean().catch(true),
  items: z
    .array(z.unknown())
    .transform((raw) =>
      raw.flatMap((item) => {
        const parsed = inspirationItem.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }),
    )
    .catch([]),
  occasions: tolerantList(OCCASIONS).catch([]),
  seasons: tolerantList(SEASONS).catch([]),
});

export const capsulePlanTextSchema: z.ZodType<CapsulePlanText> = z.object({ narrative: z.string().min(1) });
