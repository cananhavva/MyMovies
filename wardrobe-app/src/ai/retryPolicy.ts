import { RETRY_DELAYS_MS } from '@/config/ai';
import type { Result } from '@/domain/types';
import type { ErrorCode } from '@/errors/AppError';
import { fail } from '@/errors/result';

type RetrySchedule = Readonly<Partial<Record<ErrorCode, readonly number[]>>>;

export type Sleep = (ms: number, signal?: AbortSignal) => Promise<void>;

export const sleep: Sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

/**
 * Runs `attempt` and retries per the plan's error table (timeout: once after 2 s; overloaded/5xx:
 * after 2 s and 6 s). Other errors are returned immediately.
 */
export async function withRetry<T>(
  attempt: () => Promise<Result<T>>,
  options: { signal?: AbortSignal; schedule?: RetrySchedule; wait?: Sleep } = {},
): Promise<Result<T>> {
  const { signal, wait = sleep } = options;
  const schedule: RetrySchedule = options.schedule ?? RETRY_DELAYS_MS;
  let result = await attempt();
  let retryIndex = 0;
  while (!result.ok) {
    const delay = schedule[result.error.code]?.[retryIndex];
    if (delay === undefined || signal?.aborted) return result;
    try {
      await wait(delay, signal);
    } catch {
      // `sleep` rejects when the user cancels during the back-off; callers expect a Result.
      return fail('USER_CANCELLED');
    }
    if (signal?.aborted) return fail('USER_CANCELLED');
    retryIndex += 1;
    result = await attempt();
  }
  return result;
}
