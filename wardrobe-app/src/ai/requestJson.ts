import type { z } from 'zod';
import type { Result } from '@/domain/types';
import type { ClaudeMessage } from './claudeMessages';
import { parseWithSchema } from './parseJson';
import { REPAIR_INSTRUCTION } from './prompts';

export type SendMessages = (messages: ClaudeMessage[]) => Promise<Result<string>>;

/**
 * Asks for JSON and validates it. On a schema miss we send one repair request (plan §4,
 * AI_INVALID_RESPONSE); if that fails too, the lenient schema keeps whatever fields are valid.
 */
export async function requestJson<T>(params: {
  send: SendMessages;
  messages: ClaudeMessage[];
  schema: z.ZodType<T>;
  lenientSchema?: z.ZodType<T>;
}): Promise<Result<T>> {
  const { send, messages, schema, lenientSchema } = params;
  const first = await send(messages);
  if (!first.ok) return first;
  const parsed = parseWithSchema(first.value, schema);
  if (parsed.ok) return parsed;

  const issues = typeof parsed.error.cause === 'string' ? parsed.error.cause : 'invalid JSON';
  const repaired = await send([
    ...messages,
    { role: 'assistant', content: first.value },
    { role: 'user', content: REPAIR_INSTRUCTION.replace('{issues}', issues) },
  ]);
  if (!repaired.ok) return repaired;
  const reparsed = parseWithSchema(repaired.value, schema);
  if (reparsed.ok || !lenientSchema) return reparsed;

  const salvaged = parseWithSchema(repaired.value, lenientSchema);
  return salvaged.ok ? salvaged : parseWithSchema(first.value, lenientSchema);
}
