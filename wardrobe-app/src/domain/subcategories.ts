import { foldCase } from './text';
import type { Category } from './types';

/** Suggested subcategories per category. The AI prompt and the review chips use the same list. */
export const SUBCATEGORIES: Readonly<Record<Category, readonly string[]>> = {
  top: ['t_shirt', 'shirt', 'blouse', 'tank_top', 'polo', 'sweatshirt', 'hoodie'],
  bottom: ['jeans', 'trousers', 'chinos', 'shorts', 'skirt', 'leggings'],
  dress: ['day_dress', 'evening_dress', 'maxi_dress', 'jumpsuit'],
  outerwear: ['blazer', 'trench_coat', 'raincoat', 'coat', 'puffer', 'parka', 'denim_jacket', 'leather_jacket', 'windbreaker'],
  knitwear: ['fine_knit', 'sweater', 'cardigan', 'vest'],
  shoes: ['sneakers', 'loafers', 'boots', 'ankle_boots', 'hiking_boots', 'heels', 'flats', 'sandals'],
  bag: ['tote', 'shoulder_bag', 'crossbody', 'backpack', 'clutch'],
  accessory: ['belt', 'scarf', 'hat', 'jewelry', 'sunglasses', 'watch'],
  activewear: ['sports_top', 'sports_leggings', 'track_jacket'],
  swimwear: ['swimsuit', 'bikini', 'swim_shorts'],
  underwear_sleep: ['pajamas', 'robe', 'underwear'],
};

const ALIASES_RAW: Readonly<Record<string, string>> = {
  tshirt: 't_shirt',
  tee: 't_shirt',
  tişört: 't_shirt',
  gömlek: 'shirt',
  bluz: 'blouse',
  jean: 'jeans',
  kot: 'jeans',
  kot_pantolon: 'jeans',
  pantolon: 'trousers',
  kumaş_pantolon: 'trousers',
  pants: 'trousers',
  etek: 'skirt',
  şort: 'shorts',
  trench: 'trench_coat',
  trençkot: 'trench_coat',
  yağmurluk: 'raincoat',
  kaban: 'coat',
  wool_coat: 'coat',
  mont: 'puffer',
  ceket: 'blazer',
  kazak: 'sweater',
  jumper: 'sweater',
  hırka: 'cardigan',
  triko: 'fine_knit',
  sneaker: 'sneakers',
  spor_ayakkabı: 'sneakers',
  trainers: 'sneakers',
  loafer: 'loafers',
  makosen: 'loafers',
  bot: 'boots',
  çizme: 'boots',
  hiking_boot: 'hiking_boots',
  yürüyüş_botu: 'hiking_boots',
  hiking_shoes: 'hiking_boots',
};

/** Keys are case-folded once so lookups ignore case, including "I"/"ı" (see foldCase). */
const ALIASES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(ALIASES_RAW).map(([alias, canonical]) => [foldCase(alias), canonical]),
);

/** Groups whose members are interchangeable for "similar item" matching. */
const FAMILIES: readonly (readonly string[])[] = [
  ['t_shirt', 'tank_top', 'polo'],
  ['shirt', 'blouse'],
  ['sweatshirt', 'hoodie'],
  ['trousers', 'chinos'],
  ['jeans'],
  ['skirt', 'shorts'],
  ['day_dress', 'evening_dress', 'maxi_dress'],
  ['trench_coat', 'raincoat', 'windbreaker'],
  ['coat', 'puffer', 'parka'],
  ['blazer'],
  ['denim_jacket', 'leather_jacket'],
  ['fine_knit', 'sweater', 'cardigan', 'vest'],
  ['sneakers'],
  ['loafers', 'flats'],
  ['boots', 'ankle_boots', 'hiking_boots'],
  ['tote', 'shoulder_bag', 'crossbody', 'clutch'],
];

export function normalizeSubcategory(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const key = foldCase(raw.trim()).replace(/[\s-]+/g, '_');
  if (key === '') return undefined;
  return ALIASES[key] ?? key;
}

export function subcategoryFamily(subcategory: string | undefined): readonly string[] | undefined {
  const normalized = normalizeSubcategory(subcategory);
  if (!normalized) return undefined;
  return FAMILIES.find((family) => family.includes(normalized));
}

export function isSameSubcategoryFamily(a: string | undefined, b: string | undefined): boolean {
  const family = subcategoryFamily(a);
  const other = normalizeSubcategory(b);
  return family !== undefined && other !== undefined && family.includes(other);
}
