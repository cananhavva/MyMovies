import type { GapSuggestion, InspirationLook } from '@/domain/types';
import { createTestDatabase, loadNodeSqlite } from '@/testing/sqliteDatabase';
import { makeGarment, makeItem, makeLook } from '@/testing/fixtures';
import { dbCall, fromJson } from './database';
import { deleteAllData, exportAllData } from './dataAdmin';
import { createGapRepository } from './gapRepository';
import { createGarmentRepository } from './garmentRepository';
import { createInspirationRepository } from './inspirationRepository';
import { DATA_TABLES, MIGRATIONS, runMigrations } from './migrations';
import { createSettingsRepository } from './settingsRepository';

const sqlite = loadNodeSqlite();
const describeDb = sqlite ? describe : describe.skip;

async function freshDb() {
  if (!sqlite) throw new Error('node:sqlite unavailable');
  const { db, raw } = createTestDatabase(sqlite);
  await runMigrations(db);
  return { db, raw };
}

describeDb('migrations', () => {
  it('creates every table from the plan plus schema_version', async () => {
    const { raw } = await freshDb();
    const tables = raw
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name);
    expect(tables).toEqual(expect.arrayContaining([...DATA_TABLES, 'schema_version']));
  });

  it('is idempotent and records the version once', async () => {
    const { db, raw } = await freshDb();
    expect(await runMigrations(db)).toBe(MIGRATIONS.at(-1)?.version);
    expect(raw.prepare('SELECT COUNT(*) AS n FROM schema_version').get()).toMatchObject({ n: MIGRATIONS.length });
  });

  it('applies only pending migrations, in order, and rolls back a failing one', async () => {
    const { db, raw } = await freshDb();
    const extra = [
      ...MIGRATIONS,
      { version: 3, sql: 'CREATE TABLE third (id TEXT);' },
      { version: 2, sql: 'CREATE TABLE second (id TEXT);' },
    ];
    expect(await runMigrations(db, extra)).toBe(3);
    const broken = [...extra, { version: 4, sql: 'CREATE TABLE fourth (id TEXT); THIS IS NOT SQL;' }];
    await expect(runMigrations(db, broken)).rejects.toThrow();
    expect(raw.prepare('SELECT MAX(version) AS v FROM schema_version').get()).toMatchObject({ v: 3 });
    expect(raw.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'fourth'").get()).toMatchObject({ n: 0 });
  });
});

