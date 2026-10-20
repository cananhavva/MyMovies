import { CORS_HEADERS, errorResponse, HttpError, jsonResponse } from './http.ts';
import { consumeQuota } from './quota.ts';
import { readJsonBody } from './validation.ts';

type Work = (body: Record<string, unknown>) => Promise<unknown>;

/**
 * Common pipeline for every endpoint: CORS → POST only → per-device daily quota → size-limited
 * JSON body → work → `{ data }` or `{ error: { code } }`. Photos are never stored or logged.
 */
export function serveAiEndpoint(work: Work): void {
  Deno.serve(async (request) => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
    if (request.method !== 'POST') return errorResponse('UNKNOWN');
    try {
      const body = await readJsonBody(request);
      await consumeQuota(request.headers.get('x-device-id'));
      return jsonResponse({ data: await work(body) });
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error.code, { retryAfterSec: error.retryAfterSec });
      console.error('Unhandled proxy error', error instanceof Error ? error.message : 'unknown');
      return errorResponse('UNKNOWN');
    }
  });
}
