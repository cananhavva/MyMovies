import { create } from 'zustand';
import type { AiClient } from '@/ai/AiClient';
import { createAiClient } from '@/services/aiClientFactory';
import { useSettingsStore } from './settingsStore';

interface AiState {
  client?: AiClient;
  /** Resolves when the user answers the consent sheet. */
  consentRequest?: (granted: boolean) => void;
  getClient: () => Promise<AiClient>;
  /** Call after the BYOK key changes so the next request picks the right backend. */
  resetClient: () => void;
  /** Apple 5.1.2(i): ask before the first time photos/text are sent to the AI provider. */
  ensureConsent: () => Promise<boolean>;
  answerConsent: (granted: boolean) => Promise<void>;
}

export const useAiStore = create<AiState>((set, get) => ({
  getClient: async () => {
    const existing = get().client;
    if (existing) return existing;
    const client = await createAiClient(() => useSettingsStore.getState().getDeviceId());
    set({ client });
    return client;
  },

  resetClient: () => set({ client: undefined }),

  ensureConsent: () => {
    if (useSettingsStore.getState().aiConsentGranted) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => set({ consentRequest: resolve }));
  },

  answerConsent: async (granted) => {
    const resolve = get().consentRequest;
    set({ consentRequest: undefined });
    if (granted) await useSettingsStore.getState().setAiConsent(true);
    resolve?.(granted);
  },
}));
