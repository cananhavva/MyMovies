import type { Category, FiberPart } from '@/domain/types';
import { parseComposition } from './compositionParser';
import { scoreMaterial, tierForScore } from './materialScore';

function scoreText(text: string, category?: Category) {
  const parsed = parseComposition(text);
  return scoreMaterial({ composition: parsed.shell, lining: parsed.lining, category, compositionSource: 'label_photo' });
}

describe('scoreMaterial – approved plan examples (PLAN 3.2)', () => {
  it.each`
    text                              | category       | score    | tier
    ${'%100 pamuk'}                   | ${'top'}       | ${75}    | ${'good'}
    ${'%100 yün'}                     | ${'knitwear'}  | ${90}    | ${'premium'}
    ${'%80 yün %20 polyamid'}         | ${'knitwear'}  | ${77}    | ${'good'}
    ${'%65 polyester %35 pamuk'}      | ${'top'}       | ${40.75} | ${'low'}
    ${'%95 pamuk %5 elastan'}         | ${'bottom'}    | ${75}    | ${'good'}
    ${'%100 polyester'}               | ${'outerwear'} | ${45}    | ${'average'}
    ${'%100 akrilik'}                 | ${'knitwear'}  | ${17}    | ${'low'}
  `('$text ($category) → $score $tier', ({ text, category, score, tier }) => {
    const result = scoreText(text, category);
    expect(result.score).toBeCloseTo(score, 2);
    expect(result.tier).toBe(tier);
    expect(result.source).toBe('rule');
  });
});

