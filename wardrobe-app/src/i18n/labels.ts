import type { TFunction } from 'i18next';
import { normalizeColor } from '@/domain/colors';
import type { GapSuggestion } from '@/domain/types';

/** Falls back to a readable version of the raw key (e.g. AI-provided subcategories we don't list). */
function translateOr(t: TFunction, key: string, raw: string): string {
  const translated = t(key, { defaultValue: '' });
  return translated || raw.replace(/_/g, ' ');
}

export function subcategoryLabel(t: TFunction, subcategory: string): string {
  return translateOr(t, `enums.subcategory.${subcategory}`, subcategory);
}

export function colorLabel(t: TFunction, color: string): string {
  return translateOr(t, `enums.color.${normalizeColor(color) ?? color}`, color);
}

/** Turns a QualityAssessment reason code ("fiber:wool:80", "natural_bonus") into a sentence. */
export function qualityReasonLabel(t: TFunction, reason: string): string {
  const [code, fiber, percent] = reason.split(':');
  if (code === 'fiber' && fiber && percent) {
    return t('quality.reason.fiber', { percent, fiber: t(`enums.fiber.${fiber}`) });
  }
  return translateOr(t, `quality.reason.${code}`, reason);
}

export function gapTitle(t: TFunction, suggestion: GapSuggestion): string {
  const piece = suggestion.subcategory
    ? subcategoryLabel(t, suggestion.subcategory)
    : t(`enums.category.${suggestion.category}`);
  return suggestion.color ? `${colorLabel(t, suggestion.color)} ${piece.toLocaleLowerCase()}` : piece;
}

export function gapReasonLabel(t: TFunction, suggestion: GapSuggestion): string {
  const { evidence } = suggestion;
  return t(`insights.reason.${suggestion.reason}`, {
    frequency: evidence.frequency,
    influencers: evidence.distinctInfluencers ?? 1,
    unlocks: suggestion.unlocksLookCount,
    occasion: evidence.occasion ? t(`enums.occasion.${evidence.occasion}`) : '',
    season: evidence.season ? t(`enums.season.${evidence.season}`) : '',
  });
}
