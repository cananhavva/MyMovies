import type { GapSuggestion } from '@/domain/types';
import { makeGarment, makeItem, makeLook } from '@/testing/fixtures';
import { analyzeGaps, MAX_VISIBLE_SUGGESTIONS } from './gapAnalysis';

const NOW = new Date('2026-10-15T12:00:00.000Z');

const blackTrench = (id: string) => makeItem({ id, category: 'outerwear', subcategory: 'trench_coat', colors: ['black'] });
const ownedJeans = (id: string) => makeItem({ id, category: 'bottom', subcategory: 'jeans', colors: ['blue'], matchScore: 0.9 });

describe('analyzeGaps – inspiration frequency', () => {
  const looks = [
    makeLook({ id: 'l1', liked: true, influencerId: 'a', items: [blackTrench('t1'), ownedJeans('j1')], recreatability: 0.5 }),
    makeLook({ id: 'l2', liked: true, influencerId: 'b', items: [blackTrench('t2'), ownedJeans('j2')], recreatability: 0.5 }),
    makeLook({ id: 'l3', liked: true, influencerId: 'c', items: [blackTrench('t3')], recreatability: 0 }),
    makeLook({ id: 'l4', liked: false, influencerId: 'a', items: [blackTrench('t4')], recreatability: 0 }),
  ];

  it('builds the plan example: black trench in 4 looks from 3 influencers', () => {
    const { visible } = analyzeGaps({ garments: [], looks, frequentOccasions: [], previous: [], now: NOW });
    const trench = visible.find((s) => s.key === 'outerwear:trench_coat:black');
    expect(trench).toBeDefined();
    expect(trench?.reason).toBe('inspiration_frequency');
    expect(trench?.evidence.frequency).toBe(4);
    expect(trench?.evidence.distinctInfluencers).toBe(3);
    expect(trench?.unlocksLookCount).toBe(4);
    // min(100, 20·3 + 10·1 + 10·2 + 15·4)
    expect(trench?.priority).toBe(100);
  });

  it('ignores a single unliked occurrence', () => {
    const { all } = analyzeGaps({
      garments: [],
      looks: [makeLook({ id: 'x', items: [makeItem({ id: 'i', category: 'accessory', subcategory: 'hat', colors: ['red'] })] })],
      frequentOccasions: [],
      previous: [],
      now: NOW,
    });
    expect(all.some((s) => s.key === 'accessory:hat:red')).toBe(false);
  });
});

describe('analyzeGaps – coverage and capsule', () => {
  it('suggests office basics when office is a frequent occasion', () => {
    const { all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: ['office'], previous: [], now: NOW });
    const office = all.filter((s) => s.evidence.occasion === 'office');
    expect(office.map((s) => s.category).sort()).toEqual(['bottom', 'shoes', 'top']);
  });

  it('suggests seasonal basics for the current and next season', () => {
    const { all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [], now: NOW });
    const seasons = new Set(all.filter((s) => s.reason === 'season_coverage').map((s) => s.evidence.season));
    // A dedupe may turn a season gap into a capsule gap, so check the remaining ones only.
    expect([...seasons].every((season) => season === 'autumn' || season === 'winter')).toBe(true);
  });

  it('boosts keys that appear for several reasons', () => {
    const { all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [], now: NOW });
    // winter "coat" is both a season gap (35) and a capsule gap (20) → 35 + 10
    expect(all.find((s) => s.key === 'outerwear:coat:any')?.priority).toBe(45);
  });

  it('returns at most 10 visible suggestions sorted by priority', () => {
    const { visible } = analyzeGaps({ garments: [], looks: [], frequentOccasions: ['office', 'hiking_walking'], previous: [], now: NOW });
    expect(visible.length).toBeLessThanOrEqual(MAX_VISIBLE_SUGGESTIONS);
    const priorities = visible.map((s) => s.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => b - a));
  });
});

