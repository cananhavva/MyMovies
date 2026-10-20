// Error codes match the app's ErrorCode union (src/errors/AppError.ts).
export type ProxyErrorCode =
  | 'AI_TIMEOUT'
  | 'AI_INVALID_RESPONSE'
  | 'AI_RATE_LIMITED'
  | 'AI_OVERLOADED'
  | 'SERVER_5XX'
  | 'AI_AUTH'
  | 'LINK_INVALID'
  | 'LINK_FETCH_BLOCKED'
  | 'LINK_NOT_FOUND'
  | 'LINK_TIMEOUT'
  | 'IMAGE_TOO_LARGE'
  | 'IMAGE_UNSUPPORTED'
  | 'UNKNOWN';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STATUS_BY_CODE: Readonly<Record<ProxyErrorCode, number>> = {
  AI_TIMEOUT: 504,
  AI_INVALID_RESPONSE: 502,
  AI_RATE_LIMITED: 429,
  AI_OVERLOADED: 529,
  SERVER_5XX: 502,
  AI_AUTH: 500,
  LINK_INVALID: 400,
  LINK_FETCH_BLOCKED: 422,
  LINK_NOT_FOUND: 422,
  LINK_TIMEOUT: 422,
  IMAGE_TOO_LARGE: 413,
  IMAGE_UNSUPPORTED: 400,
  UNKNOWN: 500,
};

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json', ...headers },
  });
}

export function errorResponse(code: ProxyErrorCode, extras: { retryAfterSec?: number } = {}): Response {
  const headers: Record<string, string> = extras.retryAfterSec ? { 'retry-after': String(extras.retryAfterSec) } : {};
  return jsonResponse({ error: { code, ...extras } }, STATUS_BY_CODE[code], headers);
}

export class HttpError extends Error {
  constructor(readonly code: ProxyErrorCode, readonly retryAfterSec?: number) {
    super(code);
  }
}
