import { useEffect, useState } from 'react';
import { initRepositories } from '@/data/openDatabase';
import type { AppError } from '@/errors/AppError';
import { appError } from '@/errors/AppError';
import { useGapStore } from '@/store/gapStore';
import { useInspirationStore } from '@/store/inspirationStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useWardrobeStore } from '@/store/wardrobeStore';

export type BootState = { status: 'loading' } | { status: 'ready' } | { status: 'failed'; error: AppError };

/** Opens the database, runs migrations and loads every store once at start-up. */
export function useAppBootstrap(): BootState {
  const [state, setState] = useState<BootState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initRepositories();
      } catch (error) {
        if (!cancelled) setState({ status: 'failed', error: appError('DB_ERROR', { cause: error }) });
        return;
      }
      const results = await Promise.all([
        useSettingsStore.getState().load(),
        useWardrobeStore.getState().load(),
        useInspirationStore.getState().load(),
        useGapStore.getState().load(),
      ]);
      const failure = results.find((r) => !r.ok);
      if (cancelled) return;
      setState(failure && !failure.ok ? { status: 'failed', error: failure.error } : { status: 'ready' });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
