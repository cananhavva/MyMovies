import type { Category, FiberType, Formality, Occasion, Pattern, Season, Warmth, Weather } from './types';

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const satisfies readonly Season[];

export const WEATHERS = ['hot', 'warm', 'mild', 'cool', 'cold', 'rainy', 'windy', 'snowy'] as const satisfies readonly Weather[];

export const OCCASIONS = [
  'casual',
  'office',
  'business_formal',
  'night_out',
  'date',
  'party',
  'wedding_guest',
  'sport',
  'hiking_walking',
  'travel',
  'beach',
  'home_lounge',
] as const satisfies readonly Occasion[];

export const CATEGORIES = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'knitwear',
  'shoes',
  'bag',
  'accessory',
  'activewear',
  'swimwear',
  'underwear_sleep',
] as const satisfies readonly Category[];

export const PATTERNS = ['solid', 'striped', 'checked', 'floral', 'print', 'other'] as const satisfies readonly Pattern[];

export const FORMALITY_LEVELS = [1, 2, 3, 4, 5] as const satisfies readonly Formality[];

export const WARMTH_LEVELS = [1, 2, 3, 4, 5] as const satisfies readonly Warmth[];

export const FIBER_TYPES = [
  'cashmere',
  'silk',
  'wool',
  'merino',
  'alpaca',
  'mohair',
  'linen',
  'cotton',
  'organic_cotton',
  'leather',
  'suede',
  'down',
  'lyocell',
  'modal',
  'viscose',
  'cupro',
  'nylon',
  'polyamide',
  'polyester',
  'recycled_polyester',
  'acrylic',
  'elastane',
  'pu_faux_leather',
  'other',
] as const satisfies readonly FiberType[];

export const OCCASION_FORMALITY: Readonly<Record<Occasion, { min: Formality; max: Formality }>> = {
  casual: { min: 1, max: 2 },
  office: { min: 3, max: 3 },
  business_formal: { min: 4, max: 5 },
  night_out: { min: 2, max: 4 },
  date: { min: 2, max: 4 },
  party: { min: 3, max: 4 },
  wedding_guest: { min: 4, max: 5 },
  sport: { min: 1, max: 1 },
  hiking_walking: { min: 1, max: 1 },
  travel: { min: 1, max: 2 },
  beach: { min: 1, max: 1 },
  home_lounge: { min: 1, max: 1 },
};

const NEXT_SEASON: Readonly<Record<Season, Season>> = {
  spring: 'summer',
  summer: 'autumn',
  autumn: 'winter',
  winter: 'spring',
};

export function nextSeason(season: Season): Season {
  return NEXT_SEASON[season];
}

/** Northern-hemisphere meteorological seasons (primary market is Türkiye). */
export function seasonForDate(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}


export function includesValue<T extends string | number>(values: readonly T[], candidate: unknown): candidate is T {
  return (values as readonly unknown[]).includes(candidate);
}
