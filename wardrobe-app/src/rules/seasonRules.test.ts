import { applySeasonRules, type RuleInput } from './seasonRules';

function input(overrides: Partial<RuleInput> & Pick<RuleInput, 'category'>): RuleInput {
  return { seasons: [], weather: [], occasions: [], fieldSources: {}, ...overrides };
}

describe('applySeasonRules', () => {
  it('derives seasons and weather from high warmth', () => {
    const result = applySeasonRules(input({ category: 'outerwear', warmth: 5 }));
    expect(result.seasons).toEqual(['autumn', 'winter']);
    expect(result.weather).toEqual(['cool', 'cold']);
    expect(result.fieldSources.seasons).toBe('rule');
  });

  it('derives seasons and weather from low warmth', () => {
    const result = applySeasonRules(input({ category: 'top', warmth: 1 }));
    expect(result.seasons).toEqual(['spring', 'summer']);
    expect(result.weather).toEqual(['hot', 'warm', 'mild']);
  });

  it('derives transitional tags from medium warmth', () => {
    const result = applySeasonRules(input({ category: 'top', warmth: 3 }));
    expect(result.seasons).toEqual(['spring', 'autumn']);
    expect(result.weather).toEqual(['mild', 'cool']);
  });

  it('adds summer for mostly linen garments', () => {
    const result = applySeasonRules(
      input({ category: 'top', seasons: ['spring'], fieldSources: { seasons: 'ai' }, composition: [{ fiber: 'linen', percent: 60 }] }),
    );
    expect(result.seasons).toEqual(['spring', 'summer']);
  });

  it('adds winter and removes summer for mostly wool garments', () => {
    const result = applySeasonRules(
      input({ category: 'knitwear', seasons: ['summer', 'autumn'], composition: [{ fiber: 'wool', percent: 80 }] }),
    );
    expect(result.seasons).toEqual(['autumn', 'winter']);
  });

  it('applies the trench coat subcategory table', () => {
    const result = applySeasonRules(input({ category: 'outerwear', subcategory: 'Trench Coat' }));
    expect(result.seasons).toEqual(['spring', 'autumn']);
    expect(result.weather).toEqual(expect.arrayContaining(['mild', 'cool', 'rainy', 'windy']));
    expect(result.occasions).toEqual(['office', 'casual']);
  });

  it('tags swimwear for the beach in summer', () => {
    const result = applySeasonRules(input({ category: 'swimwear' }));
    expect(result.occasions).toContain('beach');
    expect(result.seasons).toContain('summer');
    expect(result.weather).toContain('hot');
  });

  it('tags activewear for sport and hiking boots for walking', () => {
    expect(applySeasonRules(input({ category: 'activewear' })).occasions).toContain('sport');
    expect(applySeasonRules(input({ category: 'shoes', subcategory: 'hiking_boots' })).occasions).toContain('hiking_walking');
  });

  it('never changes fields the user edited', () => {
    const result = applySeasonRules(
      input({
        category: 'knitwear',
        warmth: 5,
        seasons: ['summer'],
        fieldSources: { seasons: 'user' },
        composition: [{ fiber: 'wool', percent: 100 }],
      }),
    );
    expect(result.seasons).toEqual(['summer']);
    expect(result.fieldSources.seasons).toBe('user');
  });

  it('keeps the AI source when rules change nothing', () => {
    const result = applySeasonRules(input({ category: 'top', occasions: ['casual'], fieldSources: { occasions: 'ai' } }));
    expect(result.fieldSources.occasions).toBe('ai');
  });
});

