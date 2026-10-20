import type { Database } from './database';

export interface Migration {
  version: number;
  sql: string;
}

/** Append-only: never edit a shipped migration, add a new version instead. */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS garments (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        colors TEXT NOT NULL,
        pattern TEXT,
        seasons TEXT NOT NULL,
        weather TEXT NOT NULL,
        occasions TEXT NOT NULL,
        formality INTEGER,
        warmth INTEGER,
        composition TEXT,
        lining_composition TEXT,
        quality TEXT,
        brand TEXT,
        product_url TEXT,
        price TEXT,
        image_uris TEXT NOT NULL,
        field_sources TEXT NOT NULL,
        ai_confidence REAL,
        pending_analysis INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        favorite INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_garments_product_url ON garments (product_url);

      CREATE TABLE IF NOT EXISTS outfits (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        garment_ids TEXT NOT NULL,
        occasions TEXT NOT NULL,
        seasons TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS influencers (
        id TEXT PRIMARY KEY NOT NULL,
        platform TEXT NOT NULL,
        handle TEXT NOT NULL,
        profile_url TEXT NOT NULL UNIQUE,
        display_name TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inspiration_looks (
        id TEXT PRIMARY KEY NOT NULL,
        influencer_id TEXT,
        source_url TEXT,
        image_uris TEXT NOT NULL,
        items TEXT NOT NULL,
        occasions TEXT NOT NULL,
        seasons TEXT NOT NULL,
        liked INTEGER NOT NULL DEFAULT 0,
        recreatability REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_looks_influencer ON inspiration_looks (influencer_id);

      CREATE TABLE IF NOT EXISTS gap_suggestions (
        id TEXT PRIMARY KEY NOT NULL,
        key TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        subcategory TEXT,
        color TEXT,
        title TEXT NOT NULL,
        reason TEXT NOT NULL,
        evidence TEXT NOT NULL,
        priority INTEGER NOT NULL,
        unlocks_look_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        status_changed_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS capsule_plans (
        id TEXT PRIMARY KEY NOT NULL,
        season TEXT,
        target_size INTEGER NOT NULL,
        core_garment_ids TEXT NOT NULL,
        gap_keys TEXT NOT NULL,
        narrative TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
  },
];

export const DATA_TABLES = [
  'garments',
  'outfits',
  'influencers',
  'inspiration_looks',
  'gap_suggestions',
  'capsule_plans',
  'settings',
] as const;

export async function runMigrations(db: Database, migrations: readonly Migration[] = MIGRATIONS): Promise<number> {
  await db.execAsync('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);');
  const row = await db.getFirstAsync<{ version: number }>('SELECT MAX(version) AS version FROM schema_version;');
  const current = row?.version ?? 0;
  const pending = migrations.filter((m) => m.version > current).sort((a, b) => a.version - b.version);
  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.runAsync('INSERT INTO schema_version (version) VALUES (?);', [migration.version]);
    });
  }
  return pending.at(-1)?.version ?? current;
}