describeDb('garment repository', () => {
  it('round-trips every field, including JSON columns and booleans', async () => {
    const { db } = await freshDb();
    const repo = createGarmentRepository(db);
    const garment = makeGarment({
      id: 'g1',
      name: 'Trençkot',
      category: 'outerwear',
      subcategory: 'trench_coat',
      colors: ['beige'],
      pattern: 'solid',
      seasons: ['spring', 'autumn'],
      weather: ['rainy'],
      occasions: ['office'],
      formality: 3,
      warmth: 3,
      composition: [{ fiber: 'cotton', percent: 100 }],
      liningComposition: [{ fiber: 'cupro', percent: 100 }],
      quality: { score: 78, tier: 'good', reasons: ['fiber:cotton:100'], source: 'rule', compositionSource: 'label_photo' },
      brand: 'Brand',
      productUrl: 'https://shop.example.com/p/1',
      price: { amount: 4999.9, currency: 'TRY' },
      imageUris: ['file:///images/a.jpg'],
      fieldSources: { seasons: 'user', colors: 'ai' },
      aiConfidence: 0.83,
      pendingAnalysis: true,
      notes: "it's \"quoted\"",
      favorite: true,
    });
    await repo.upsert(garment);
    expect(await repo.list()).toEqual([garment]);
  });

  it('maps NULL columns back to undefined and keeps minimal garments valid', async () => {
    const { db } = await freshDb();
    const repo = createGarmentRepository(db);
    await repo.upsert(makeGarment({ id: 'min', category: 'top' }));
    const [stored] = await repo.list();
    expect(stored).toMatchObject({ id: 'min', colors: [], fieldSources: {}, pendingAnalysis: false, favorite: false, archived: false });
    expect(stored?.composition).toBeUndefined();
    expect(stored?.brand).toBeUndefined();
    expect(stored?.formality).toBeUndefined();
  });

  it('upserts in place, lists newest first and removes', async () => {
    const { db } = await freshDb();
    const repo = createGarmentRepository(db);
    await repo.upsert(makeGarment({ id: 'old', category: 'top', createdAt: '2026-01-01T00:00:00.000Z' }));
    await repo.upsert(makeGarment({ id: 'new', category: 'top', createdAt: '2026-05-01T00:00:00.000Z' }));
    await repo.upsert(makeGarment({ id: 'old', category: 'top', name: 'renamed', createdAt: '2026-01-01T00:00:00.000Z' }));
    const list = await repo.list();
    expect(list.map((g) => g.id)).toEqual(['new', 'old']);
    expect(list[1]?.name).toBe('renamed');
    await repo.remove('old');
    expect((await repo.list()).map((g) => g.id)).toEqual(['new']);
  });

  it('finds duplicates by product URL, ignoring archived garments (DUPLICATE_GARMENT)', async () => {
    const { db } = await freshDb();
    const repo = createGarmentRepository(db);
    const url = 'https://shop.example.com/p/9';
    await repo.upsert(makeGarment({ id: 'archived', category: 'top', productUrl: url, archived: true }));
    expect(await repo.findByProductUrl(url)).toBeUndefined();
    await repo.upsert(makeGarment({ id: 'live', category: 'top', productUrl: url }));
    expect((await repo.findByProductUrl(url))?.id).toBe('live');
  });

  it('falls back to defaults for corrupted JSON instead of crashing the list', async () => {
    const { db, raw } = await freshDb();
    const repo = createGarmentRepository(db);
    await repo.upsert(makeGarment({ id: 'x', category: 'top', colors: ['black'] }));
    raw.exec("UPDATE garments SET colors = '{not json', field_sources = ''");
    const [stored] = await repo.list();
    expect(stored?.colors).toEqual([]);
    expect(stored?.fieldSources).toEqual({});
  });
});

describeDb('inspiration repository', () => {
  it('round-trips looks with nested items', async () => {
    const { db } = await freshDb();
    const repo = createInspirationRepository(db);
    const look: InspirationLook = makeLook({
      id: 'l1',
      influencerId: 'i1',
      sourceUrl: 'https://pin.it/x',
      imageUris: ['file:///a.jpg'],
      items: [makeItem({ id: 'it', category: 'outerwear', colors: ['black'], likelyBrands: ['A'], matchedGarmentIds: ['g'], matchScore: 0.72 })],
      occasions: ['casual'],
      seasons: ['autumn'],
      liked: true,
      recreatability: 0.5,
    });
    await repo.upsertLook(look);
    expect(await repo.listLooks()).toEqual([look]);
  });

  it('detaches looks when their influencer is removed', async () => {
    const { db } = await freshDb();
    const repo = createInspirationRepository(db);
    await repo.upsertInfluencer({ id: 'i1', platform: 'instagram', handle: 'a', profileUrl: 'https://instagram.com/a', createdAt: '2026-01-01T00:00:00.000Z' });
    await repo.upsertLook(makeLook({ id: 'l1', influencerId: 'i1' }));
    await repo.removeInfluencer('i1');
    expect(await repo.listInfluencers()).toEqual([]);
    expect((await repo.listLooks())[0]?.influencerId).toBeUndefined();
  });

  it('enforces one influencer per profile URL', async () => {
    const { db } = await freshDb();
    const repo = createInspirationRepository(db);
    const base = { platform: 'instagram' as const, handle: 'a', profileUrl: 'https://instagram.com/a', createdAt: '2026-01-01T00:00:00.000Z' };
    await repo.upsertInfluencer({ ...base, id: 'first' });
    await repo.upsertInfluencer({ ...base, id: 'second' });
    expect((await repo.listInfluencers()).map((i) => i.id)).toEqual(['second']);
  });
});