describe('analyzeGaps – statuses', () => {
  const baseline = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [], now: NOW }).all;
  const target = baseline.find((s) => s.key === 'bag:any:neutral') as GapSuggestion;

  it('hides dismissed suggestions for 30 days', () => {
    const dismissed = { ...target, status: 'dismissed' as const, statusChangedAt: '2026-10-10T00:00:00.000Z' };
    const { visible } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [dismissed], now: NOW });
    expect(visible.some((s) => s.key === target.key)).toBe(false);
  });

  it('shows dismissed suggestions again after 30 days', () => {
    const dismissed = { ...target, status: 'dismissed' as const, statusChangedAt: '2026-08-01T00:00:00.000Z' };
    const { all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [dismissed], now: NOW });
    expect(all.find((s) => s.key === target.key)?.status).toBe('open');
  });

  it('marks a planned suggestion as acquired once a matching garment is added', () => {
    const planned = { ...target, status: 'planned' as const };
    const bag = makeGarment({ id: 'bag', category: 'bag', colors: ['black'] });
    const { all, visible } = analyzeGaps({ garments: [bag], looks: [], frequentOccasions: [], previous: [planned], now: NOW });
    expect(all.find((s) => s.key === target.key)?.status).toBe('acquired');
    expect(visible.some((s) => s.key === target.key)).toBe(false);
  });
});

describe('analyzeGaps – inspiration priority and thresholds (PLAN 3.4.1)', () => {
  const run = (looks: Parameters<typeof analyzeGaps>[0]['looks'], extra: Partial<Parameters<typeof analyzeGaps>[0]> = {}) =>
    analyzeGaps({ garments: [], looks, frequentOccasions: [], previous: [], now: NOW, ...extra });
  const redHat = (id: string) => makeItem({ id, category: 'accessory', subcategory: 'hat', colors: ['red'] });
  const ownedTop = (id: string) => makeItem({ id, category: 'top', subcategory: 'shirt', colors: ['white'], matchScore: 0.9 });
  const find = (all: GapSuggestion[]) => all.find((s) => s.key === 'accessory:hat:red');
  /** A second missing piece keeps the hat from unlocking the look on its own. */
  const missingShoe = (id: string) => makeItem({ id, category: 'shoes', subcategory: 'heels', colors: ['gold'] });

  it('counts a hat-only look as unlocked by the hat', () => {
    const { all } = run([makeLook({ id: 'a', items: [redHat('1')] }), makeLook({ id: 'b', items: [redHat('2')] })]);
    // 10·2 + 15·2
    expect(find(all)).toMatchObject({ priority: 50, unlocksLookCount: 2 });
  });

  it('includes two unliked occurrences with priority 10·2, no influencer bonus', () => {
    const { all } = run([
      makeLook({ id: 'a', items: [redHat('1'), missingShoe('s1')] }),
      makeLook({ id: 'b', items: [redHat('2'), missingShoe('s2')] }),
    ]);
    expect(find(all)).toMatchObject({ priority: 20, unlocksLookCount: 0, reason: 'inspiration_frequency' });
    expect(find(all)?.evidence).toMatchObject({ frequency: 2, likedFrequency: 0, distinctInfluencers: 1 });
  });

  it('includes a single liked occurrence when adding the piece unlocks the look', () => {
    // look = owned top (1) + missing bag (0.5 weight): 1/1.5 = 0.67 → with bag 1.0 ≥ 0.8
    const look = makeLook({
      id: 'l',
      liked: true,
      items: [ownedTop('t'), makeItem({ id: 'b', category: 'bag', colors: ['black'] })],
      recreatability: 0.67,
    });
    const gap = run([look]).all.find((s) => s.key === 'bag:any:black');
    // 20·1 + 0 + 0 + 15·1
    expect(gap).toMatchObject({ priority: 35, unlocksLookCount: 1 });
  });

  it('excludes a single liked occurrence that would not unlock its look', () => {
    const look = makeLook({ id: 'l', liked: true, items: [redHat('h'), makeItem({ id: 's', category: 'shoes', colors: ['white'] })] });
    expect(find(run([look]).all)).toBeUndefined();
  });

  it('does not count a look as unlocked when it is already ≥ 0.8 recreatable', () => {
    const look = (id: string) =>
      makeLook({ id, items: [ownedTop(`${id}t`), ownedTop(`${id}u`), ownedTop(`${id}v`), ownedTop(`${id}w`), redHat(`${id}h`)], recreatability: 0.89 });
    expect(find(run([look('a'), look('b')]).all)?.unlocksLookCount).toBe(0);
  });

  it('counts a look once even when it shows the same missing piece twice', () => {
    const { all } = run([makeLook({ id: 'a', items: [redHat('1'), redHat('2')] })]);
    expect(find(all)).toBeUndefined();
  });

  it('adds 10 per extra distinct influencer and treats looks without one as a single source', () => {
    const looks = [
      makeLook({ id: 'a', influencerId: 'x', items: [redHat('1'), missingShoe('s1')] }),
      makeLook({ id: 'b', influencerId: 'y', items: [redHat('2'), missingShoe('s2')] }),
      makeLook({ id: 'c', items: [redHat('3'), missingShoe('s3')] }),
    ];
    // 10·3 + 10·(2−1)
    expect(find(run(looks).all)?.priority).toBe(40);
  });

  it('groups by colour family (charcoal ~ black) and skips owned/similar items', () => {
    const looks = [
      makeLook({ id: 'a', items: [makeItem({ id: '1', category: 'outerwear', subcategory: 'coat', colors: ['charcoal'] })] }),
      makeLook({ id: 'b', items: [makeItem({ id: '2', category: 'outerwear', subcategory: 'coat', colors: ['black'] })] }),
      makeLook({ id: 'c', items: [makeItem({ id: '3', category: 'outerwear', subcategory: 'coat', colors: ['black'], matchScore: 0.5 })] }),
    ];
    const gap = run(looks).all.find((s) => s.key === 'outerwear:coat:black');
    expect(gap?.evidence.frequency).toBe(2);
    expect(gap?.evidence.lookIds).toEqual(['a', 'b']);
  });

  it('caps priority at 100', () => {
    const looks = Array.from({ length: 8 }, (_, i) => makeLook({ id: `l${i}`, liked: true, influencerId: `i${i}`, items: [redHat(`${i}`)] }));
    expect(find(run(looks).all)?.priority).toBe(100);
  });
});

