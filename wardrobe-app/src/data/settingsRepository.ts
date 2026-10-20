import { fromJson, type Database } from './database';

export interface AppSettings {
  aiConsentGranted: boolean;
  frequentOccasions: string[];
  deviceId?: string;
}

const KEYS = {
  aiConsent: 'ai_consent',
  frequentOccasions: 'frequent_occasions',
  deviceId: 'device_id',
} as const;

export function createSettingsRepository(db: Database) {
  async function get(key: string): Promise<string | undefined> {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?;', [key]);
    return row?.value;
  }

  async function set(key: string, value: string): Promise<void> {
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);', [key, value]);
  }

  return {
    async load(): Promise<AppSettings> {
      return {
        aiConsentGranted: (await get(KEYS.aiConsent)) === 'granted',
        frequentOccasions: fromJson(await get(KEYS.frequentOccasions) ?? null, []),
        deviceId: await get(KEYS.deviceId),
      };
    },
    setAiConsent: (granted: boolean) => set(KEYS.aiConsent, granted ? 'granted' : 'denied'),
    setFrequentOccasions: (occasions: readonly string[]) => set(KEYS.frequentOccasions, JSON.stringify(occasions)),
    setDeviceId: (deviceId: string) => set(KEYS.deviceId, deviceId),
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
