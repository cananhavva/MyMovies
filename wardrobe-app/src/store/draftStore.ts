import { create } from 'zustand';
import type { ID } from '@/domain/types';
import type { AppError } from '@/errors/AppError';
import { emptyDraft, type GarmentDraft } from '@/services/garmentDraft';

/** Hands the draft from an add flow to the review screen (route params can't carry objects). */
interface DraftState {
  draft: GarmentDraft;
  /** Set when the draft is being edited for an existing garment. */
  editingId?: ID;
  /** A non-blocking notice to show on the review screen (low confidence, offline, no fabric…). */
  notice?: AppError;
  start: (draft: GarmentDraft, options?: { editingId?: ID; notice?: AppError }) => void;
  update: (draft: GarmentDraft) => void;
  reset: () => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  draft: emptyDraft(),
  start: (draft, options = {}) => set({ draft, editingId: options.editingId, notice: options.notice }),
  update: (draft) => set({ draft }),
  reset: () => set({ draft: emptyDraft(), editingId: undefined, notice: undefined }),
}));
