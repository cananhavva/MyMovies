import { makeGarment } from '@/testing/fixtures';
import { EMPTY_FILTER, filterGarments, isFilterActive } from './wardrobeFilter';

const garments = [
  makeGarment({ id: 'a', name: 'Siyah trençkot', category: 'outerwear', seasons: ['autumn'], occasions: ['office'], weather: ['rainy'] }),
  makeGarment({ id: 'b', name: 'Beyaz tişört', category: 'top', seasons: ['summer'], brand: 'Basics' }),
  makeGarment({ id: 'c', name: 'Old coat', category: 'outerwear', archived: true }),
];

describe('filterGarments', () => {
  it('hides archived items by default', () => {
    expect(filterGarments(garments, EMPTY_FILTER).map((g) => g.id)).toEqual(['a', 'b']);
  });

  it('combines chip filters', () => {
    expect(filterGarments(garments, { ...EMPTY_FILTER, category: 'outerwear', weather: 'rainy' }).map((g) => g.id)).toEqual(['a']);
  });

  it('searches name and brand with Turkish casing', () => {
    expect(filterGarments(garments, { ...EMPTY_FILTER, query: 'TRENÇ' }).map((g) => g.id)).toEqual(['a']);
    expect(filterGarments(garments, { ...EMPTY_FILTER, query: 'basics' }).map((g) => g.id)).toEqual(['b']);
  });

  // Regression: an auto-capitalised English query ("Ivory") was lowercased Turkish-style to "ıvory".
  it('matches English words with a capital I and Turkish words typed without ı/İ', () => {
    const items = [
      makeGarment({ id: 'i', name: 'ivory cardigan', category: 'knitwear', brand: "Levi's" }),
      makeGarment({ id: 'k', name: 'Kırmızı kazak', category: 'knitwear' }),
    ];
    expect(filterGarments(items, { ...EMPTY_FILTER, query: 'Ivory' }).map((g) => g.id)).toEqual(['i']);
    expect(filterGarments(items, { ...EMPTY_FILTER, query: 'LEVI' }).map((g) => g.id)).toEqual(['i']);
    expect(filterGarments(items, { ...EMPTY_FILTER, query: 'kirmizi' }).map((g) => g.id)).toEqual(['k']);
    expect(filterGarments(items, { ...EMPTY_FILTER, query: 'KIRMIZI' }).map((g) => g.id)).toEqual(['k']);
  });

  it('treats a whitespace-only query as no query and shows archived items only when asked', () => {
    expect(filterGarments(garments, { ...EMPTY_FILTER, query: '   ' }).map((g) => g.id)).toEqual(['a', 'b']);
    expect(filterGarments(garments, { ...EMPTY_FILTER, showArchived: true }).map((g) => g.id)).toEqual(['c']);
    expect(isFilterActive({ ...EMPTY_FILTER, query: '   ' })).toBe(false);
  });

  it('reports whether any filter is active', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
    expect(isFilterActive({ ...EMPTY_FILTER, season: 'winter' })).toBe(true);
  });
});