describe('applySeasonRules – user fields are never overridden', () => {
  const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
  const WEATHER = ['hot', 'warm', 'mild', 'cool', 'cold', 'rainy', 'windy', 'snowy'] as const;
  const OCCASIONS = ['casual', 'office', 'sport', 'beach', 'hiking_walking', 'travel'] as const;
  const CATEGORIES = ['top', 'outerwear', 'swimwear', 'activewear', 'shoes', 'knitwear'] as const;
  const SUBCATEGORIES = [undefined, 'trench_coat', 'Trençkot', 'raincoat', 'blazer', 'sneakers', 'hiking_boots'];
  const FIBERS = ['linen', 'wool', 'cashmere', 'alpaca', 'cotton', 'polyester'] as const;

  /** Small deterministic PRNG so the sweep is reproducible. */
  function rng(seed: number) {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };
  }
  const pick = <T,>(random: () => number, list: readonly T[]): T => list[Math.floor(random() * list.length)] as T;
  const subset = <T,>(random: () => number, list: readonly T[]): T[] => list.filter(() => random() < 0.3);

  it('keeps every user-sourced field byte-for-byte across 500 random garments', () => {
    const random = rng(42);
    for (let i = 0; i < 500; i += 1) {
      const fields = ['seasons', 'weather', 'occasions'] as const;
      const fieldSources = Object.fromEntries(fields.filter(() => random() < 0.5).map((f) => [f, 'user' as const]));
      const given = input({
        category: pick(random, CATEGORIES),
        subcategory: pick(random, SUBCATEGORIES),
        warmth: pick(random, [undefined, 1, 2, 3, 4, 5] as const),
        composition: [{ fiber: pick(random, FIBERS), percent: Math.round(random() * 100) }],
        seasons: subset(random, SEASONS),
        weather: subset(random, WEATHER),
        occasions: subset(random, OCCASIONS),
        fieldSources,
      });
      const result = applySeasonRules(given);
      for (const field of fields) {
        if (fieldSources[field] === 'user') {
          expect(result[field]).toEqual(given[field]);
          expect(result.fieldSources[field]).toBe('user');
        }
      }
    }
  });

  it('keeps an intentionally empty user selection empty', () => {
    const result = applySeasonRules(
      input({
        category: 'swimwear',
        warmth: 1,
        fieldSources: { seasons: 'user', weather: 'user', occasions: 'user' },
      }),
    );
    expect(result).toMatchObject({ seasons: [], weather: [], occasions: [] });
  });

  it('does not mutate its input', () => {
    const given = input({ category: 'outerwear', subcategory: 'trench_coat', seasons: ['winter'], fieldSources: { seasons: 'ai' } });
    const snapshot = JSON.parse(JSON.stringify(given));
    applySeasonRules(given);
    expect(given).toEqual(snapshot);
  });
});

describe('applySeasonRules – rule details', () => {
  it('keeps existing AI tags and only adds/removes from them (warmth defaults fill empty fields only)', () => {
    const result = applySeasonRules(input({ category: 'top', warmth: 5, seasons: ['spring'], fieldSources: { seasons: 'ai' } }));
    expect(result.seasons).toEqual(['spring']);
    expect(result.fieldSources.seasons).toBe('ai');
  });

  it.each([49, 50])('wool at %i %% → winter only from 50 %%', (percent) => {
    const result = applySeasonRules(
      input({ category: 'knitwear', seasons: ['summer', 'autumn'], fieldSources: { seasons: 'ai' }, composition: [{ fiber: 'wool', percent }] }),
    );
    if (percent >= 50) {
      expect(result.seasons).toEqual(['autumn', 'winter']);
      expect(result.fieldSources.seasons).toBe('rule');
    } else {
      expect(result.seasons).toEqual(['summer', 'autumn']);
    }
  });

  it('sums wool-family fibres (cashmere + alpaca) for the 50 % threshold', () => {
    const result = applySeasonRules(
      input({
        category: 'knitwear',
        composition: [
          { fiber: 'cashmere', percent: 30 },
          { fiber: 'alpaca', percent: 20 },
          { fiber: 'polyamide', percent: 50 },
        ],
      }),
    );
    expect(result.seasons).toContain('winter');
  });

  it('lets warm wool win over linen in a 50/50 blend (summer removed)', () => {
    const result = applySeasonRules(
      input({
        category: 'top',
        composition: [
          { fiber: 'linen', percent: 50 },
          { fiber: 'wool', percent: 50 },
        ],
      }),
    );
    expect(result.seasons).toEqual(['winter']);
  });

  it.each(['trench_coat', 'Trençkot', 'TRENCH', 'raincoat'])('tags %s for rainy and windy weather', (subcategory) => {
    const result = applySeasonRules(input({ category: 'outerwear', subcategory }));
    expect(result.weather).toEqual(expect.arrayContaining(['rainy', 'windy']));
  });

  it('tags blazers for the office and sneakers for casual/travel', () => {
    expect(applySeasonRules(input({ category: 'outerwear', subcategory: 'blazer' })).occasions).toEqual(['office']);
    expect(applySeasonRules(input({ category: 'shoes', subcategory: 'Sneaker' })).occasions).toEqual(['casual', 'travel']);
  });

  it('does not duplicate tags already present', () => {
    const result = applySeasonRules(
      input({ category: 'swimwear', seasons: ['summer'], weather: ['hot'], occasions: ['beach'], fieldSources: { seasons: 'ai' } }),
    );
    expect(result.seasons).toEqual(['summer']);
    expect(result.weather).toEqual(['hot']);
    expect(result.occasions).toEqual(['beach']);
  });
});
