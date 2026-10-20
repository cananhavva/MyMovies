import { HttpError } from './http.ts';
import type { EncodedImage } from './validation.ts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
const MODELS = { fast: 'claude-sonnet-5-5', deep: 'claude-opus-5-5' } as const;
const MAX_OUTPUT_TOKENS = 4096;
const TIMEOUT_MS = 30_000;
/** Plan §4: timeout → one retry after 2 s; overloaded/5xx → retries after 2 s and 6 s. */
const RETRY_DELAYS: Readonly<Partial<Record<string, readonly number[]>>> = {
  AI_TIMEOUT: [2_000],
  AI_OVERLOADED: [2_000, 6_000],
  SERVER_5XX: [2_000, 6_000],
};

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

export interface ClaudeJsonRequest {
  tier: keyof typeof MODELS;
  effort: 'low' | 'medium' | 'high';
  system: string;
  images?: EncodedImage[];
  text: string;
  schema: Record<string, unknown>;
}

export function imageBlocks(images: readonly EncodedImage[]): ContentBlock[] {
  return images.map((image) => ({
    type: 'image',
    source: { type: 'base64', media_type: image.mediaType, data: image.base64 },
  }));
}

function apiKey(): string {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new HttpError('AI_AUTH');
  return key;
}

function errorForStatus(status: number, retryAfter: string | null): HttpError {
  if (status === 401 || status === 403) return new HttpError('AI_AUTH');
  if (status === 429) return new HttpError('AI_RATE_LIMITED', Number(retryAfter) || undefined);
  if (status === 529) return new HttpError('AI_OVERLOADED');
  if (status === 408 || status === 504) return new HttpError('AI_TIMEOUT');
  if (status >= 500) return new HttpError('SERVER_5XX');
  return new HttpError('UNKNOWN');
}

interface MessageBody {
  content?: { type: string; text?: string }[];
  stop_reason?: string | null;
}

async function callOnce(request: ClaudeJsonRequest): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey(),
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': FALLBACK_BETA,
      },
      body: JSON.stringify({
        model: MODELS[request.tier],
        max_tokens: MAX_OUTPUT_TOKENS,
        system: request.system,
        messages: [{ role: 'user', content: [...imageBlocks(request.images ?? []), { type: 'text', text: request.text }] }],
        output_config: { effort: request.effort, format: { type: 'json_schema', schema: request.schema } },
        fallbacks: 'default',
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new HttpError('AI_TIMEOUT');
    }
    throw new HttpError('SERVER_5XX');
  }
  if (!response.ok) throw errorForStatus(response.status, response.headers.get('retry-after'));

  const body = (await response.json()) as MessageBody;
  if (body.stop_reason === 'refusal' || body.stop_reason === 'max_tokens') throw new HttpError('AI_INVALID_RESPONSE');
  const text = (body.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError('AI_INVALID_RESPONSE');
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Calls Claude with a JSON-schema constrained answer, retrying per the plan's error table. */
export async function callClaudeJson(request: ClaudeJsonRequest): Promise<unknown> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await callOnce(request);
    } catch (error) {
      const delay = error instanceof HttpError ? RETRY_DELAYS[error.code]?.[attempt] : undefined;
      if (delay === undefined) throw error;
      await sleep(delay);
    }
  }
}
