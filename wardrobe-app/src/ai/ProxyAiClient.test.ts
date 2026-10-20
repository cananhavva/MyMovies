import { ProxyAiClient } from './ProxyAiClient';

function makeClient() {
  return new ProxyAiClient({
    functionsBaseUrl: 'https://proj.supabase.co',
    anonKey: 'anon',
    getDeviceId: async () => '6f1c1d2e-0000-4000-8000-000000000001',
    readImage: async () => ({ ok: true, value: { base64: 'AAAA', mediaType: 'image/jpeg' } }),
  });
}

describe('ProxyAiClient', () => {
  const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('calls the edge function with the anon key and device id, never an Anthropic key', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { narrative: 'Plan' } }), { status: 200 }),
    );
    const result = await makeClient().gapPlan({ language: 'tr', wardrobeCounts: {}, frequentOccasions: [], gaps: [] });
    expect(result).toEqual({ ok: true, value: { narrative: 'Plan' } });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://proj.supabase.co/functions/v1/gap-plan');
    const headers = init?.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer anon');
    expect(headers['x-device-id']).toBe('6f1c1d2e-0000-4000-8000-000000000001');
    expect(headers['x-api-key']).toBeUndefined();
  });

  it('uses the error code sent by the proxy', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'AI_RATE_LIMITED', retryAfterSec: 3600 } }), { status: 429 }),
    );
    const result = await makeClient().analyzeGarment({ imageUri: 'file:///a.jpg' });
    expect(!result.ok && result.error).toMatchObject({ code: 'AI_RATE_LIMITED', retryAfterSec: 3600 });
  });

  it('maps a network failure to NETWORK_OFFLINE', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const result = await makeClient().analyzeProductPage({ url: 'https://shop.example.com/x' });
    expect(!result.ok && result.error.code).toBe('NETWORK_OFFLINE');
  });

  it('rejects a malformed success payload', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: { hasOutfit: 'yes' } }), { status: 200 }));
    const result = await makeClient().analyzeInspiration({ imageUris: ['file:///a.jpg'] });
    expect(!result.ok && result.error.code).toBe('AI_INVALID_RESPONSE');
  });
  // Regression: gateway errors without a JSON body used to all become SERVER_5XX.
  it.each`
    status | body                           | retryAfter | code
    ${401} | ${'Unauthorized'}              | ${null}    | ${'AI_AUTH'}
    ${403} | ${'<html>Forbidden</html>'}    | ${null}    | ${'AI_AUTH'}
    ${429} | ${'Too Many Requests'}         | ${'30'}    | ${'AI_RATE_LIMITED'}
    ${502} | ${'<html>Bad gateway</html>'}  | ${null}    | ${'SERVER_5XX'}
    ${504} | ${'Gateway Timeout'}           | ${null}    | ${'AI_TIMEOUT'}
    ${529} | ${'overloaded'}                | ${null}    | ${'AI_OVERLOADED'}
  `('maps a non-JSON $status body to $code', async ({ status, body, retryAfter, code }) => {
    const headers = retryAfter ? { 'retry-after': retryAfter } : undefined;
    fetchMock.mockResolvedValueOnce(new Response(body, { status, headers }));
    const result = await makeClient().gapPlan({ language: 'en', wardrobeCounts: {}, frequentOccasions: [], gaps: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(code);
      if (code === 'AI_RATE_LIMITED') expect(result.error.retryAfterSec).toBe(30);
    }
  });

  it('does not crash on a JSON null error body', async () => {
    fetchMock.mockResolvedValueOnce(new Response('null', { status: 500 }));
    const result = await makeClient().gapPlan({ language: 'en', wardrobeCounts: {}, frequentOccasions: [], gaps: [] });
    expect(!result.ok && result.error.code).toBe('SERVER_5XX');
  });

  it('ignores unknown error codes from the proxy and falls back to the status', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'TEAPOT' } }), { status: 503 }));
    const result = await makeClient().gapPlan({ language: 'en', wardrobeCounts: {}, frequentOccasions: [], gaps: [] });
    expect(!result.ok && result.error.code).toBe('SERVER_5XX');
  });

  it('returns AI_INVALID_RESPONSE for a non-JSON 200 body', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>captive portal</html>', { status: 200 }));
    const result = await makeClient().gapPlan({ language: 'en', wardrobeCounts: {}, frequentOccasions: [], gaps: [] });
    expect(!result.ok && result.error.code).toBe('AI_INVALID_RESPONSE');
  });

  it('maps a not-a-garment answer to AI_NOT_GARMENT', async () => {
    const data = { name: 'Cat', category: 'accessory', colors: [], seasons: [], weather: [], occasions: [], confidence: 0.9, isGarment: false };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data }), { status: 200 }));
    const result = await makeClient().analyzeGarment({ text: 'a cat' });
    expect(!result.ok && result.error.code).toBe('AI_NOT_GARMENT');
  });

  it('maps an outfit-less inspiration answer to INSPIRATION_NO_OUTFIT', async () => {
    const data = { hasOutfit: false, items: [], occasions: [], seasons: [] };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data }), { status: 200 }));
    const result = await makeClient().analyzeInspiration({ imageUris: ['file:///a.jpg'] });
    expect(!result.ok && result.error.code).toBe('INSPIRATION_NO_OUTFIT');
  });

  it('maps a user abort to USER_CANCELLED', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          // Like real fetch: reject at once for an already-aborted signal, otherwise on abort.
          const abort = () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          if (init.signal?.aborted) abort();
          else init.signal?.addEventListener('abort', abort);
        }),
    );
    const pending = makeClient().gapPlan({ language: 'en', wardrobeCounts: {}, frequentOccasions: [], gaps: [] }, { signal: controller.signal });
    controller.abort();
    const result = await pending;
    expect(!result.ok && result.error.code).toBe('USER_CANCELLED');
  });
});
