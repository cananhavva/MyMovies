import { makeGarment, makeItem } from '@/testing/fixtures';
import { matchItem, matchLevel, matchLookItems, recreatability, similarity } from './matching';

describe('similarity', () => {
  it('is 0 across categories', () => {
    expect(similarity({ category: 'top', colors: ['black'] }, { category: 'bottom', colors: ['black'] })).toBe(0);
  });

  it('scores an identical item as 1', () => {
    const item = { category: 'outerwear' as const, subcategory: 'trench_coat', colors: ['beige'], pattern: 'solid' as const, formality: 3 as const };
    expect(similarity(item, item)).toBe(1);
  });

  it('adds subcategory, colour, pattern and formality points', () => {
    const score = similarity(
      { category: 'top', subcategory: 'shirt', colors: ['white'], pattern: 'solid', formality: 3 },
      { category: 'top', subcategory: 'blouse', colors: ['ivory'], pattern: 'solid', formality: 4 },
    );
    // family 0.25 + colour family 0.2 + pattern 0.1 + formality 0.1
    expect(score).toBeCloseTo(0.65, 2);
  });

  it('gives a small bonus when both colours are neutral', () => {
    expect(similarity({ category: 'bottom', colors: ['black'] }, { category: 'bottom', colors: ['beige'] })).toBeCloseTo(0.1, 2);
  });

  it('understands Turkish colour names', () => {
    expect(similarity({ category: 'bottom', colors: ['lacivert'] }, { category: 'bottom', colors: ['navy'] })).toBeCloseTo(0.35, 2);
  });
});

describe('matchLevel', () => {
  it.each([
    [0.7, 'owned'],
    [0.69, 'similar'],
    [0.45, 'similar'],
    [0.44, 'missing'],
  ])('%p → %p', (score, level) => {
    expect(matchLevel(score)).toBe(level);
  });
});

describe('matchItem', () => {
  const garments = [
    makeGarment({ id: 'g1', category: 'outerwear', subcategory: 'trench_coat', colors: ['black'] }),
    makeGarment({ id: 'g2', category: 'outerwear', subcategory: 'raincoat', colors: ['black'] }),
    makeGarment({ id: 'g3', category: 'outerwear', subcategory: 'trench_coat', colors: ['black'], archived: true }),
  ];

  it('ranks matches and skips archived garments', () => {
    const result = matchItem({ category: 'outerwear', subcategory: 'trench_coat', colors: ['black'] }, garments);
    expect(result.matchedGarmentIds).toEqual(['g1', 'g2']);
    expect(result.matchScore).toBeCloseTo(0.8, 2);
  });

  it('returns no match when nothing is similar enough', () => {
    expect(matchItem({ category: 'shoes', colors: ['red'] }, garments)).toEqual({ matchedGarmentIds: [], matchScore: 0 });
  });
});

describe('recreatability', () => {
  it('counts owned as 1, similar as 0.5 and weights bags at 0.5', () => {
    const value = recreatability([
      { category: 'top', matchScore: 0.9 },
      { category: 'bottom', matchScore: 0.5 },
      { category: 'bag', matchScore: 0 },
    ]);
    // (1 + 0.5 + 0) / (1 + 1 + 0.5)
    expect(value).toBeCloseTo(0.6, 2);
  });

  it('is 0 for an empty look', () => {
    expect(recreatability([])).toBe(0);
  });
});

describe('matchLookItems', () => {
  it('fills matches and recreatability for every item', () => {
    const garments = [makeGarment({ id: 'jeans', category: 'bottom', subcategory: 'jeans', colors: ['blue'] })];
    const result = matchLookItems(
      [
        makeItem({ id: 'i1', category: 'bottom', subcategory: 'jeans', colors: ['navy'] }),
        makeItem({ id: 'i2', category: 'shoes', subcategory: 'sneakers', colors: ['white'] }),
      ],
      garments,
    );
    expect(result.items[0]?.matchedGarmentIds).toEqual(['jeans']);
    expect(result.items[1]?.matchedGarmentIds).toEqual([]);
    // navy vs blue jeans is "similar" (0.65) → 0.5 of 2 items
    expect(result.recreatability).toBeCloseTo(0.25, 2);
  });
});

