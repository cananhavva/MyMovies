import { DATA_TABLES } from './migrations';
import { fromJson, type Database } from './database';

export interface ExportedData {
  exportedAt: string;
  schema: 'wardrobe-ai/1';
  tables: Record<string, Record<string, unknown>[]>;
}

/** Tables are exported as stored (JSON columns decoded) for KVKK/GDPR portability. */
export async function exportAllData(db: Database, now: Date): Promise<ExportedData> {
  const tables: ExportedData['tables'] = {};
  for (const table of DATA_TABLES) {
    const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table};`, []);
    tables[table] = rows.map(decodeJsonColumns);
  }
  return { exportedAt: now.toISOString(), schema: 'wardrobe-ai/1', tables };
}

function decodeJsonColumns(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([column, value]) => [
      column,
      typeof value === 'string' && /^[[{]/.test(value) ? fromJson<unknown>(value, value) : value,
    ]),
  );
}

export async function deleteAllData(db: Database): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const table of DATA_TABLES) await db.runAsync(`DELETE FROM ${table};`, []);
  });
}
