import { normalizeColors } from '@/domain/colors';
import { normalizeSubcategory } from '@/domain/subcategories';
import type {
  CompositionSource,
  FieldSource,
  Garment,
  GarmentAnalysis,
  ID,
  ProductAnalysis,
  QualityAssessment,
  TaggableField,
} from '@/domain/types';
import type { ParsedComposition } from '@/rules/compositionParser';
import { scoreMaterial } from '@/rules/materialScore';
import { applySeasonRules } from '@/rules/seasonRules';

type EditableGarmentFields = Omit<Garment, 'id' | 'createdAt' | 'updatedAt' | 'favorite' | 'archived' | 'quality'>;

/** Everything the review form edits; becomes a Garment on save. */
export interface GarmentDraft extends EditableGarmentFields {
  compositionSource: CompositionSource;
}

export function emptyDraft(imageUris: string[] = []): GarmentDraft {
  return {
    name: '',
    category: 'top',
    colors: [],
    seasons: [],
    weather: [],
    occasions: [],
    imageUris,
    fieldSources: {},
    compositionSource: 'none',
  };
}

function aiSources(fields: readonly TaggableField[]): Partial<Record<TaggableField, FieldSource>> {
  return Object.fromEntries(fields.map((field) => [field, 'ai' as const]));
}

export function draftFromGarmentAnalysis(analysis: GarmentAnalysis, imageUris: string[]): GarmentDraft {
  const hasGuess = (analysis.compositionGuess?.length ?? 0) > 0;
  return {
    ...emptyDraft(imageUris),
    name: analysis.name,
    category: analysis.category,
    subcategory: normalizeSubcategory(analysis.subcategory),
    colors: normalizeColors(analysis.colors),
    pattern: analysis.pattern,
    seasons: analysis.seasons,
    weather: analysis.weather,
    occasions: analysis.occasions,
    formality: analysis.formality,
    warmth: analysis.warmth,
    composition: hasGuess ? analysis.compositionGuess : undefined,
    compositionSource: hasGuess ? 'ai_guess' : 'none',
    aiConfidence: analysis.confidence,
    fieldSources: aiSources([
      'category',
      'colors',
      'seasons',
      'weather',
      'occasions',
      'formality',
      'warmth',
      ...(hasGuess ? (['composition'] as const) : []),
    ]),
  };
}

export function draftFromProductAnalysis(product: ProductAnalysis, url: string, imageUris: string[]): GarmentDraft {
  const base = emptyDraft(imageUris);
  const hasComposition = product.compositionFound && (product.composition?.length ?? 0) > 0;
  return {
    ...base,
    name: product.productName ?? product.name ?? '',
    category: product.category ?? base.category,
    subcategory: normalizeSubcategory(product.subcategory),
    colors: normalizeColors(product.colors ?? []),
    pattern: product.pattern,
    seasons: product.seasons ?? [],
    weather: product.weather ?? [],
    occasions: product.occasions ?? [],
    formality: product.formality,
    warmth: product.warmth,
    composition: hasComposition ? product.composition : undefined,
    compositionSource: hasComposition ? 'product_page' : 'none',
    brand: product.brand,
    price: product.price,
    productUrl: url,
    aiConfidence: product.confidence,
    fieldSources: aiSources(['category', 'colors', 'seasons', 'weather', 'occasions', 'formality', 'warmth']),
  };
}

const TAGGABLE_FIELDS: readonly string[] = [
  'seasons',
  'weather',
  'occasions',
  'category',
  'colors',
  'composition',
  'formality',
  'warmth',
] satisfies TaggableField[];

function isTaggableField(field: string): field is TaggableField {
  return TAGGABLE_FIELDS.includes(field);
}

/** Any field the user touches becomes 'user' and is protected from rules from then on. */
export function editDraft<K extends keyof GarmentDraft>(draft: GarmentDraft, field: K, value: GarmentDraft[K]): GarmentDraft {
  const fieldSources = isTaggableField(field) ? { ...draft.fieldSources, [field]: 'user' } : draft.fieldSources;
  return { ...draft, [field]: value, fieldSources };
}

export function withComposition(
  draft: GarmentDraft,
  parsed: Pick<ParsedComposition, 'shell' | 'lining'>,
  source: Exclude<CompositionSource, 'none' | 'ai_guess'>,
): GarmentDraft {
  return {
    ...draft,
    composition: parsed.shell,
    liningComposition: parsed.lining.length > 0 ? parsed.lining : undefined,
    compositionSource: source,
    fieldSources: { ...draft.fieldSources, composition: source === 'user' || source === 'label_photo' ? 'user' : 'ai' },
  };
}

export function assessQuality(draft: Pick<GarmentDraft, 'composition' | 'liningComposition' | 'category' | 'compositionSource'>): QualityAssessment {
  return scoreMaterial({
    composition: draft.composition,
    lining: draft.liningComposition,
    category: draft.category,
    compositionSource: draft.composition ? draft.compositionSource : 'none',
  });
}

/** Applies season/weather/occasion rules; user-edited fields stay untouched. */
export function applyRules(draft: GarmentDraft): GarmentDraft {
  const ruled = applySeasonRules({
    category: draft.category,
    subcategory: draft.subcategory,
    warmth: draft.warmth,
    composition: draft.composition,
    seasons: draft.seasons,
    weather: draft.weather,
    occasions: draft.occasions,
    fieldSources: draft.fieldSources,
  });
  return { ...draft, ...ruled };
}

export function draftToGarment(draft: GarmentDraft, params: { id: ID; now: Date; existing?: Garment }): Garment {
  const { compositionSource: _compositionSource, ...fields } = applyRules(draft);
  const nowIso = params.now.toISOString();
  return {
    ...fields,
    name: fields.name.trim(),
    quality: assessQuality(draft),
    id: params.id,
    favorite: params.existing?.favorite ?? false,
    archived: params.existing?.archived ?? false,
    createdAt: params.existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
}

export function garmentToDraft(garment: Garment): GarmentDraft {
  const { id: _id, createdAt: _c, updatedAt: _u, favorite: _f, archived: _a, quality, ...fields } = garment;
  return { ...fields, compositionSource: quality?.compositionSource ?? 'none' };
}
