import type { GarmentAnalysis } from '@/domain/types';
import { parseComposition } from '@/rules/compositionParser';
import { draftFromGarmentAnalysis, draftFromProductAnalysis, draftToGarment, editDraft, emptyDraft, garmentToDraft, withComposition } from './garmentDraft';

const analysis: GarmentAnalysis = {
  name: 'Kazak',
  category: 'knitwear',
  subcategory: 'Kazak',
  colors: ['Lacivert'],
  seasons: ['summer'],
  weather: [],
  occasions: ['casual'],
  warmth: 4,
  compositionGuess: [{ fiber: 'wool', percent: 100 }],
  confidence: 0.8,
};

describe('garmentDraft', () => {
  it('marks AI fields and normalises subcategory and colours', () => {
    const draft = draftFromGarmentAnalysis(analysis, ['file:///a.jpg']);
    expect(draft.subcategory).toBe('sweater');
    expect(draft.colors).toEqual(['navy']);
    expect(draft.fieldSources.seasons).toBe('ai');
    expect(draft.compositionSource).toBe('ai_guess');
  });

  it('marks edited fields as user-owned', () => {
    const draft = editDraft(draftFromGarmentAnalysis(analysis, []), 'seasons', ['spring']);
    expect(draft.fieldSources.seasons).toBe('user');
  });

  it('applies rules and an estimated quality score on save', () => {
    const garment = draftToGarment(draftFromGarmentAnalysis(analysis, []), { id: 'g1', now: new Date('2026-10-20T00:00:00Z') });
    // wool ≥ 50 % removes summer and adds winter
    expect(garment.seasons).toEqual(['winter']);
    expect(garment.fieldSources.seasons).toBe('rule');
    expect(garment.quality?.tier).toBe('premium');
    expect(garment.quality?.reasons).toContain('estimated');
  });

  it('keeps user seasons untouched on save', () => {
    const draft = editDraft(draftFromGarmentAnalysis(analysis, []), 'seasons', ['summer']);
    expect(draftToGarment(draft, { id: 'g1', now: new Date() }).seasons).toEqual(['summer']);
  });

  it('uses a label composition as exact, not estimated', () => {
    const draft = withComposition(emptyDraft(), parseComposition('%100 pamuk'), 'label_photo');
    const garment = draftToGarment({ ...draft, name: 'Tee' }, { id: 'g2', now: new Date() });
    expect(garment.quality).toMatchObject({ score: 75, tier: 'good', compositionSource: 'label_photo' });
  });

  it('builds a draft from a product page without composition', () => {
    const draft = draftFromProductAnalysis({ compositionFound: false, productName: 'Coat', category: 'outerwear' }, 'https://x.com/p', []);
    expect(draft.composition).toBeUndefined();
    expect(draft.productUrl).toBe('https://x.com/p');
    expect(draftToGarment(draft, { id: 'g3', now: new Date() }).quality?.tier).toBe('unknown');
  });

  it('round-trips a garment through a draft', () => {
    const garment = draftToGarment({ ...emptyDraft(), name: 'Shirt' }, { id: 'g4', now: new Date('2026-01-01T00:00:00Z') });
    const again = draftToGarment(garmentToDraft(garment), { id: garment.id, now: new Date('2026-02-01T00:00:00Z'), existing: garment });
    expect(again.createdAt).toBe(garment.createdAt);
    expect(again.updatedAt).not.toBe(garment.updatedAt);
  });
});

describe('garmentDraft – rules never override the user', () => {
  it('keeps user-cleared weather/occasions empty on save while still filling AI fields', () => {
    let draft = draftFromGarmentAnalysis({ ...analysis, category: 'swimwear', subcategory: 'bikini', warmth: 1, weather: [], occasions: [] }, []);
    draft = editDraft(draft, 'occasions', []);
    const garment = draftToGarment(draft, { id: 'g', now: new Date('2026-10-20T00:00:00Z') });
    expect(garment.occasions).toEqual([]);
    expect(garment.fieldSources.occasions).toBe('user');
    expect(garment.weather).toEqual(expect.arrayContaining(['hot']));
    expect(garment.fieldSources.weather).toBe('rule');
  });

  it('keeps user seasons when re-saving an existing garment after a composition change', () => {
    const first = draftToGarment(editDraft(draftFromGarmentAnalysis(analysis, []), 'seasons', ['summer']), {
      id: 'g',
      now: new Date('2026-10-20T00:00:00Z'),
    });
    const edited = withComposition(garmentToDraft(first), parseComposition('%100 yün'), 'user');
    const saved = draftToGarment(edited, { id: 'g', now: new Date('2026-10-21T00:00:00Z'), existing: first });
    expect(saved.seasons).toEqual(['summer']);
    expect(saved.createdAt).toBe(first.createdAt);
    expect(saved.quality?.compositionSource).toBe('user');
  });

  // Regression: upper-case AI colours/subcategories ("IVORY", "SKIRT") were dropped / left unmatched.
  it('normalises upper-case colours and subcategories from the AI', () => {
    const draft = draftFromGarmentAnalysis({ ...analysis, category: 'bottom', subcategory: 'SKIRT', colors: ['IVORY', 'KIRMIZI'] }, []);
    expect(draft.subcategory).toBe('skirt');
    expect(draft.colors).toEqual(['ivory', 'red']);
  });
});
