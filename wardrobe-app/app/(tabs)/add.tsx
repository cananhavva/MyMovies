import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View, StyleSheet } from 'react-native';
import { BusyOverlay } from '@/components/BusyOverlay';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { spacing } from '@/config/theme';
import { getRepositories } from '@/data/openDatabase';
import type { ID } from '@/domain/types';
import { appError, type AppError } from '@/errors/AppError';
import type { ErrorAction } from '@/errors/errorMessages';
import { useAbortableTask } from '@/hooks/useAbortableTask';
import { useFlowContext } from '@/hooks/useFlowContext';
import { analyzeLink, analyzePhoto, type LinkInput } from '@/services/flows/addGarmentFlows';
import { emptyDraft, type GarmentDraft } from '@/services/garmentDraft';
import { pickImages, type ImageSource } from '@/services/imagePicker';
import { useDraftStore } from '@/store/draftStore';

type Mode = 'photo' | 'link';

interface FailedAttempt {
  error: AppError;
  retry: () => void;
  manualDraft: GarmentDraft;
}

export default function AddScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode | undefined>();
  const [url, setUrl] = useState('');
  const [pastedText, setPastedText] = useState<string | undefined>();
  const [failure, setFailure] = useState<FailedAttempt | undefined>();
  const [duplicate, setDuplicate] = useState<{ existingId: ID } | undefined>();
  const { busyMessage, run, cancel } = useAbortableTask();
  const flowContext = useFlowContext();
  const startDraft = useDraftStore((s) => s.start);

  const openReview = (draft: GarmentDraft, notice?: AppError) => {
    setFailure(undefined);
    setDuplicate(undefined);
    startDraft(draft, { notice });
    router.push('/garment/review');
  };

  const analyzeImages = async (imageUris: string[]) => {
    const result = await run(t('add.analyzingPhoto'), (signal) => analyzePhoto(imageUris, flowContext(signal)));
    if (result.ok) return openReview(result.value.draft, result.value.notice);
    if (result.error.code === 'USER_CANCELLED') return openReview(emptyDraft(imageUris));
    setFailure({
      error: result.error,
      retry: () => void analyzeImages(imageUris),
      manualDraft: { ...emptyDraft(imageUris), pendingAnalysis: result.error.code === 'NETWORK_OFFLINE' },
    });
  };

  const pickAndAnalyze = async (source: ImageSource) => {
    setFailure(undefined);
    const picked = await pickImages(source);
    if (picked.ok) return analyzeImages(picked.value);
    if (picked.error.code !== 'USER_CANCELLED') {
      setFailure({ error: picked.error, retry: () => void pickAndAnalyze(source), manualDraft: emptyDraft() });
    }
  };

  const readLink = async (input: LinkInput, allowDuplicate = false) => {
    setFailure(undefined);
    setDuplicate(undefined);
    const result = await run(t('add.analyzingLink'), (signal) =>
      analyzeLink(input, {
        ...flowContext(signal),
        allowDuplicate,
        findByProductUrl: (productUrl) => getRepositories().garments.findByProductUrl(productUrl),
      }),
    );
    if (result.ok) {
      if (result.value.kind === 'duplicate') return setDuplicate({ existingId: result.value.existingId });
      return openReview(result.value.draft, result.value.notice);
    }
    if (result.error.code === 'USER_CANCELLED') return;
    setFailure({
      error: result.error,
      retry: () => void readLink(input, allowDuplicate),
      manualDraft: { ...emptyDraft(), productUrl: input.url.trim() || undefined },
    });
  };

  const addScreenshot = async () => {
    const picked = await pickImages('gallery');
    if (picked.ok && picked.value[0]) await readLink({ url, labelImageUri: picked.value[0] });
  };

  const handleAction = (action: ErrorAction) => {
    if (!failure) return;
    const handlers: Partial<Record<ErrorAction, () => void>> = {
      retry: failure.retry,
      ask_again: failure.retry,
      manual: () => openReview(failure.manualDraft),
      take_photo: () => void pickAndAnalyze('camera'),
      pick_gallery: () => void pickAndAnalyze('gallery'),
      open_settings: () => void Linking.openSettings(),
      add_screenshot: () => void addScreenshot(),
      paste_info: () => setPastedText(''),
    };
    handlers[action]?.();
  };

  return (
    <Screen>
      <OptionCard
        icon="📷"
        title={t('add.photoTitle')}
        body={t('add.photoBody')}
        selected={mode === 'photo'}
        onPress={() => setMode('photo')}
      />
      {mode === 'photo' ? (
        <View style={styles.actions}>
          <Button label={t('add.takePhoto')} onPress={() => void pickAndAnalyze('camera')} />
          <Button label={t('add.chooseFromGallery')} variant="secondary" onPress={() => void pickAndAnalyze('gallery')} />
        </View>
      ) : null}

      <OptionCard icon="🔗" title={t('add.linkTitle')} body={t('add.linkBody')} selected={mode === 'link'} onPress={() => setMode('link')} />
      {mode === 'link' ? (
        <View style={styles.actions}>
          <TextField
            placeholder={t('add.linkPlaceholder')}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={() => void readLink({ url })}
          />
          {pastedText !== undefined ? (
            <TextField label={t('errorActions.paste_info')} value={pastedText} onChangeText={setPastedText} multiline />
          ) : null}
          <Button
            label={t('add.analyzeLink')}
            disabled={url.trim() === ''}
            onPress={() => void readLink({ url, pastedText: pastedText || undefined })}
          />
        </View>
      ) : null}

      <OptionCard icon="✍️" title={t('add.manualTitle')} body={t('add.manualBody')} onPress={() => openReview(emptyDraft())} />

      {failure ? (
        <ErrorBanner
          error={failure.error}
          onAction={handleAction}
          supportedActions={['retry', 'ask_again', 'manual', 'take_photo', 'pick_gallery', 'open_settings', 'add_screenshot', 'paste_info']}
        />
      ) : null}
      {duplicate ? (
        <ErrorBanner
          error={appError('DUPLICATE_GARMENT')}
          onAction={(action) =>
            action === 'open_existing' ? router.push(`/garment/${duplicate.existingId}`) : void readLink({ url, pastedText }, true)
          }
        />
      ) : null}
      <BusyOverlay message={busyMessage} onCancel={cancel} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm, marginBottom: spacing.lg },
});