describe('analyzeGaps – empty states and limits', () => {
  it('works with an empty wardrobe and no inspiration (season + capsule only)', () => {
    const { all, visible } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [], now: NOW });
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((s) => s.reason === 'season_coverage' || s.reason === 'capsule_core')).toBe(true);
    expect(visible).toHaveLength(MAX_VISIBLE_SUGGESTIONS);
    expect(new Set(all.map((s) => s.key)).size).toBe(all.length);
  });

  it('keeps all suggestions in `all` but shows only the top 10', () => {
    const looks = Array.from({ length: 15 }, (_, i) =>
      makeLook({ id: `l${i}`, items: [makeItem({ id: `i${i}`, category: 'accessory', subcategory: `thing_${i}`, colors: ['red'] })] }),
    );
    const doubled = [...looks, ...looks.map((l) => ({ ...l, id: `${l.id}b` }))];
    const { all, visible } = analyzeGaps({ garments: [], looks: doubled, frequentOccasions: [], previous: [], now: NOW });
    expect(all.filter((s) => s.reason === 'inspiration_frequency')).toHaveLength(15);
    expect(visible).toHaveLength(10);
  });

  it('stops suggesting occasion pieces once the wardrobe covers them (archived items do not count)', () => {
    const office = [
      makeGarment({ id: 'b', category: 'bottom', formality: 3 }),
      makeGarment({ id: 't1', category: 'top', occasions: ['office'] }),
      makeGarment({ id: 't2', category: 'top', formality: 4 }),
      makeGarment({ id: 's', category: 'shoes', formality: 3 }),
    ];
    const covered = analyzeGaps({ garments: office, looks: [], frequentOccasions: ['office'], previous: [], now: NOW }).all;
    expect(covered.some((s) => s.reason === 'occasion_coverage')).toBe(false);

    const withArchived = office.map((g) => (g.id === 't2' ? { ...g, archived: true } : g));
    const gaps = analyzeGaps({ garments: withArchived, looks: [], frequentOccasions: ['office'], previous: [], now: NOW }).all;
    expect(gaps.filter((s) => s.evidence.occasion === 'office').map((s) => s.category)).toEqual(['top']);
  });

  it('accepts sneakers for hiking shoes and a rainy/windy jacket for hiking outerwear', () => {
    const garments = [
      makeGarment({ id: 's', category: 'shoes', subcategory: 'sneakers' }),
      makeGarment({ id: 'j', category: 'outerwear', weather: ['windy'] }),
    ];
    const { all } = analyzeGaps({ garments, looks: [], frequentOccasions: ['hiking_walking'], previous: [], now: NOW });
    expect(all.some((s) => s.evidence.occasion === 'hiking_walking')).toBe(false);
  });

  it('gives occasion gaps priority 40, season gaps 35 and capsule gaps 20', () => {
    const { all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: ['hiking_walking'], previous: [], now: NOW });
    expect(all.find((s) => s.key === 'shoes:hiking_boots:any')?.priority).toBe(40);
    expect(all.find((s) => s.key === 'top:shirt:any')?.priority).toBe(35);
    expect(all.find((s) => s.key === 'bag:any:neutral')?.priority).toBe(20);
  });

  it('uses the current and next season (winter → spring)', () => {
    const { all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [], now: new Date('2026-01-15T12:00:00Z') });
    const seasons = new Set(all.flatMap((s) => (s.evidence.season ? [s.evidence.season] : [])));
    expect([...seasons].sort()).toEqual(['spring', 'winter']);
  });
});

