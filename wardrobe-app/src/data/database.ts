import type { SQLiteDatabase } from 'expo-sqlite';
import type { Result } from '@/domain/types';
import { err, ok } from '@/errors/result';
import { appError } from '@/errors/AppError';

/** The subset of expo-sqlite the repositories use; lets tests pass an in-memory fake. */
export type Database = Pick<SQLiteDatabase, 'execAsync' | 'runAsync' | 'getAllAsync' | 'getFirstAsync' | 'withTransactionAsync'>;

export type SqlValue = string | number | null;

/** Wraps a repository call so storage failures surface as DB_ERROR instead of crashing the UI. */
export async function dbCall<T>(operation: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await operation());
  } catch (error) {
    return err(appError('DB_ERROR', { cause: error }));
  }
}

export function toJson(value: unknown): string | null {
  return value === undefined ? null : JSON.stringify(value);
}

export function fromJson<T>(text: string | null, fallback: T): T {
  if (text === null || text === '') return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export const toBool = (value: number | null): boolean => value === 1;
export const fromBool = (value: boolean | undefined): number => (value ? 1 : 0);
export const orUndefined = <T>(value: T | null): T | undefined => (value === null ? undefined : value);