describe('scoreMaterial – rules', () => {
  it('returns unknown when there is no composition', () => {
    const result = scoreMaterial({ compositionSource: 'none' });
    expect(result.tier).toBe('unknown');
    expect(result.reasons).toEqual(['no_composition']);
  });

  it('returns unknown when less than half of the composition is known', () => {
    const result = scoreMaterial({ composition: [{ fiber: 'cotton', percent: 40 }], compositionSource: 'user' });
    expect(result.tier).toBe('unknown');
  });

  it('scores elastane above 5 % as 30 points for the excess only', () => {
    const result = scoreMaterial({
      composition: [
        { fiber: 'cotton', percent: 90 },
        { fiber: 'elastane', percent: 10 },
      ],
      compositionSource: 'user',
    });
    // (90×75 + 5×30) / 95
    expect(result.score).toBeCloseTo(72.63, 2);
  });

  it('normalises totals outside 95–105 % and says so', () => {
    const result = scoreMaterial({
      composition: [
        { fiber: 'wool', percent: 60 },
        { fiber: 'polyamide', percent: 20 },
      ],
      compositionSource: 'user',
    });
    expect(result.reasons).toContain('composition_normalized');
  });

  it('adds +3 for a silk or cupro lining', () => {
    const shellOnly = scoreText('Shell: 100% polyester');
    const withLining = scoreText('Shell: 100% polyester Lining: 100% cupro');
    expect(withLining.score - shellOnly.score).toBeCloseTo(3, 2);
    expect(withLining.reasons).toContain('premium_lining');
  });

  it('marks AI-guessed compositions as estimates', () => {
    const result = scoreMaterial({ composition: [{ fiber: 'cotton', percent: 100 }], compositionSource: 'ai_guess' });
    expect(result.reasons).toContain('estimated');
  });

  it('lists the two dominant fibres first', () => {
    const result = scoreText('50% wool 30% polyamide 20% cashmere');
    expect(result.reasons.slice(0, 2)).toEqual(['fiber:wool:50', 'fiber:polyamide:30']);
  });

  it('clamps scores to 0–100', () => {
    const result = scoreMaterial({ composition: [{ fiber: 'cashmere', percent: 100 }], compositionSource: 'user' });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('tierForScore', () => {
  it.each([
    [80, 'premium'],
    [79.99, 'good'],
    [65, 'good'],
    [64.9, 'average'],
    [45, 'average'],
    [44.9, 'low'],
  ])('%p → %p', (score, tier) => {
    expect(tierForScore(score)).toBe(tier);
  });
});

describe('scoreMaterial – boundaries and rule interactions', () => {
  const user = (composition: FiberPart[], category?: Category) => scoreMaterial({ composition, category, compositionSource: 'user' });

  it('reports source "none" when the composition is empty, whatever the caller said', () => {
    const result = scoreMaterial({ composition: [], compositionSource: 'label_photo' });
    expect(result).toMatchObject({ tier: 'unknown', compositionSource: 'none', score: 0 });
  });

  it('keeps the composition source on an incomplete (<50 %) composition', () => {
    const result = scoreMaterial({ composition: [{ fiber: 'wool', percent: 49.9 }], compositionSource: 'product_page' });
    expect(result).toMatchObject({ tier: 'unknown', compositionSource: 'product_page', reasons: ['composition_incomplete'] });
  });

  it('scores exactly 50 % known composition (normalised to 100)', () => {
    const result = user([{ fiber: 'cotton', percent: 50 }]);
    expect(result.tier).toBe('good');
    expect(result.score).toBe(75);
    expect(result.reasons).toContain('composition_normalized');
  });

  it('ignores elastane at exactly 5 % but counts 6 %', () => {
    expect(user([{ fiber: 'wool', percent: 95 }, { fiber: 'elastane', percent: 5 }]).score).toBe(90);
    // (94×85 + 1×30) / 95 = 84.42; natural share 98.9 % → +5
    expect(user([{ fiber: 'wool', percent: 94 }, { fiber: 'elastane', percent: 6 }]).score).toBeCloseTo(89.42, 2);
  });

  it('gives the natural bonus at exactly 90 % premium fibre, not below', () => {
    // 90×85 + 10×45 = 81 → +5 = 86
    expect(user([{ fiber: 'wool', percent: 90 }, { fiber: 'nylon', percent: 10 }]).score).toBeCloseTo(86, 2);
    // 89×85 + 11×45 = 80.6, no bonus
    const below = user([{ fiber: 'wool', percent: 89 }, { fiber: 'nylon', percent: 11 }]);
    expect(below.score).toBeCloseTo(80.6, 2);
    expect(below.reasons).not.toContain('natural_bonus');
  });

  it('applies the cheap-synthetic penalty at exactly 50 % polyester+acrylic', () => {
    // 30×30 + 20×22 + 50×75 = 50.9 → −5
    const result = user([
      { fiber: 'polyester', percent: 30 },
      { fiber: 'acrylic', percent: 20 },
      { fiber: 'cotton', percent: 50 },
    ]);
    expect(result.score).toBeCloseTo(45.9, 2);
    expect(result.reasons).toContain('synthetic_penalty');
    const justBelow = user([{ fiber: 'polyester', percent: 49 }, { fiber: 'cotton', percent: 51 }]);
    expect(justBelow.reasons).not.toContain('synthetic_penalty');
  });

  it.each(['outerwear', 'activewear', 'swimwear'] as const)('halves the synthetic gap for %s instead of penalising', (category) => {
    // nylon 45 → 45 + (60 − 45) × 0.5 = 52.5
    const result = user([{ fiber: 'nylon', percent: 100 }], category);
    expect(result.score).toBeCloseTo(52.5, 2);
    expect(result.reasons).toContain('functional_synthetic');
    expect(result.reasons).not.toContain('synthetic_penalty');
  });

  it('does not relieve functional synthetics already at 60+ nor non-functional categories', () => {
    expect(user([{ fiber: 'polyester', percent: 100 }], 'top').score).toBe(25);
    const mixed = user([{ fiber: 'nylon', percent: 50 }, { fiber: 'wool', percent: 50 }], 'outerwear');
    expect(mixed.score).toBe(65);
    expect(mixed.reasons).not.toContain('functional_synthetic');
  });

  it('ignores a non-premium lining and uses the dominant lining fibre', () => {
    const base = user([{ fiber: 'wool', percent: 100 }]).score;
    const polyLining = scoreMaterial({
      composition: [{ fiber: 'wool', percent: 100 }],
      lining: [{ fiber: 'polyester', percent: 100 }],
      compositionSource: 'user',
    });
    expect(polyLining.score).toBe(base);
    const mostlyCupro = scoreMaterial({
      composition: [{ fiber: 'polyester', percent: 100 }],
      lining: [
        { fiber: 'polyester', percent: 40 },
        { fiber: 'cupro', percent: 60 },
      ],
      compositionSource: 'user',
    });
    expect(mostlyCupro.reasons).toContain('premium_lining');
  });

  it('caps at 100 with a premium lining on cashmere', () => {
    const result = scoreMaterial({
      composition: [{ fiber: 'cashmere', percent: 100 }],
      lining: [{ fiber: 'silk', percent: 100 }],
      compositionSource: 'user',
    });
    expect(result.score).toBe(100);
    expect(result.tier).toBe('premium');
  });

  it('never goes below 0 and lands in the low tier', () => {
    const result = user([{ fiber: 'acrylic', percent: 100 }]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.tier).toBe('low');
  });

  it.each`
    fiber                  | score
    ${'cashmere'}          | ${100}
    ${'silk'}              | ${97}
    ${'merino'}            | ${95}
    ${'linen'}             | ${87}
    ${'organic_cotton'}    | ${85}
    ${'cotton'}            | ${75}
    ${'lyocell'}           | ${72}
    ${'modal'}             | ${65}
    ${'viscose'}           | ${50}
    ${'recycled_polyester'} | ${40}
    ${'pu_faux_leather'}   | ${25}
    ${'other'}             | ${50}
  `('100 % $fiber scores $score', ({ fiber, score }) => {
    expect(user([{ fiber, percent: 100 }]).score).toBeCloseTo(score, 2);
  });

  it('only adds "estimated" for AI guesses', () => {
    for (const source of ['product_page', 'label_photo', 'user'] as const) {
      expect(scoreMaterial({ composition: [{ fiber: 'cotton', percent: 100 }], compositionSource: source }).reasons).not.toContain('estimated');
    }
  });
});