describe('analyzeGaps – status lifecycle', () => {
  const now = NOW;
  const baseline = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [], now }).all;
  const bagGap = baseline.find((s) => s.key === 'bag:any:neutral') as GapSuggestion;
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  it.each`
    days     | hidden
    ${29.99} | ${true}
    ${30}    | ${false}
  `('dismissed $days days ago → hidden=$hidden', ({ days, hidden }) => {
    const dismissed = { ...bagGap, status: 'dismissed' as const, statusChangedAt: daysAgo(days) };
    const { visible, all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [dismissed], now });
    if (hidden) expect(visible.some((s) => s.key === bagGap.key)).toBe(false);
    expect(all.find((s) => s.key === bagGap.key)?.status).toBe(hidden ? 'dismissed' : 'open');
  });

  it('falls back to createdAt when a dismissal has no statusChangedAt', () => {
    const dismissed = { ...bagGap, status: 'dismissed' as const, statusChangedAt: undefined, createdAt: daysAgo(2) };
    const { all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [dismissed], now });
    expect(all.find((s) => s.key === bagGap.key)?.status).toBe('dismissed');
  });

  it('keeps id, createdAt and a "planned" status across recomputes', () => {
    const planned = { ...bagGap, id: 'keep-me', createdAt: '2026-01-01T00:00:00.000Z', status: 'planned' as const };
    const { all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [planned], now });
    expect(all.find((s) => s.key === bagGap.key)).toMatchObject({ id: 'keep-me', createdAt: '2026-01-01T00:00:00.000Z', status: 'planned' });
  });

  it('shows planned suggestions alongside open ones', () => {
    const top = baseline.find((s) => s.key === 'outerwear:coat:any') as GapSuggestion;
    const { visible } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [{ ...top, status: 'planned' }], now });
    expect(visible.find((s) => s.key === top.key)?.status).toBe('planned');
  });

  it('marks an open suggestion acquired when a matching garment arrives, but not a dismissed one', () => {
    const bag = makeGarment({ id: 'bag', category: 'bag', colors: ['camel'] });
    const open = analyzeGaps({ garments: [bag], looks: [], frequentOccasions: [], previous: [{ ...bagGap, status: 'open' }], now });
    expect(open.all.find((s) => s.key === bagGap.key)?.status).toBe('acquired');

    const dismissed = { ...bagGap, status: 'dismissed' as const, statusChangedAt: daysAgo(1) };
    const kept = analyzeGaps({ garments: [bag], looks: [], frequentOccasions: [], previous: [dismissed], now });
    expect(kept.all.find((s) => s.key === bagGap.key)?.status).toBe('dismissed');
  });

  it('does not treat an archived garment as acquiring the gap', () => {
    const bag = makeGarment({ id: 'bag', category: 'bag', colors: ['black'], archived: true });
    const { all } = analyzeGaps({ garments: [bag], looks: [], frequentOccasions: [], previous: [{ ...bagGap, status: 'planned' }], now });
    expect(all.find((s) => s.key === bagGap.key)?.status).toBe('planned');
  });

  it('drops stale open suggestions that are neither candidates nor owned', () => {
    const stale: GapSuggestion = { ...bagGap, key: 'accessory:hat:red', id: 'stale', status: 'open' };
    const { all } = analyzeGaps({ garments: [], looks: [], frequentOccasions: [], previous: [stale], now });
    expect(all.some((s) => s.id === 'stale')).toBe(false);
  });
});
