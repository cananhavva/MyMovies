import { openDatabaseAsync } from 'expo-sqlite';
import type { Database } from './database';

/** Opens the on-device database; the web build swaps this file for sqlite.web.ts. */
export async function openSqlite(name: string): Promise<Database> {
  const db = await openDatabaseAsync(name);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return db;
}
