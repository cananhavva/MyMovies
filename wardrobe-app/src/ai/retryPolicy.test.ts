import type { Result } from '@/domain/types';
import { appError, type ErrorCode } from '@/errors/AppError';
import { sleep, withRetry } from './retryPolicy';

function sequence(codes: (ErrorCode | 'ok')[]) {
  let call = 0;
  return jest.fn(async (): Promise<Result<string>> => {
    const code = codes[Math.min(call, codes.length - 1)] ?? 'ok';
    call += 1;
    return code === 'ok' ? { ok: true, value: 'done' } : { ok: false, error: appError(code) };
  });
}

describe('withRetry', () => {
  const wait = jest.fn(async (_ms: number) => undefined);
  beforeEach(() => wait.mockClear());

  it('retries a timeout once after 2 s', async () => {
    const attempt = sequence(['AI_TIMEOUT', 'AI_TIMEOUT', 'ok']);
    const result = await withRetry(attempt, { wait });
    expect(result.ok).toBe(false);
    expect(attempt).toHaveBeenCalledTimes(2);
    expect(wait.mock.calls.map((c) => c[0])).toEqual([2000]);
  });

  it('retries overload twice with 2 s and 6 s delays', async () => {
    const attempt = sequence(['AI_OVERLOADED', 'SERVER_5XX', 'ok']);
    const result = await withRetry(attempt, { wait });
    expect(result).toEqual({ ok: true, value: 'done' });
    expect(wait.mock.calls.map((c) => c[0])).toEqual([2000, 6000]);
  });

  it('does not retry other errors', async () => {
    const attempt = sequence(['AI_AUTH']);
    await withRetry(attempt, { wait });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('stops when the caller aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const attempt = sequence(['AI_TIMEOUT', 'ok']);
    await withRetry(attempt, { wait, signal: controller.signal });
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});

describe('withRetry – more cases', () => {
  const wait = jest.fn(async (_ms: number) => undefined);
  beforeEach(() => wait.mockClear());

  it('gives up after two overload retries (3 attempts in total)', async () => {
    const attempt = sequence(['SERVER_5XX', 'SERVER_5XX', 'SERVER_5XX', 'ok']);
    const result = await withRetry(attempt, { wait });
    expect(!result.ok && result.error.code).toBe('SERVER_5XX');
    expect(attempt).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls.map((c) => c[0])).toEqual([2000, 6000]);
  });

  it('does not retry the first attempt when it succeeds', async () => {
    const attempt = sequence(['ok']);
    await withRetry(attempt, { wait });
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });

  it.each(['AI_RATE_LIMITED', 'AI_INVALID_RESPONSE', 'NETWORK_OFFLINE', 'USER_CANCELLED', 'AI_NOT_GARMENT'] as const)('never retries %s', async (code) => {
    const attempt = sequence([code, 'ok']);
    await withRetry(attempt, { wait });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('shares one retry counter across codes, so a timeout after an overload retry is final', async () => {
    const attempt = sequence(['AI_OVERLOADED', 'AI_TIMEOUT', 'ok']);
    const result = await withRetry(attempt, { wait });
    expect(result.ok).toBe(false);
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  // Regression: a cancel during the back-off made withRetry reject instead of returning a Result.
  it('returns USER_CANCELLED (not a rejection) when the user cancels during the real back-off', async () => {
    jest.useFakeTimers();
    try {
      const controller = new AbortController();
      const attempt = sequence(['AI_OVERLOADED', 'ok']);
      const pending = withRetry(attempt, { signal: controller.signal });
      await Promise.resolve();
      controller.abort();
      await expect(pending).resolves.toMatchObject({ ok: false, error: { code: 'USER_CANCELLED' } });
      expect(attempt).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not call the model again when the signal was aborted by a wait that resolves', async () => {
    const controller = new AbortController();
    const attempt = sequence(['AI_TIMEOUT', 'ok']);
    const abortingWait = jest.fn(async () => {
      controller.abort();
    });
    const result = await withRetry(attempt, { wait: abortingWait, signal: controller.signal });
    expect(!result.ok && result.error.code).toBe('USER_CANCELLED');
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});

describe('sleep', () => {
  it('rejects immediately for an aborted signal', async () => {
    const controller = new AbortController();
    controller.abort(new Error('stop'));
    await expect(sleep(10_000, controller.signal)).rejects.toThrow('stop');
  });

  it('rejects when aborted while waiting', async () => {
    const controller = new AbortController();
    const pending = sleep(10_000, controller.signal);
    controller.abort(new Error('cancelled'));
    await expect(pending).rejects.toThrow('cancelled');
  });
});
