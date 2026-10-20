import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { Database } from '@/data/database';

type SqliteModule = typeof import('node:sqlite');

/** node:sqlite ships with Node ≥ 22.13 (≥ 22.5 behind a flag); older runtimes skip the DB tests. */
export function loadNodeSqlite(): SqliteModule | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node:sqlite') as SqliteModule;
  } catch {
    return undefined;
  }
}

function toParams(params: unknown[]): SQLInputValue[] {
  const flat = params.length === 1 && Array.isArray(params[0]) ? (params[0] as unknown[]) : params;
  return flat as SQLInputValue[];
}

/**
 * Real SQLite (in memory) behind the expo-sqlite methods the repositories use, so migrations and
 * SQL are exercised for real in Jest. Rows are copied into plain objects like expo-sqlite returns.
 */
export function createTestDatabase(sqlite: SqliteModule): { db: Database; raw: DatabaseSync } {
  const raw = new sqlite.DatabaseSync(':memory:');
  const plain = <T>(row: unknown): T => ({ ...(row as object) }) as T;
  const fake = {
    async execAsync(source: string): Promise<void> {
      raw.exec(source);
    },
    async runAsync(source: string, ...params: unknown[]) {
      const result = raw.prepare(source).run(...toParams(params));
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
      return raw
        .prepare(source)
        .all(...toParams(params))
        .map((row) => plain<T>(row));
    },
    async getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null> {
      const row = raw.prepare(source).get(...toParams(params));
      return row === undefined ? null : plain<T>(row);
    },
    async withTransactionAsync(task: () => Promise<void>): Promise<void> {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return { db: fake as unknown as Database, raw };
}
