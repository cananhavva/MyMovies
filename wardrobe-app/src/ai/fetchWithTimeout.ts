import type { Result } from '@/domain/types';
import type { ErrorCode } from '@/errors/AppError';
import { err, ok } from '@/errors/result';
import { toAppError } from '@/errors/toAppError';

/**
 * fetch() bounded by a timeout and an optional caller signal (user cancel). The two aborts are
 * told apart so a timeout maps to `timeoutCode` and a cancel to USER_CANCELLED.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  options: { timeoutMs: number; timeoutCode: ErrorCode; signal?: AbortSignal },
): Promise<Result<Response>> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs);
  const forwardAbort = () => controller.abort();
  options.signal?.addEventListener('abort', forwardAbort);

  try {
    if (options.signal?.aborted) controller.abort();
    return ok(await fetch(url, { ...init, signal: controller.signal }));
  } catch (error) {
    return err(toAppError(error, { timedOut, timeoutCode: options.timeoutCode }));
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', forwardAbort);
  }
}
