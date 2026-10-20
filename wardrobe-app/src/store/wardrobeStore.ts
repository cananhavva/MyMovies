import { create } from 'zustand';
import { dbCall } from '@/data/database';
import { getRepositories } from '@/data/openDatabase';
import type { Garment, ID, Result } from '@/domain/types';
import { ok } from '@/errors/result';
import { deleteImages } from '@/services/imageStorage';
import { EMPTY_FILTER, type WardrobeFilter } from '@/services/wardrobeFilter';
import { UNDO_WINDOW_MS } from './toastStore';

interface WardrobeState {
  loaded: boolean;
  garments: Garment[];
  filter: WardrobeFilter;
  load: () => Promise<Result<void>>;
  save: (garment: Garment) => Promise<Result<Garment>>;
  /** Deletes now; images are removed only after the undo window. */
  remove: (id: ID) => Promise<Result<void>>;
  undoRemove: () => Promise<Result<void>>;
  setFilter: (patch: Partial<WardrobeFilter>) => void;
  resetFilter: () => void;
  clear: () => void;
}

let pendingRemoval: { garment: Garment; timer: ReturnType<typeof setTimeout> } | undefined;

function upsertInList(list: readonly Garment[], garment: Garment): Garment[] {
  const exists = list.some((g) => g.id === garment.id);
  return exists ? list.map((g) => (g.id === garment.id ? garment : g)) : [garment, ...list];
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  loaded: false,
  garments: [],
  filter: EMPTY_FILTER,

  load: () =>
    dbCall(async () => {
      set({ garments: await getRepositories().garments.list(), loaded: true });
    }),

  save: (garment) =>
    dbCall(async () => {
      await getRepositories().garments.upsert(garment);
      set({ garments: upsertInList(get().garments, garment) });
      return garment;
    }),

  remove: async (id) => {
    const garment = get().garments.find((g) => g.id === id);
    if (!garment) return ok(undefined);
    const result = await dbCall(() => getRepositories().garments.remove(id));
    if (!result.ok) return result;
    if (pendingRemoval) {
      clearTimeout(pendingRemoval.timer);
      deleteImages(pendingRemoval.garment.imageUris);
    }
    const timer = setTimeout(() => {
      deleteImages(garment.imageUris);
      pendingRemoval = undefined;
    }, UNDO_WINDOW_MS);
    pendingRemoval = { garment, timer };
    set({ garments: get().garments.filter((g) => g.id !== id) });
    return ok(undefined);
  },

  undoRemove: async () => {
    if (!pendingRemoval) return ok(undefined);
    const { garment, timer } = pendingRemoval;
    clearTimeout(timer);
    pendingRemoval = undefined;
    const result = await get().save(garment);
    return result.ok ? ok(undefined) : result;
  },

  setFilter: (patch) => set({ filter: { ...get().filter, ...patch } }),
  resetFilter: () => set({ filter: EMPTY_FILTER }),
  clear: () => set({ garments: [], filter: EMPTY_FILTER }),
}));