describe('similarity – colour families and thresholds (PLAN 3.3)', () => {
  const top = (colors: string[], extra: Partial<Parameters<typeof similarity>[0]> = {}) => ({ category: 'top' as const, colors, ...extra });

  it.each`
    a             | b             | score
    ${'black'}    | ${'charcoal'} | ${0.2}
    ${'beige'}    | ${'camel'}    | ${0.2}
    ${'camel'}    | ${'sand'}     | ${0.2}
    ${'navy'}     | ${'blue'}     | ${0.2}
    ${'navy'}     | ${'black'}    | ${0.1}
    ${'red'}      | ${'burgundy'} | ${0.2}
    ${'red'}      | ${'green'}    | ${0}
    ${'red'}      | ${'black'}    | ${0}
    ${'Siyah'}    | ${'BLACK'}    | ${0.35}
    ${'antrasit'} | ${'siyah'}    | ${0.2}
    ${'mauve'}    | ${'mauve'}    | ${0}
  `('$a vs $b → $score', ({ a, b, score }) => {
    expect(similarity(top([a]), top([b]))).toBeCloseTo(score, 2);
  });

  // Regression: Turkish lowercasing turned the English "I" into "ı", so "IVORY"/"Ivory" were unknown colours.
  it.each([
    ['IVORY', 'ivory'],
    ['Ivory', 'cream'],
    ['WHITE', 'beyaz'],
    ['KIRMIZI', 'red'],
    ['kirmizi', 'Kırmızı'],
  ])('treats %s and %s as the same colour regardless of case', (a, b) => {
    expect(similarity(top([a]), top([b]))).toBeCloseTo(0.35, 2);
  });

  it('uses the best colour pair across multi-colour items', () => {
    expect(similarity(top(['red', 'white']), top(['green', 'white']))).toBeCloseTo(0.35, 2);
  });

  it('gives no colour points when either side has no colours', () => {
    expect(similarity(top([]), top(['black']))).toBe(0);
  });

  it('only rewards formality within 1 step and only when both are known', () => {
    expect(similarity(top([], { formality: 2 }), top([], { formality: 3 }))).toBeCloseTo(0.1, 2);
    expect(similarity(top([], { formality: 2 }), top([], { formality: 4 }))).toBe(0);
    expect(similarity(top([], { formality: 2 }), top([]))).toBe(0);
  });

  it('only rewards a pattern when both items have the same one', () => {
    expect(similarity(top([], { pattern: 'striped' }), top([], { pattern: 'striped' }))).toBeCloseTo(0.1, 2);
    expect(similarity(top([]), top([]))).toBe(0);
  });

  it('normalises subcategory aliases and case', () => {
    expect(similarity(top([], { subcategory: 'T-Shirt' }), top([], { subcategory: 'tee' }))).toBeCloseTo(0.45, 2);
    expect(similarity({ category: 'bottom', colors: [], subcategory: 'SKIRT' }, { category: 'bottom', colors: [], subcategory: 'skirt' })).toBeCloseTo(
      0.45,
      2,
    );
  });

  it('caps at 1', () => {
    const full = top(['black'], { subcategory: 'shirt', pattern: 'solid', formality: 3 });
    expect(similarity(full, full)).toBe(1);
  });

  it.each`
    score   | level
    ${1}    | ${'owned'}
    ${0.7}  | ${'owned'}
    ${0.69} | ${'similar'}
    ${0.45} | ${'similar'}
    ${0.44} | ${'missing'}
    ${0}    | ${'missing'}
  `('matchLevel($score) = $level', ({ score, level }) => {
    expect(matchLevel(score)).toBe(level);
  });

  it('reaches "owned" with same subcategory + same colour (0.45 + 0.35 = 0.8)', () => {
    expect(matchLevel(similarity(top(['navy'], { subcategory: 'polo' }), top(['navy'], { subcategory: 'polo' })))).toBe('owned');
  });

  it('is only "similar" with same family + colour family + pattern (0.25 + 0.2 + 0.1 = 0.55)', () => {
    const score = similarity(top(['navy'], { subcategory: 'polo', pattern: 'solid' }), top(['blue'], { subcategory: 't_shirt', pattern: 'solid' }));
    expect(score).toBeCloseTo(0.55, 2);
    expect(matchLevel(score)).toBe('similar');
  });
});

describe('matchItem / recreatability – edge cases', () => {
  it('returns at most 3 matches, best first', () => {
    const garments = ['a', 'b', 'c', 'd'].map((id) => makeGarment({ id, category: 'top', subcategory: 'shirt', colors: ['white'] }));
    const result = matchItem({ category: 'top', subcategory: 'shirt', colors: ['white'] }, garments);
    expect(result.matchedGarmentIds).toHaveLength(3);
    expect(result.matchScore).toBeCloseTo(0.8, 2);
  });

  it('returns no matches for an empty wardrobe', () => {
    expect(matchItem({ category: 'top', colors: ['white'] }, [])).toEqual({ matchedGarmentIds: [], matchScore: 0 });
  });

  it('computes (#owned + 0.5·#similar) / #pieces with bags and accessories weighted 0.5', () => {
    const value = recreatability([
      { category: 'top', matchScore: 0.9 }, // owned 1
      { category: 'bottom', matchScore: 0.5 }, // similar 0.5
      { category: 'shoes', matchScore: 0.1 }, // missing 0
      { category: 'bag', matchScore: 0.9 }, // owned, weight 0.5
      { category: 'accessory', matchScore: 0.5 }, // similar, weight 0.5 → 0.25
    ]);
    // (1 + 0.5 + 0 + 0.5 + 0.25) / (1 + 1 + 1 + 0.5 + 0.5) = 2.25 / 4
    expect(value).toBeCloseTo(0.56, 2);
  });

  it('is 1 for a fully owned look and 0 for a fully missing one', () => {
    expect(recreatability([{ category: 'dress', matchScore: 0.7 }])).toBe(1);
    expect(recreatability([{ category: 'dress', matchScore: 0.44 }])).toBe(0);
  });
});
