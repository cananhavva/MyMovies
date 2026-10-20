import { foldCase } from '@/domain/text';
import type { Category, Garment, Occasion, Season, Weather } from '@/domain/types';

export interface WardrobeFilter {
  query: string;
  category?: Category;
  season?: Season;
  occasion?: Occasion;
  weather?: Weather;
  showArchived: boolean;
}

export const EMPTY_FILTER: WardrobeFilter = { query: '', showArchived: false };

export function isFilterActive(filter: WardrobeFilter): boolean {
  return Boolean(filter.query.trim() || filter.category || filter.season || filter.occasion || filter.weather);
}

function matchesQuery(garment: Garment, query: string): boolean {
  const needle = foldCase(query.trim());
  if (needle === '') return true;
  return [garment.name, garment.brand, garment.subcategory, garment.notes]
    .filter((text): text is string => Boolean(text))
    .some((text) => foldCase(text).includes(needle));
}

export function filterGarments(garments: readonly Garment[], filter: WardrobeFilter): Garment[] {
  return garments.filter(
    (g) =>
      g.archived === filter.showArchived &&
      (!filter.category || g.category === filter.category) &&
      (!filter.season || g.seasons.includes(filter.season)) &&
      (!filter.occasion || g.occasions.includes(filter.occasion)) &&
      (!filter.weather || g.weather.includes(filter.weather)) &&
      matchesQuery(g, filter.query),
  );
}
