import * as SecureStore from 'expo-secure-store';
import { isProductionBuild } from '@/config/env';

const BYOK_KEY = 'anthropic_api_key';

/** Developer BYOK key, kept in the OS keychain. Production builds never read it. */
export async function loadByokKey(): Promise<string | undefined> {
  if (isProductionBuild) return undefined;
  return (await SecureStore.getItemAsync(BYOK_KEY)) ?? undefined;
}

export async function saveByokKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(BYOK_KEY, key.trim());
}

export async function clearByokKey(): Promise<void> {
  await SecureStore.deleteItemAsync(BYOK_KEY);
}
