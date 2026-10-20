import { colorFamily, isNeutral, type ColorFamily } from '@/domain/colors';
import { isSameSubcategoryFamily, normalizeSubcategory } from '@/domain/subcategories';
import type { Category, Garment } from '@/domain/types';
import { CATEGORIES, includesValue } from '@/domain/taxonomy';

/** Wildcards used in gap keys when the subcategory or colour does not matter. */
export const ANY = 'any';
export const NEUTRAL = 'neutral';

export type ColorConstraint = ColorFamily | typeof ANY | typeof NEUTRAL;

export interface GapKeyParts {
  category: Category;
  subcategory?: string;
  color: ColorConstraint;
}

/** Key format from the plan: `category:subcategory:colorFamily`. */
export function formatGapKey(parts: GapKeyParts): string {
  return `${parts.category}:${normalizeSubcategory(parts.subcategory) ?? ANY}:${parts.color}`;
}

export function parseGapKey(key: string): GapKeyParts | undefined {
  const [category, subcategory, color] = key.split(':');
  if (!includesValue(CATEGORIES, category) || !subcategory || !color) return undefined;
  return {
    category,
    subcategory: subcategory === ANY ? undefined : subcategory,
    color: color as ColorConstraint,
  };
}

export function colorConstraintOf(colors: readonly string[]): ColorConstraint {
  const first = colors[0];
  return (first && colorFamily(first)) || ANY;
}

function colorSatisfies(colors: readonly string[], constraint: ColorConstraint): boolean {
  if (constraint === ANY) return true;
  if (constraint === NEUTRAL) return colors.some(isNeutral);
  return colors.some((color) => colorFamily(color) === constraint);
}

function subcategorySatisfies(garmentSubcategory: string | undefined, wanted: string | undefined): boolean {
  if (!wanted) return true;
  const normalized = normalizeSubcategory(garmentSubcategory);
  return normalized === normalizeSubcategory(wanted) || isSameSubcategoryFamily(wanted, normalized);
}

export function garmentSatisfies(garment: Garment, parts: GapKeyParts): boolean {
  return (
    !garment.archived &&
    garment.category === parts.category &&
    subcategorySatisfies(garment.subcategory, parts.subcategory) &&
    colorSatisfies(garment.colors, parts.color)
  );
}
