import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_INSPIRATION_IMAGES } from '@/config/ai';
import type { ID } from '@/domain/types';
import type { AppError } from '@/errors/AppError';
import { analyzeLook } from '@/services/flows/inspirationFlows';
import { pickImages } from '@/services/imagePicker';
import { useInspirationStore } from '@/store/inspirationStore';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { useAbortableTask } from './useAbortableTask';
import { useFlowContext } from './useFlowContext';

interface LookTarget {
  influencerId?: ID;
  sourceUrl?: string;
}

/** Screenshot → AI → matching → saved look → detail screen. Shared by the Inspiration and profile screens. */
export function useLookImport() {
  const { t } = useTranslation();
  const garments = useWardrobeStore((s) => s.garments);
  const saveLook = useInspirationStore((s) => s.saveLook);
  const flowContext = useFlowContext();
  const task = useAbortableTask();
  const [error, setError] = useState<AppError | undefined>();

  const analyzeImages = async (imageUris: string[], target: LookTarget) => {
    setError(undefined);
    const look = await task.run(t('inspire.analyzingLook'), (signal) =>
      analyzeLook({ imageUris, ...target }, garments, flowContext(signal)),
    );
    if (!look.ok) {
      if (look.error.code !== 'USER_CANCELLED') setError(look.error);
      return;
    }
    const saved = await saveLook(look.value);
    if (saved.ok) router.push(`/inspiration/${saved.value.id}`);
    else setError(saved.error);
  };

  const importScreenshots = async (target: LookTarget) => {
    setError(undefined);
    const picked = await pickImages('gallery', { multiple: true, limit: MAX_INSPIRATION_IMAGES });
    if (picked.ok) await analyzeImages(picked.value.slice(0, MAX_INSPIRATION_IMAGES), target);
    else if (picked.error.code !== 'USER_CANCELLED') setError(picked.error);
  };

  return { analyzeImages, importScreenshots, error, setError, busyMessage: task.busyMessage, run: task.run, cancel: task.cancel };
}
