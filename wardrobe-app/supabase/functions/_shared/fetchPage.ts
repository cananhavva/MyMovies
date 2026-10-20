import { HttpError } from './http.ts';
import { extractProductPage, looksBlocked, type ProductPageData } from './extractProductPage.ts';

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 3 * 1024 * 1024;
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/**
 * SSRF guard: only public http(s) hosts; no IP literals in private ranges, no localhost or
 * internal names. Host names are not resolved here, so a public name that points at a private
 * address is not caught by this check.
 */
export function assertPublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError('LINK_INVALID');
  }
  // A trailing dot ("localhost.") is the same host to DNS, so strip it before comparing.
  const host = url.hostname.toLowerCase().replace(/\.+$/, '');
  const isPrivateIp =
    /^(10|127|0)\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host) ||
    host.startsWith('[');
  const isInternalName =
    host === '' ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal');
  if (!['http:', 'https:'].includes(url.protocol) || isInternalName || isPrivateIp) {
    throw new HttpError('LINK_INVALID');
  }
  return url;
}

function errorForStatus(status: number): HttpError | undefined {
  if (status === 404 || status === 410) return new HttpError('LINK_NOT_FOUND');
  if (status >= 400) return new HttpError('LINK_FETCH_BLOCKED');
  return undefined;
}

async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel();
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk.subarray(0, Math.min(chunk.length, size - offset)), offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

/** Fetches a product page (following redirects manually so every hop passes the SSRF guard). */
export async function fetchProductPage(rawUrl: string): Promise<ProductPageData> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let url = assertPublicUrl(rawUrl);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const response = await fetch(url, {
        redirect: 'manual',
        signal,
        headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml', 'accept-language': 'tr-TR,tr;q=0.9,en;q=0.8' },
      });
      const location = response.headers.get('location');
      if (response.status >= 300 && response.status < 400 && location) {
        url = assertPublicUrl(new URL(location, url).toString());
        continue;
      }
      const statusError = errorForStatus(response.status);
      if (statusError) throw statusError;
      const html = await readCapped(response);
      const data = extractProductPage(html);
      if (looksBlocked(html, data)) throw new HttpError('LINK_FETCH_BLOCKED');
      return data;
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new HttpError('LINK_TIMEOUT');
    }
    throw new HttpError('LINK_FETCH_BLOCKED');
  }
  throw new HttpError('LINK_FETCH_BLOCKED');
}
