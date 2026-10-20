import type { z } from 'zod';
import type { Result } from '@/domain/types';
import { fail, ok } from '@/errors/result';

/** Removes Markdown code fences the model sometimes wraps JSON in. */
export function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  return (fenced?.[1] ?? text).trim();
}

/**
 * Returns the first balanced `{…}` block, ignoring braces inside strings, so prose before or
 * after the JSON ("Here is the result: {…} Hope it helps") does not break parsing.
 */
export function extractFirstJsonObject(text: string): string | undefined {
  const start = text.indexOf('{');
  if (start === -1) return undefined;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return undefined;
}

/** Parses model output into a plain JSON value; undefined when no JSON object can be found. */
export function parseJsonLoosely(text: string): unknown {
  const cleaned = stripCodeFences(text);
  for (const candidate of [cleaned, extractFirstJsonObject(cleaned)]) {
    if (candidate === undefined) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next, narrower candidate
    }
  }
  return undefined;
}

export function formatZodIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ');
}

export function parseWithSchema<T>(text: string, schema: z.ZodType<T>): Result<T> {
  const json = parseJsonLoosely(text);
  if (json === undefined) return fail('AI_INVALID_RESPONSE', { cause: 'no JSON object found' });
  const parsed = schema.safeParse(json);
  return parsed.success ? ok(parsed.data) : fail('AI_INVALID_RESPONSE', { cause: formatZodIssues(parsed.error) });
}
