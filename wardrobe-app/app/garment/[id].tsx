import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { BusyOverlay } from '@/components/BusyOverlay';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { EmptyState } from '@/components/EmptyState';
import { PhotoStrip } from '@/components/PhotoStrip';
import { QualityBadge } from '@/components/QualityBadge';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, fontSize, spacing } from '@/config/theme';
import type { AppError } from '@/errors/AppError';
import { useAbortableTask } from '@/hooks/useAbortableTask';
import { useFlowContext } from '@/hooks/useFlowContext';
import { colorLabel, subcategoryLabel } from '@/i18n/labels';
import { analyzePhoto } from '@/services/flows/addGarmentFlows';
import { garmentToDraft } from '@/services/garmentDraft';
import { useDraftStore } from '@/store/draftStore';
import { useToastStore } from '@/store/toastStore';
import { useWardrobeStore } from '@/store/wardrobeStore';

function TagLine({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <Text style={styles.line}>
      <Text style={styles.lineLabel}>{label}: </Text>
      {values.join(', ')}
    </Text>
  );
}

export default function GarmentDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const garment = useWardrobeStore((s) => s.garments.find((g) => g.id === id));
  const save = useWardrobeStore((s) => s.save);
  const remove = useWardrobeStore((s) => s.remove);
  const undoRemove = useWardrobeStore((s) => s.undoRemove);
  const showToast = useToastStore((s) => s.show);
  const startDraft = useDraftStore((s) => s.start);
  const flowContext = useFlowContext();
  const { busyMessage, run, cancel } = useAbortableTask();
  const [error, setError] = useState<AppError | undefined>();

  if (!garment) return <EmptyState title={t('garment.notFound')} />;

  const edit = () => {
    startDraft(garmentToDraft(garment), { editingId: garment.id });
    router.push('/garment/review');
  };

  /** Offline-saved items (pendingAnalysis) can be analysed later; the result opens in review. */
  const analyzeNow = async () => {
    setError(undefined);
    const result = await run(t('add.analyzingPhoto'), (signal) => analyzePhoto(garment.imageUris, flowContext(signal)));
    if (!result.ok) return setError(result.error);
    startDraft({ ...result.value.draft, name: garment.name || result.value.draft.name, pendingAnalysis: false }, {
      editingId: garment.id,
      notice: result.value.notice,
    });
    router.push('/garment/review');
  };

  const deleteGarment = async () => {
    const result = await remove(garment.id);
    if (!result.ok) return;
    router.back();
    showToast(t('garment.deleted'), { label: t('common.undo'), onPress: () => void undoRemove() });
  };

  const update = (patch: Partial<typeof garment>) => void save({ ...garment, ...patch, updatedAt: new Date().toISOString() });

  return (
    <Screen footer={<Button label={t('common.edit')} onPress={edit} />}>
      <Stack.Screen options={{ title: garment.name }} />
      <PhotoStrip uris={garment.imageUris} />
      {error ? <ErrorBanner error={error} /> : null}
      {garment.pendingAnalysis && garment.imageUris.length > 0 ? (
        <Button label={t('garment.analyzeNow')} variant="secondary" onPress={() => void analyzeNow()} />
      ) : null}
      <Text style={styles.title}>{garment.name}</Text>
      <Text style={styles.subtitle}>
        {[t(`enums.category.${garment.category}`), garment.subcategory && subcategoryLabel(t, garment.subcategory), garment.brand]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <TagLine label={t('review.colors')} values={garment.colors.map((c) => colorLabel(t, c))} />
      <TagLine label={t('review.seasons')} values={garment.seasons.map((s) => t(`enums.season.${s}`))} />
      <TagLine label={t('review.weather')} values={garment.weather.map((w) => t(`enums.weather.${w}`))} />
      <TagLine label={t('review.occasions')} values={garment.occasions.map((o) => t(`enums.occasion.${o}`))} />
      {garment.notes ? <Text style={styles.line}>{garment.notes}</Text> : null}

      <SectionTitle>{t('quality.title')}</SectionTitle>
      {garment.quality ? <QualityBadge quality={garment.quality} /> : <Text style={styles.line}>{t('quality.unknown')}</Text>}

      <View style={styles.actions}>
        <Button
          variant="secondary"
          label={garment.favorite ? t('garment.unfavorite') : t('garment.favorite')}
          onPress={() => update({ favorite: !garment.favorite })}
        />
        {garment.productUrl ? (
          <Button variant="secondary" label={t('garment.openProduct')} onPress={() => void Linking.openURL(garment.productUrl ?? '')} />
        ) : null}
        <Button
          variant="secondary"
          label={garment.archived ? t('garment.unarchive') : t('garment.archive')}
          onPress={() => update({ archived: !garment.archived })}
        />
        <Button variant="danger" label={t('garment.delete')} onPress={() => void deleteGarment()} />
      </View>
      <BusyOverlay message={busyMessage} onCancel={cancel} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.md },
  line: { fontSize: fontSize.md, color: colors.text, marginBottom: spacing.xs },
  lineLabel: { fontWeight: '600' },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
});