describeDb('gap repository', () => {
  const suggestion = (key: string, status: GapSuggestion['status'] = 'open'): GapSuggestion => ({
    id: `gap:${key}`,
    key,
    category: 'bag',
    title: 'bag',
    reason: 'capsule_core',
    evidence: { lookIds: ['l1'], frequency: 1, likedFrequency: 0, distinctInfluencers: 1 },
    priority: 20,
    unlocksLookCount: 0,
    status,
    statusChangedAt: '2026-10-01T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
  });

  it('replaces the stored set atomically', async () => {
    const { db } = await freshDb();
    const repo = createGapRepository(db);
    await repo.replaceSuggestions([suggestion('a'), suggestion('b', 'dismissed')]);
    await repo.replaceSuggestions([suggestion('c', 'planned')]);
    expect(await repo.listSuggestions()).toEqual([suggestion('c', 'planned')]);
  });

  it('keeps the previous set when a replacement fails half-way', async () => {
    const { db } = await freshDb();
    const repo = createGapRepository(db);
    await repo.replaceSuggestions([suggestion('a')]);
    // duplicate key violates UNIQUE(key) on the second insert
    await expect(repo.replaceSuggestions([suggestion('x'), { ...suggestion('x'), id: 'other' }])).rejects.toThrow();
    expect((await repo.listSuggestions()).map((s) => s.key)).toEqual(['a']);
  });

  it('stores and returns the latest capsule plan', async () => {
    const { db } = await freshDb();
    const repo = createGapRepository(db);
    expect(await repo.latestCapsulePlan()).toBeUndefined();
    await repo.saveCapsulePlan({ id: 'p1', targetSize: 14, coreGarmentIds: ['g1'], gapKeys: ['bag:any:neutral'], createdAt: '2026-01-01T00:00:00.000Z' });
    await repo.saveCapsulePlan({ id: 'p2', season: 'winter', targetSize: 14, coreGarmentIds: [], gapKeys: [], narrative: 'n', createdAt: '2026-02-01T00:00:00.000Z' });
    expect(await repo.latestCapsulePlan()).toMatchObject({ id: 'p2', season: 'winter', narrative: 'n' });
  });
});

describeDb('settings repository', () => {
  it('defaults to no consent and no occasions, then persists changes', async () => {
    const { db } = await freshDb();
    const repo = createSettingsRepository(db);
    expect(await repo.load()).toEqual({ aiConsentGranted: false, frequentOccasions: [], deviceId: undefined });
    await repo.setAiConsent(true);
    await repo.setFrequentOccasions(['office', 'hiking_walking']);
    await repo.setDeviceId('device-1');
    expect(await repo.load()).toEqual({ aiConsentGranted: true, frequentOccasions: ['office', 'hiking_walking'], deviceId: 'device-1' });
    await repo.setAiConsent(false);
    expect((await repo.load()).aiConsentGranted).toBe(false);
  });
});

describeDb('data admin (export / delete everything)', () => {
  it('exports every table with JSON columns decoded and then deletes all data', async () => {
    const { db } = await freshDb();
    await createGarmentRepository(db).upsert(makeGarment({ id: 'g', category: 'top', colors: ['black'], notes: '[not json' }));
    await createSettingsRepository(db).setAiConsent(true);
    const exported = await exportAllData(db, new Date('2026-10-20T00:00:00.000Z'));
    expect(Object.keys(exported.tables).sort()).toEqual([...DATA_TABLES].sort());
    expect(exported.tables.garments?.[0]).toMatchObject({ id: 'g', colors: ['black'], notes: '[not json' });
    expect(JSON.stringify(exported)).not.toMatch(/anthropic|sk-ant/i);

    await deleteAllData(db);
    const after = await exportAllData(db, new Date());
    expect(Object.values(after.tables).every((rows) => rows.length === 0)).toBe(true);
  });
});

describe('database helpers', () => {
  it('wraps storage failures as DB_ERROR results', async () => {
    const result = await dbCall(async () => {
      throw new Error('SQLITE_FULL');
    });
    expect(result).toMatchObject({ ok: false, error: { code: 'DB_ERROR', retryable: true } });
    expect(await dbCall(async () => 1)).toEqual({ ok: true, value: 1 });
  });

  it('parses JSON defensively', () => {
    expect(fromJson(null, 'd')).toBe('d');
    expect(fromJson('', 'd')).toBe('d');
    expect(fromJson('{bad', 'd')).toBe('d');
    expect(fromJson('[1]', [])).toEqual([1]);
  });
});
