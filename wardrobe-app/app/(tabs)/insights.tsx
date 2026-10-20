import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { BusyOverlay } from '@/components/BusyOverlay';
import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/ChipGroup';
import { ErrorBanner } from '@/components/ErrorBanner';
import { GapCard } from '@/components/GapCard';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import { OCCASIONS } from '@/domain/taxonomy';
import type { Category } from '@/domain/types';
import type { AppError } from '@/errors/AppError';
import { useAbortableTask } from '@/hooks/useAbortableTask';
import { useFlowContext } from '@/hooks/useFlowContext';
import { currentLanguage } from '@/i18n';
import { gapTitle } from '@/i18n/labels';
import { aiGate } from '@/services/flows/aiGate';
import { useGapStore } from '@/store/gapStore';
import { useInspirationStore } from '@/store/inspirationStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useWardrobeStore } from '@/store/wardrobeStore';

export default function InsightsScreen() {
  const { t } = useTranslation();
  const visible = useGapStore((s) => s.visible);
  const capsule = useGapStore((s) => s.capsule);
  const setStatus = useGapStore((s) => s.setStatus);
  const saveNarrative = useGapStore((s) => s.saveNarrative);
  const frequentOccasions = useSettingsStore((s) => s.frequentOccasions);
  const setFrequentOccasions = useSettingsStore((s) => s.setFrequentOccasions);
  const garments = useWardrobeStore((s) => s.garments);
  const lookCount = useInspirationStore((s) => s.looks.length);
  const flowContext = useFlowContext();
  const { busyMessage, run, cancel } = useAbortableTask();
  const [error, setError] = useState<AppError | undefined>();

  const writeNarrative = async () => {
    setError(undefined);
    const wardrobeCounts: Partial<Record<Category, number>> = {};
    for (const g of garments) if (!g.archived) wardrobeCounts[g.category] = (wardrobeCounts[g.category] ?? 0) + 1;
    const result = await run(t('common.analyzing'), async (signal) => {
      const client = await aiGate(flowContext(signal));
      if (!client.ok) return client;
      return client.value.gapPlan(
        {
          language: currentLanguage(),
          season: capsule?.season,
          wardrobeCounts,
          frequentOccasions,
          gaps: visible.map((s) => ({ title: gapTitle(t, s), reason: s.reason, priority: s.priority })),
        },
        { signal },
      );
    });
    if (result.ok) await saveNarrative(result.value.narrative);
    else setError(result.error);
  };

  const owned = capsule?.coreGarmentIds.length ?? 0;
  const total = capsule?.targetSize ?? 0;

  return (
    <Screen>
      <SectionTitle>{t('insights.occasionsTitle')}</SectionTitle>
      <Text style={styles.muted}>{t('insights.occasionsBody')}</Text>
      <ChipGroup
        mode="multi"
        options={OCCASIONS}
        selected={frequentOccasions}
        labelOf={(o) => t(`enums.occasion.${o}`)}
        onChange={(occasions) => void setFrequentOccasions(occasions)}
      />

      <SectionTitle>{t('insights.suggestionsTitle')}</SectionTitle>
      {lookCount === 0 ? <Notice message={t('insights.noInspirationHint')} /> : null}
      {visible.length === 0 ? <Text style={styles.muted}>{t('insights.noSuggestions')}</Text> : null}
      {visible.map((suggestion) => (
        <GapCard key={suggestion.key} suggestion={suggestion} onStatus={(status) => void setStatus(suggestion.key, status)} />
      ))}

      <SectionTitle>{t('insights.capsuleTitle')}</SectionTitle>
      <Text style={styles.progressText}>{t('insights.capsuleProgress', { owned, total })}</Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${total ? Math.round((owned / total) * 100) : 0}%` }]} />
      </View>
      {capsule?.narrative ? <Text style={styles.narrative}>✨ {capsule.narrative}</Text> : null}
      {error ? <ErrorBanner error={error} onAction={() => void writeNarrative()} supportedActions={['retry']} /> : null}
      <Button label={t('insights.writeWithAi')} variant="secondary" onPress={() => void writeNarrative()} />
      <BusyOverlay message={busyMessage} onCancel={cancel} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.md },
  progressText: { fontSize: fontSize.md, color: colors.text, marginBottom: spacing.sm },
  bar: { height: 10, borderRadius: radius.pill, backgroundColor: colors.chip, overflow: 'hidden', marginBottom: spacing.md },
  fill: { height: 10, backgroundColor: colors.primary },
  narrative: { fontSize: fontSize.md, color: colors.text, lineHeight: 22, marginBottom: spacing.md },
});
