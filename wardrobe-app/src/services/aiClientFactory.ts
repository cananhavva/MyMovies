import type { AiClient } from '@/ai/AiClient';
import { DirectAiClient } from '@/ai/DirectAiClient';
import { MockAiClient } from '@/ai/MockAiClient';
import { ProxyAiClient } from '@/ai/ProxyAiClient';
import { ENV, isProductionBuild, isProxyConfigured } from '@/config/env';
import { loadByokKey } from './apiKeyStore';
import { readImageBase64 } from './imageStorage';
import { fetchProductPage } from './productPage/fetchProductPage';

/**
 * Picks the AI backend: developer BYOK key (non-production only) → Supabase proxy → offline mock.
 * Production without a proxy still falls back to the mock so the app never crashes; the settings
 * screen shows which backend is active.
 */
export async function createAiClient(getDeviceId: () => Promise<string>): Promise<AiClient> {
  const byokKey = isProductionBuild ? undefined : await loadByokKey();
  if (byokKey) return new DirectAiClient({ apiKey: byokKey, readImage: readImageBase64, fetchProductPage });
  if (isProxyConfigured()) {
    return new ProxyAiClient({
      functionsBaseUrl: ENV.supabaseUrl,
      anonKey: ENV.supabaseAnonKey,
      getDeviceId,
      readImage: readImageBase64,
    });
  }
  return new MockAiClient();
}
