import type { Result } from '@/domain/types';
import { fail, ok } from '@/errors/result';

const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:']);

/**
 * Accepts what users typically paste ("zara.com/tr/…", "https://…", text with a URL in it) and
 * returns a canonical absolute http(s) URL, or LINK_INVALID.
 */
export function validateUrl(input: string): Result<string> {
  const candidate = extractFirstUrlLike(input.trim());
  if (!candidate) return fail('LINK_INVALID');
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(candidate) ? candidate : `https://${candidate}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return fail('LINK_INVALID');
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol) || !url.hostname.includes('.')) return fail('LINK_INVALID');
  return ok(url.toString());
}

function extractFirstUrlLike(text: string): string | undefined {
  if (text === '') return undefined;
  const explicit = text.match(/[a-z][a-z0-9+.-]*:\/\/\S+/i)?.[0];
  if (explicit) return stripTrailingPunctuation(explicit);
  const bare = text.split(/\s+/).map(stripTrailingPunctuation);
  return bare.find((token) => /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(token));
}

/** Shared text often ends a sentence or bracket right after the link: "(https://…/x)." */
function stripTrailingPunctuation(token: string): string {
  let result = token.replace(/[.,;:!?'"»”’]+$/u, '');
  while (/[)\]]$/.test(result)) {
    const close = result.slice(-1);
    const open = close === ')' ? '(' : '[';
    if (result.split(open).length >= result.split(close).length) break;
    result = result.slice(0, -1).replace(/[.,;:!?'"»”’]+$/u, '');
  }
  return result;
}

export function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return undefined;
  }
}
