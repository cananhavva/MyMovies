import type { Database } from './database';
import { runMigrations } from './migrations';
import { openSqlite } from './sqlite';
import { createGapRepository } from './gapRepository';
import { createGarmentRepository } from './garmentRepository';
import { createInspirationRepository } from './inspirationRepository';
import { createSettingsRepository } from './settingsRepository';

const DATABASE_NAME = 'wardrobe.db';

export interface Repositories {
  db: Database;
  garments: ReturnType<typeof createGarmentRepository>;
  inspiration: ReturnType<typeof createInspirationRepository>;
  gaps: ReturnType<typeof createGapRepository>;
  settings: ReturnType<typeof createSettingsRepository>;
}

let repositories: Repositories | undefined;

export async function initRepositories(): Promise<Repositories> {
  if (repositories) return repositories;
  const db = await openSqlite(DATABASE_NAME);
  await runMigrations(db);
  repositories = {
    db,
    garments: createGarmentRepository(db),
    inspiration: createInspirationRepository(db),
    gaps: createGapRepository(db),
    settings: createSettingsRepository(db),
  };
  return repositories;
}

export function getRepositories(): Repositories {
  if (!repositories) throw new Error('Database not initialised; call initRepositories() first.');
  return repositories;
}
