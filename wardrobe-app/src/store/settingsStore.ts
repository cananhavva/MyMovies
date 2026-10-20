import { create } from 'zustand';
import { dbCall } from '@/data/database';
import { getRepositories } from '@/data/openDatabase';
import type { Occasion, Result } from '@/domain/types';
import { OCCASIONS, includesValue } from '@/domain/taxonomy';
import { newId } from '@/services/ids';

interface SettingsState {
  loaded: boolean;
  aiConsentGranted: boolean;
  frequentOccasions: Occasion[];
  deviceId?: string;
  load: () => Promise<Result<void>>;
  setAiConsent: (granted: boolean) => Promise<Result<void>>;
  setFrequentOccasions: (occasions: Occasion[]) => Promise<Result<void>>;
  getDeviceId: () => Promise<string>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  loaded: false,
  aiConsentGranted: false,
  frequentOccasions: [],

  load: () =>
    dbCall(async () => {
      const settings = await getRepositories().settings.load();
      set({
        loaded: true,
        aiConsentGranted: settings.aiConsentGranted,
        frequentOccasions: settings.frequentOccasions.filter((o): o is Occasion => includesValue(OCCASIONS, o)),
        deviceId: settings.deviceId,
      });
    }),

  setAiConsent: (granted) =>
    dbCall(async () => {
      await getRepositories().settings.setAiConsent(granted);
      set({ aiConsentGranted: granted });
    }),

  setFrequentOccasions: (occasions) =>
    dbCall(async () => {
      await getRepositories().settings.setFrequentOccasions(occasions);
      set({ frequentOccasions: occasions });
    }),

  /** Anonymous, random per-install id used only for the proxy's daily quota. */
  getDeviceId: async () => {
    const existing = get().deviceId;
    if (existing) return existing;
    const deviceId = newId();
    await getRepositories().settings.setDeviceId(deviceId);
    set({ deviceId });
    return deviceId;
  },
}));
