import { create } from 'zustand';
import { dbCall } from '@/data/database';
import { getRepositories } from '@/data/openDatabase';
import { seasonForDate } from '@/domain/taxonomy';
import type { CapsulePlan, GapStatus, GapSuggestion, Garment, InspirationLook, Occasion, Result } from '@/domain/types';
import { buildCapsulePlan } from '@/rules/capsule';
import { analyzeGaps } from '@/rules/gapAnalysis';
import { newId } from '@/services/ids';

interface RecomputeInput {
  garments: readonly Garment[];
  looks: readonly InspirationLook[];
  frequentOccasions: readonly Occasion[];
}

interface GapState {
  loaded: boolean;
  all: GapSuggestion[];
  visible: GapSuggestion[];
  capsule?: CapsulePlan;
  load: () => Promise<Result<void>>;
  /** Pure local recomputation (no AI) – runs after every wardrobe or inspiration change. */
  recompute: (input: RecomputeInput) => Promise<Result<void>>;
  setStatus: (key: string, status: GapStatus) => Promise<Result<void>>;
  saveNarrative: (narrative: string) => Promise<Result<void>>;
  clear: () => void;
}

/** Remembered so a status change can refresh the ranking without the caller re-supplying data. */
let lastRecomputeInput: RecomputeInput | undefined;

export const useGapStore = create<GapState>((set, get) => ({
  loaded: false,
  all: [],
  visible: [],

  load: () =>
    dbCall(async () => {
      const repo = getRepositories().gaps;
      set({ all: await repo.listSuggestions(), capsule: await repo.latestCapsulePlan(), loaded: true });
    }),

  recompute: (input) =>
    dbCall(async () => {
      lastRecomputeInput = input;
      const now = new Date();
      const { all, visible } = analyzeGaps({ ...input, previous: get().all, now });
      const previousCapsule = get().capsule;
      const plan = buildCapsulePlan({ id: previousCapsule?.id ?? newId(), garments: input.garments, season: seasonForDate(now), now });
      const capsule: CapsulePlan = { ...plan, narrative: previousCapsule?.narrative };
      const repo = getRepositories().gaps;
      await repo.replaceSuggestions(all);
      await repo.saveCapsulePlan(capsule);
      set({ all, visible, capsule });
    }),

  setStatus: async (key, status) => {
    const statusChangedAt = new Date().toISOString();
    const update = (s: GapSuggestion): GapSuggestion => (s.key === key ? { ...s, status, statusChangedAt } : s);
    const all = get().all.map(update);
    const stillVisible = status === 'open' || status === 'planned';
    set({ all, visible: get().visible.filter((s) => s.key !== key || stillVisible).map(update) });
    const saved = await dbCall(() => getRepositories().gaps.replaceSuggestions(all));
    return saved.ok && lastRecomputeInput ? get().recompute(lastRecomputeInput) : saved;
  },

  saveNarrative: (narrative) =>
    dbCall(async () => {
      const capsule = get().capsule;
      if (!capsule) return;
      const updated = { ...capsule, narrative };
      await getRepositories().gaps.saveCapsulePlan(updated);
      set({ capsule: updated });
    }),

  clear: () => set({ all: [], visible: [], capsule: undefined }),
}));
