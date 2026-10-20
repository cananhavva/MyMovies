import type { ProductPageData } from '@/services/productPage/extractProductPage';
import { DirectAiClient } from './DirectAiClient';

const garmentJson = {
  name: 'Black trench',
  category: 'outerwear',
  subcategory: 'trench_coat',
  colors: ['black'],
  seasons: ['autumn'],
  weather: ['rainy'],
  occasions: ['office'],
  confidence: 0.9,
  isGarment: true,
};

function claudeResponse(text: string, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify({ content: [{ type: 'text', text }], stop_reason: 'end_turn' }), {
    status: init.status ?? 200,
    headers: init.headers,
  });
}

function makeClient(page?: ProductPageData) {
  return new DirectAiClient({
    apiKey: 'test-key',
    readImage: async () => ({ ok: true, value: { base64: 'AAAA', mediaType: 'image/jpeg' } }),
    fetchProductPage: async () => (page ? { ok: true, value: page } : { ok: false, error: { code: 'LINK_FETCH_BLOCKED', retryable: false } }),
  });
}

describe('DirectAiClient', () => {
  const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('sends the image as a base64 block with the required headers', async () => {
    fetchMock.mockResolvedValueOnce(claudeResponse(JSON.stringify(garmentJson)));
    const result = await makeClient().analyzeGarment({ imageUri: 'file:///a.jpg' });
    expect(result.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const headers = init?.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('test-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe('claude-sonnet-5-5');
    expect(body.messages[0].content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } });
  });

  it('cleans ```json fences', async () => {
    fetchMock.mockResolvedValueOnce(claudeResponse('```json\n' + JSON.stringify(garmentJson) + '\n```'));
    const result = await makeClient().analyzeGarment({ text: 'trench' });
    expect(result.ok && result.value.name).toBe('Black trench');
  });

  it('sends one repair request when the answer does not match the schema', async () => {
    fetchMock
      .mockResolvedValueOnce(claudeResponse('{"name": "x"}'))
      .mockResolvedValueOnce(claudeResponse(JSON.stringify(garmentJson)));
    const result = await makeClient().analyzeGarment({ text: 'trench' });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const repairBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(repairBody.messages).toHaveLength(3);
  });

  it('falls back to the lenient schema after a failed repair', async () => {
    fetchMock
      .mockResolvedValueOnce(claudeResponse('{"category": "shoes", "colors": ["white"]}'))
      .mockResolvedValueOnce(claudeResponse('{"category": "shoes", "colors": ["white"]}'));
    const result = await makeClient().analyzeGarment({ text: 'sneaker' });
    expect(result.ok && result.value.category).toBe('shoes');
    expect(result.ok && result.value.confidence).toBeLessThan(0.5);
  });

  it('maps a not-a-garment answer to AI_NOT_GARMENT', async () => {
    fetchMock.mockResolvedValueOnce(claudeResponse(JSON.stringify({ ...garmentJson, isGarment: false, confidence: 0 })));
    const result = await makeClient().analyzeGarment({ imageUri: 'file:///cat.jpg' });
    expect(!result.ok && result.error.code).toBe('AI_NOT_GARMENT');
  });

  it('maps 401 to AI_AUTH without retrying', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));
    const result = await makeClient().analyzeGarment({ text: 'x' });
    expect(!result.ok && result.error.code).toBe('AI_AUTH');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps 429 to AI_RATE_LIMITED with retry-after', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 429, headers: { 'retry-after': '12' } }));
    const result = await makeClient().analyzeGarment({ text: 'x' });
    expect(!result.ok && result.error).toMatchObject({ code: 'AI_RATE_LIMITED', retryAfterSec: 12 });
  });

  it('returns the link error when the page is blocked and nothing else was given', async () => {
    const result = await makeClient().analyzeProductPage({ url: 'https://shop.example.com/p/1' });
    expect(!result.ok && result.error.code).toBe('LINK_FETCH_BLOCKED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('continues with pasted text when the page is blocked', async () => {
    fetchMock.mockResolvedValueOnce(claudeResponse(JSON.stringify({ compositionFound: true, composition: [{ fiber: 'wool', percent: 100 }] })));
    const result = await makeClient().analyzeProductPage({ url: 'https://shop.example.com/p/1', pastedText: '100% wool' });
    expect(result.ok && result.value.composition).toEqual([{ fiber: 'wool', percent: 100 }]);
  });

  it('keeps the og:image of the page when the model omits it', async () => {
    fetchMock.mockResolvedValueOnce(claudeResponse(JSON.stringify({ compositionFound: false })));
    const page: ProductPageData = { title: 'Coat', imageUrl: 'https://cdn.example.com/c.jpg', jsonLdProducts: [], visibleText: 'Coat' };
    const result = await makeClient(page).analyzeProductPage({ url: 'https://shop.example.com/p/1' });
    expect(result.ok && result.value.imageUrl).toBe('https://cdn.example.com/c.jpg');
  });

  it('reports INSPIRATION_NO_OUTFIT when nothing was found', async () => {
    fetchMock.mockResolvedValueOnce(claudeResponse(JSON.stringify({ hasOutfit: false, items: [], occasions: [], seasons: [] })));
    const result = await makeClient().analyzeInspiration({ imageUris: ['file:///1.jpg'] });
    expect(!result.ok && result.error.code).toBe('INSPIRATION_NO_OUTFIT');
  });
});
