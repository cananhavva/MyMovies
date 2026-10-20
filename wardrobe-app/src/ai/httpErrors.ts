import { appError, type AppError } from '@/errors/AppError';

/** Parses Retry-After (seconds or HTTP date) into whole seconds. */
export function parseRetryAfter(header: string | null, now: Date = new Date()): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - now.getTime()) / 1000));
}

/** Maps an AI HTTP status (Anthropic or our proxy) to the plan's error codes. */
export function aiErrorForStatus(status: number, retryAfterHeader: string | null = null): AppError {
  if (status === 401 || status === 403) return appError('AI_AUTH');
  if (status === 429) return appError('AI_RATE_LIMITED', { retryAfterSec: parseRetryAfter(retryAfterHeader) });
  if (status === 529) return appError('AI_OVERLOADED');
  if (status === 408 || status === 504) return appError('AI_TIMEOUT');
  if (status >= 500) return appError('SERVER_5XX');
  return appError('UNKNOWN', { cause: `HTTP ${status}` });
}

/** Maps a product page HTTP status to link error codes. */
export function linkErrorForStatus(status: number): AppError | undefined {
  if (status === 404 || status === 410) return appError('LINK_NOT_FOUND');
  if (status === 401 || status === 403 || status === 429 || status === 503) return appError('LINK_FETCH_BLOCKED');
  if (status >= 400) return appError('LINK_FETCH_BLOCKED', { cause: `HTTP ${status}` });
  return undefined;
}
