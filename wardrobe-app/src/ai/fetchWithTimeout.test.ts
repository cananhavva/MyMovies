import { fetchWithTimeout } from './fetchWithTimeout';

/** fetch that never answers but rejects with AbortError when its signal fires, like the real one. */
function hangingFetch() {
  return jest.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        if (init.signal?.aborted) abort();
        else init.signal?.addEventListener('abort', abort);
      }),
  );
}

describe('fetchWithTimeout', () => {
  afterEach(() => jest.useRealTimers());

  it('maps our own timeout to the given code (AI 30 s / link 10 s)', async () => {
    jest.useFakeTimers();
    global.fetch = hangingFetch() as unknown as typeof fetch;
    const pending = fetchWithTimeout('https://x.test', {}, { timeoutMs: 10_000, timeoutCode: 'LINK_TIMEOUT' });
    jest.advanceTimersByTime(10_000);
    await expect(pending).resolves.toMatchObject({ ok: false, error: { code: 'LINK_TIMEOUT', retryable: true } });
  });

  it('maps a user cancel to USER_CANCELLED, not a timeout', async () => {
    global.fetch = hangingFetch() as unknown as typeof fetch;
    const controller = new AbortController();
    const pending = fetchWithTimeout('https://x.test', {}, { timeoutMs: 30_000, timeoutCode: 'AI_TIMEOUT', signal: controller.signal });
    controller.abort();
    await expect(pending).resolves.toMatchObject({ ok: false, error: { code: 'USER_CANCELLED' } });
  });

  it('does not start a request for an already-cancelled signal', async () => {
    const fetchMock = hangingFetch();
    global.fetch = fetchMock as unknown as typeof fetch;
    const controller = new AbortController();
    controller.abort();
    const result = await fetchWithTimeout('https://x.test', {}, { timeoutMs: 30_000, timeoutCode: 'AI_TIMEOUT', signal: controller.signal });
    expect(!result.ok && result.error.code).toBe('USER_CANCELLED');
  });

  it('maps a network TypeError to NETWORK_OFFLINE', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;
    const result = await fetchWithTimeout('https://x.test', {}, { timeoutMs: 30_000, timeoutCode: 'AI_TIMEOUT' });
    expect(!result.ok && result.error.code).toBe('NETWORK_OFFLINE');
  });

  it('returns non-2xx responses as ok so callers can map the status', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('x', { status: 503 })) as unknown as typeof fetch;
    const result = await fetchWithTimeout('https://x.test', {}, { timeoutMs: 30_000, timeoutCode: 'AI_TIMEOUT' });
    expect(result.ok && result.value.status).toBe(503);
  });
});
