import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BusyOverlay } from '@/components/BusyOverlay';
import { Button } from '@/components/Button';
import { ErrorBanner, useErrorMessage } from '@/components/ErrorBanner';
import { GarmentForm } from '@/components/GarmentForm';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import type { AppError } from '@/errors/AppError';
import { useAbortableTask } from '@/hooks/useAbortableTask';
import { useFlowContext } from '@/hooks/useFlowContext';
import { readLabelComposition } from '@/services/flows/addGarmentFlows';
import { draftToGarment, withComposition } from '@/services/garmentDraft';
import { newId } from '@/services/ids';
import { pickImages } from '@/services/imagePicker';
import { useAiStore } from '@/store/aiStore';
import { useDraftStore } from '@/store/draftStore';
import { useToastStore } from '@/store/toastStore';
import { useWardrobeStore } from '@/store/wardrobeStore';

export default function ReviewScreen() {
  const { t } = useTranslation();
  const { draft, editingId, notice, update, reset } = useDraftStore();
  const existing = useWardrobeStore((s) => s.garments.find((g) => g.id === editingId));
  const save = useWardrobeStore((s) => s.save);
  const showToast = useToastStore((s) => s.show);
  const messageOf = useErrorMessage();
  const flowContext = useFlowContext();
  const { busyMessage, run, cancel } = useAbortableTask();
  const [error, setError] = useState<AppError | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const isDemoSuggestion = useAiStore((s) => s.client?.kind === 'mock') && Object.values(draft.fieldSources).includes('ai');

  const addPhoto = async () => {
    const picked = await pickImages('gallery', { multiple: true });
    if (picked.ok) update({ ...draft, imageUris: [...draft.imageUris, ...picked.value] });
    else if (picked.error.code !== 'USER_CANCELLED') setError(picked.error);
  };

  const readLabel = async () => {
    setError(undefined);
    const picked = await pickImages('camera');
    if (!picked.ok || !picked.value[0]) {
      if (!picked.ok && picked.error.code !== 'USER_CANCELLED') setError(picked.error);
      return;
    }
    const labelUri = picked.value[0];
    const composition = await run(t('common.analyzing'), (signal) => readLabelComposition(labelUri, flowContext(signal)));
    if (composition.ok) update(withComposition(draft, { shell: composition.value, lining: [] }, 'label_photo'));
    else setError(composition.error);
  };

  const submit = async () => {
    if (draft.name.trim() === '') {
      setNameError(t('review.nameRequired'));
      return;
    }
    setNameError(undefined);
    const garment = draftToGarment(draft, { id: editingId ?? newId(), now: new Date(), existing });
    const result = await save(garment);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(draft.pendingAnalysis ? t('add.pendingSaved') : t('common.saved'));
    reset();
    if (editingId) router.back();
    else router.navigate('/');
  };

  return (
    <Screen footer={<Button label={t('review.save')} onPress={() => void submit()} />}>
      {isDemoSuggestion ? <Notice tone="warning" message={t('review.demoSuggestion')} /> : null}
      {notice?.code === 'AI_LOW_CONFIDENCE' ? <Notice tone="warning" message={t('review.lowConfidence')} /> : null}
      {notice && notice.code !== 'AI_LOW_CONFIDENCE' && notice.code !== 'NO_MATERIAL_INFO' ? (
        <Notice message={messageOf(notice)} />
      ) : null}
      {error ? <ErrorBanner error={error} onAction={() => void submit()} supportedActions={['retry']} /> : null}
      <GarmentForm
        draft={draft}
        onChange={update}
        onAddPhoto={() => void addPhoto()}
        onLabelPhoto={() => void readLabel()}
        nameError={nameError}
      />
      <BusyOverlay message={busyMessage} onCancel={cancel} />
    </Screen>
  );
}
