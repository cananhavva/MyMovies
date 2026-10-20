import type { Result } from '@/domain/types';
import { appError, type AppError, type ErrorCode } from './AppError';

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(error: AppError): Result<T> {
  return { ok: false, error };
}

export function fail<T = never>(code: ErrorCode, extras?: Omit<Partial<AppError>, 'code'>): Result<T> {
  return err(appError(code, extras));
}
