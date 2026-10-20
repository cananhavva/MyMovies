import { LINK_FETCH_TIMEOUT_MS } from '@/config/ai';
import type { Result } from '@/domain/types';
import { linkErrorForStatus } from '@/ai/httpErrors';
import { fetchWithTimeout } from '@/ai/fetchWithTimeout';
import { err, fail, ok } from '@/errors/result';
import { toAppError } from '@/errors/toAppError';
import { extractProductPage, looksBlocked, type ProductPageData } from './extractProductPage';

/** Used only by the BYOK developer client; production fetches pages on the proxy. */
export async function fetchProductPage(url: string, signal?: AbortSignal): Promise<Result<ProductPageData>> {
  const response = await fetchWithTimeout(
    url,
    { headers: { Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' } },
    { timeoutMs: LINK_FETCH_TIMEOUT_MS, timeoutCode: 'LINK_TIMEOUT', signal },
  );
  if (!response.ok) return response;
  const statusError = linkErrorForStatus(response.value.status);
  if (statusError) return err(statusError);

  let html: string;
  try {
    html = await response.value.text();
  } catch (error) {
    return err(toAppError(error, { timedOut: false }));
  }
  const data = extractProductPage(html);
  return looksBlocked(html, data) ? fail('LINK_FETCH_BLOCKED') : ok(data);
}
