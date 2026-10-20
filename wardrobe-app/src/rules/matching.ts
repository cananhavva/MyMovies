import { colorFamily, isNeutral, normalizeColor } from '@/domain/colors';
import { isSameSubcategoryFamily, normalizeSubcategory } from '@/domain/subcategories';
import type { Category, Formality, Garment, ID, InspirationItem, Pattern } from '@/domain/types';

export type MatchLevel = 'owned' | 'similar' | 'missing';

export interface MatchableItem {
  category: Category;
  subcategory?: string;
  colors: readonly string[];
  pattern?: Pattern;
  formality?: Formality;
}

const SCORE = {
  sameSubcategory: 0.45,
  sameSubcategoryFamily: 0.25,
  sameColor: 0.35,
  sameColorFamily: 0.2,
  bothNeutral: 0.1,
  samePattern: 0.1,
  closeFormality: 0.1,
} as const;

export const OWNED_THRESHOLD = 0.7;
export const SIMILAR_THRESHOLD = 0.45;
const MAX_MATCHES_PER_ITEM = 3;
const MAX_FORMALITY_GAP = 1;

/** Bags and accessories complete a look but matter less than clothing. */
const LIGHT_WEIGHT_CATEGORIES: ReadonlySet<Category> = new Set<Category>(['bag', 'accessory']);
const LIGHT_WEIGHT = 0.5;

const LEVEL_VALUE: Readonly<Record<MatchLevel, number>> = { owned: 1, similar: 0.5, missing: 0 };

function subcategoryScore(a: string | undefined, b: string | undefined): number {
  const left = normalizeSubcategory(a);
  const right = normalizeSubcategory(b);
  if (!left || !right) return 0;
  if (left === right) return SCORE.sameSubcategory;
  return isSameSubcategoryFamily(left, right) ? SCORE.sameSubcategoryFamily : 0;
}

function colorScore(a: readonly string[], b: readonly string[]): number {
  const pairs = a.flatMap((left) => b.map((right) => [left, right] as const));
  if (pairs.some(([l, r]) => normalizeColor(l) !== undefined && normalizeColor(l) === normalizeColor(r))) {
    return SCORE.sameColor;
  }
  if (pairs.some(([l, r]) => colorFamily(l) !== undefined && colorFamily(l) === colorFamily(r))) {
    return SCORE.sameColorFamily;
  }
  return a.some(isNeutral) && b.some(isNeutral) ? SCORE.bothNeutral : 0;
}

export function similarity(item: MatchableItem, garment: MatchableItem): number {
  if (item.category !== garment.category) return 0;
  let score = subcategoryScore(item.subcategory, garment.subcategory) + colorScore(item.colors, garment.colors);
  if (item.pattern && item.pattern === garment.pattern) score += SCORE.samePattern;
  if (
    item.formality !== undefined &&
    garment.formality !== undefined &&
    Math.abs(item.formality - garment.formality) <= MAX_FORMALITY_GAP
  ) {
    score += SCORE.closeFormality;
  }
  return Math.min(1, Math.round(score * 100) / 100);
}

export function matchLevel(score: number): MatchLevel {
  if (score >= OWNED_THRESHOLD) return 'owned';
  if (score >= SIMILAR_THRESHOLD) return 'similar';
  return 'missing';
}

export interface ItemMatch {
  matchedGarmentIds: ID[];
  matchScore: number;
}

export function matchItem(item: MatchableItem, garments: readonly Garment[]): ItemMatch {
  const ranked = garments
    .filter((garment) => !garment.archived)
    .map((garment) => ({ id: garment.id, score: similarity(item, garment) }))
    .filter(({ score }) => score >= SIMILAR_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES_PER_ITEM);
  return { matchedGarmentIds: ranked.map(({ id }) => id), matchScore: ranked[0]?.score ?? 0 };
}

interface ScoredItem {
  category: Category;
  matchScore: number;
}

export function recreatability(items: readonly ScoredItem[]): number {
  const weightOf = (item: ScoredItem): number => (LIGHT_WEIGHT_CATEGORIES.has(item.category) ? LIGHT_WEIGHT : 1);
  const totalWeight = items.reduce((sum, item) => sum + weightOf(item), 0);
  if (totalWeight === 0) return 0;
  const achieved = items.reduce((sum, item) => sum + weightOf(item) * LEVEL_VALUE[matchLevel(item.matchScore)], 0);
  return Math.round((achieved / totalWeight) * 100) / 100;
}

export function matchLookItems(
  items: readonly InspirationItem[],
  garments: readonly Garment[],
): { items: InspirationItem[]; recreatability: number } {
  const matched = items.map((item) => ({ ...item, ...matchItem(item, garments) }));
  return { items: matched, recreatability: recreatability(matched) };
}
