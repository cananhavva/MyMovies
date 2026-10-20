import initSqlJs from 'sql.js/dist/sql-asm.js';
import type { Database as SqlJsDatabase, SqlValue as SqlJsValue } from 'sql.js';
import type { Database } from './database';

/**
 * Browser build of openSqlite: expo-sqlite's web worker needs COOP/COEP headers most static hosts
 * don't send, so the web preview runs SQLite via sql.js (asm.js build, no wasm) and keeps the file in
 * IndexedDB. Same SQL, migrations and repositories as on the phone.
 */
const STORE = 'files';

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wardrobe-ai', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readFile(name: string): Promise<Uint8Array | undefined> {
  const store = await openStore();
  return new Promise((resolve, reject) => {
    const request = store.transaction(STORE).objectStore(STORE).get(name);
    request.onsuccess = () => resolve(request.result as Uint8Array | undefined);
    request.onerror = () => reject(request.error);
  });
}

async function writeFile(name: string, bytes: Uint8Array): Promise<void> {
  const store = await openStore();
  return new Promise((resolve, reject) => {
    const transaction = store.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(bytes, name);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function toParams(params: unknown[]): SqlJsValue[] {
  const flat = params.length === 1 && Array.isArray(params[0]) ? (params[0] as unknown[]) : params;
  return flat as SqlJsValue[];
}

function selectAll<T>(raw: SqlJsDatabase, source: string, params: unknown[]): T[] {
  const statement = raw.prepare(source, toParams(params));
  const rows: T[] = [];
  try {
    while (statement.step()) rows.push(statement.getAsObject() as T);
  } finally {
    statement.free();
  }
  return rows;
}

export async function openSqlite(name: string): Promise<Database> {
  const SQL = await initSqlJs();
  const raw = new SQL.Database(await readFile(name).catch(() => undefined));
  raw.exec('PRAGMA foreign_keys = ON;');

  let inTransaction = false;
  const persist = async (): Promise<void> => {
    if (inTransaction) return;
    // Private windows and sandboxed frames can refuse IndexedDB; the session then stays in memory.
    await writeFile(name, raw.export()).catch(() => undefined);
  };

  const db = {
    async execAsync(source: string): Promise<void> {
      raw.exec(source);
      await persist();
    },
    async runAsync(source: string, ...params: unknown[]) {
      raw.run(source, toParams(params));
      const lastInsertRowId = Number(raw.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] ?? 0);
      const changes = raw.getRowsModified();
      await persist();
      return { lastInsertRowId, changes };
    },
    async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
      return selectAll<T>(raw, source, params);
    },
    async getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null> {
      return selectAll<T>(raw, source, params)[0] ?? null;
    },
    async withTransactionAsync(task: () => Promise<void>): Promise<void> {
      raw.exec('BEGIN');
      inTransaction = true;
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      } finally {
        inTransaction = false;
      }
      await persist();
    },
  };
  return db as unknown as Database;
}
