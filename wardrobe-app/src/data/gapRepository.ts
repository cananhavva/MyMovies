import type { CapsulePlan, GapSuggestion } from '@/domain/types';
import { fromJson, orUndefined, toJson, type Database } from './database';

interface GapRow {
  id: string;
  key: string;
  category: GapSuggestion['category'];
  subcategory: string | null;
  color: string | null;
  title: string;
  reason: GapSuggestion['reason'];
  evidence: string;
  priority: number;
  unlocks_look_count: number;
  status: GapSuggestion['status'];
  status_changed_at: string | null;
  created_at: string;
}

interface CapsuleRow {
  id: string;
  season: CapsulePlan['season'] | null;
  target_size: number;
  core_garment_ids: string;
  gap_keys: string;
  narrative: string | null;
  created_at: string;
}

const gapFromRow = (row: GapRow): GapSuggestion => ({
  id: row.id,
  key: row.key,
  category: row.category,
  subcategory: orUndefined(row.subcategory),
  color: orUndefined(row.color),
  title: row.title,
  reason: row.reason,
  evidence: fromJson(row.evidence, { lookIds: [], frequency: 0 }),
  priority: row.priority,
  unlocksLookCount: row.unlocks_look_count,
  status: row.status,
  statusChangedAt: orUndefined(row.status_changed_at),
  createdAt: row.created_at,
});

const capsuleFromRow = (row: CapsuleRow): CapsulePlan => ({
  id: row.id,
  season: orUndefined(row.season),
  targetSize: row.target_size,
  coreGarmentIds: fromJson(row.core_garment_ids, []),
  gapKeys: fromJson(row.gap_keys, []),
  narrative: orUndefined(row.narrative),
  createdAt: row.created_at,
});

export function createGapRepository(db: Database) {
  return {
    async listSuggestions(): Promise<GapSuggestion[]> {
      const rows = await db.getAllAsync<GapRow>('SELECT * FROM gap_suggestions;', []);
      return rows.map(gapFromRow);
    },

    /** Replaces the stored set; suggestions are recomputed locally on every change. */
    async replaceSuggestions(suggestions: readonly GapSuggestion[]): Promise<void> {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM gap_suggestions;', []);
        for (const s of suggestions) {
          await db.runAsync(
            `INSERT INTO gap_suggestions
               (id, key, category, subcategory, color, title, reason, evidence, priority, unlocks_look_count, status, status_changed_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              s.id,
              s.key,
              s.category,
              s.subcategory ?? null,
              s.color ?? null,
              s.title,
              s.reason,
              toJson(s.evidence),
              s.priority,
              s.unlocksLookCount,
              s.status,
              s.statusChangedAt ?? null,
              s.createdAt,
            ],
          );
        }
      });
    },

    async latestCapsulePlan(): Promise<CapsulePlan | undefined> {
      const row = await db.getFirstAsync<CapsuleRow>('SELECT * FROM capsule_plans ORDER BY created_at DESC LIMIT 1;', []);
      return row ? capsuleFromRow(row) : undefined;
    },

    async saveCapsulePlan(plan: CapsulePlan): Promise<void> {
      await db.runAsync(
        `INSERT OR REPLACE INTO capsule_plans (id, season, target_size, core_garment_ids, gap_keys, narrative, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          plan.id,
          plan.season ?? null,
          plan.targetSize,
          toJson(plan.coreGarmentIds),
          toJson(plan.gapKeys),
          plan.narrative ?? null,
          plan.createdAt,
        ],
      );
    },
  };
}

export type GapRepository = ReturnType<typeof createGapRepository>;
