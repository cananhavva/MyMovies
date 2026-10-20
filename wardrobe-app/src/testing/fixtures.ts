import type { Garment, InspirationItem, InspirationLook } from '@/domain/types';

const FIXED_DATE = '2026-10-01T10:00:00.000Z';

export function makeGarment(overrides: Partial<Garment> & Pick<Garment, 'id' | 'category'>): Garment {
  return {
    name: overrides.id,
    colors: [],
    seasons: [],
    weather: [],
    occasions: [],
    imageUris: [],
    fieldSources: {},
    favorite: false,
    archived: false,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  };
}

export function makeItem(overrides: Partial<InspirationItem> & Pick<InspirationItem, 'id' | 'category'>): InspirationItem {
  return {
    colors: [],
    description: '',
    matchedGarmentIds: [],
    matchScore: 0,
    ...overrides,
  };
}

export function makeLook(overrides: Partial<InspirationLook> & Pick<InspirationLook, 'id'>): InspirationLook {
  return {
    imageUris: [],
    items: [],
    occasions: [],
    seasons: [],
    liked: false,
    recreatability: 0,
    createdAt: FIXED_DATE,
    ...overrides,
  };
}
