import { AI_MAX_OUTPUT_TOKENS, AI_MODELS, type AiModelTier } from '@/config/ai';
import type { Result } from '@/domain/types';
import { fail, ok } from '@/errors/result';

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp';

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: ImageMediaType; data: string } };

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export type Effort = 'low' | 'medium' | 'high';

export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: ClaudeMessage[];
  output_config: { effort: Effort };
  fallbacks: 'default';
}

export interface ClaudeResponseBody {
  content?: { type: string; text?: string }[];
  stop_reason?: string | null;
}

export function buildClaudeRequest(params: {
  tier: AiModelTier;
  effort: Effort;
  system: string;
  messages: ClaudeMessage[];
}): ClaudeRequest {
  return {
    model: AI_MODELS[params.tier],
    max_tokens: AI_MAX_OUTPUT_TOKENS,
    system: params.system,
    messages: params.messages,
    output_config: { effort: params.effort },
    fallbacks: 'default',
  };
}

export function imageBlock(base64: string, mediaType: ImageMediaType = 'image/jpeg'): ContentBlock {
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };
}

export function textBlock(text: string): ContentBlock {
  return { type: 'text', text };
}

/**
 * Returns the concatenated text of the answer. A refusal or truncated answer is reported as an
 * invalid response, since neither contains usable JSON.
 */
export function readAnswerText(body: ClaudeResponseBody): Result<string> {
  if (body.stop_reason === 'refusal') return fail('AI_INVALID_RESPONSE', { cause: 'refusal', retryable: false });
  const text = (body.content ?? [])
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text ?? '')
    .join('');
  if (text.trim() === '') return fail('AI_INVALID_RESPONSE', { cause: `empty answer (${body.stop_reason ?? 'unknown'})` });
  return ok(text);
}
