import { useEffect } from 'react';
import { useGapStore } from '@/store/gapStore';
import { useInspirationStore } from '@/store/inspirationStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useWardrobeStore } from '@/store/wardrobeStore';

const DEBOUNCE_MS = 300;

/**
 * Plan §2-E: matches and gap suggestions are recomputed locally (no AI) whenever the wardrobe,
 * the looks or the chosen occasions change.
 */
export function useDerivedDataSync(enabled: boolean): void {
  const garments = useWardrobeStore((s) => s.garments);
  const looks = useInspirationStore((s) => s.looks);
  const frequentOccasions = useSettingsStore((s) => s.frequentOccasions);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      void useInspirationStore.getState().rematch(garments);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled, garments]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      void useGapStore.getState().recompute({ garments, looks, frequentOccasions });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled, garments, looks, frequentOccasions]);
}
