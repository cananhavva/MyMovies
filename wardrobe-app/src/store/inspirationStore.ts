import { create } from 'zustand';
import { dbCall } from '@/data/database';
import { getRepositories } from '@/data/openDatabase';
import type { Garment, ID, InfluencerProfile, InspirationLook, Result } from '@/domain/types';
import { ok } from '@/errors/result';
import { matchLookItems } from '@/rules/matching';
import { deleteImages } from '@/services/imageStorage';

interface InspirationState {
  loaded: boolean;
  influencers: InfluencerProfile[];
  looks: InspirationLook[];
  load: () => Promise<Result<void>>;
  saveInfluencer: (profile: InfluencerProfile) => Promise<Result<InfluencerProfile>>;
  removeInfluencer: (id: ID) => Promise<Result<void>>;
  saveLook: (look: InspirationLook) => Promise<Result<InspirationLook>>;
  toggleLike: (id: ID) => Promise<Result<void>>;
  removeLook: (id: ID) => Promise<Result<void>>;
  /** Re-runs matching after the wardrobe changed; persists only looks whose result changed. */
  rematch: (garments: readonly Garment[]) => Promise<Result<void>>;
  clear: () => void;
}

function replaceById<T extends { id: ID }>(list: readonly T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];
}

function sameMatches(a: InspirationLook, b: InspirationLook): boolean {
  return (
    a.recreatability === b.recreatability &&
    a.items.every((item, i) => item.matchScore === b.items[i]?.matchScore && item.matchedGarmentIds.join() === b.items[i]?.matchedGarmentIds.join())
  );
}

export const useInspirationStore = create<InspirationState>((set, get) => ({
  loaded: false,
  influencers: [],
  looks: [],

  load: () =>
    dbCall(async () => {
      const repo = getRepositories().inspiration;
      set({ influencers: await repo.listInfluencers(), looks: await repo.listLooks(), loaded: true });
    }),

  saveInfluencer: (profile) =>
    dbCall(async () => {
      const existing = get().influencers.find((i) => i.profileUrl === profile.profileUrl);
      const toSave = existing ? { ...profile, id: existing.id, createdAt: existing.createdAt } : profile;
      await getRepositories().inspiration.upsertInfluencer(toSave);
      set({ influencers: replaceById(get().influencers, toSave) });
      return toSave;
    }),

  removeInfluencer: (id) =>
    dbCall(async () => {
      await getRepositories().inspiration.removeInfluencer(id);
      set({
        influencers: get().influencers.filter((i) => i.id !== id),
        looks: get().looks.map((l) => (l.influencerId === id ? { ...l, influencerId: undefined } : l)),
      });
    }),

  saveLook: (look) =>
    dbCall(async () => {
      await getRepositories().inspiration.upsertLook(look);
      set({ looks: replaceById(get().looks, look) });
      return look;
    }),

  toggleLike: async (id) => {
    const look = get().looks.find((l) => l.id === id);
    if (!look) return ok(undefined);
    const result = await get().saveLook({ ...look, liked: !look.liked });
    return result.ok ? ok(undefined) : result;
  },

  removeLook: (id) =>
    dbCall(async () => {
      const look = get().looks.find((l) => l.id === id);
      await getRepositories().inspiration.removeLook(id);
      if (look) deleteImages(look.imageUris);
      set({ looks: get().looks.filter((l) => l.id !== id) });
    }),

  rematch: (garments) =>
    dbCall(async () => {
      const updated = get().looks.map((look) => ({ ...look, ...matchLookItems(look.items, garments) }));
      const changed = updated.filter((look, i) => {
        const before = get().looks[i];
        return before === undefined || !sameMatches(before, look);
      });
      for (const look of changed) await getRepositories().inspiration.upsertLook(look);
      if (changed.length > 0) set({ looks: updated });
    }),

  clear: () => set({ influencers: [], looks: [] }),
}));
