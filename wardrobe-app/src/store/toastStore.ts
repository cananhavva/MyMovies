import { create } from 'zustand';

export const UNDO_WINDOW_MS = 5_000;
const TOAST_DURATION_MS = 3_000;

export interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  message?: string;
  action?: ToastAction;
  show: (message: string, action?: ToastAction) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set) => ({
  show: (message, action) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, action });
    hideTimer = setTimeout(() => set({ message: undefined, action: undefined }), action ? UNDO_WINDOW_MS : TOAST_DURATION_MS);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: undefined, action: undefined });
  },
}));
