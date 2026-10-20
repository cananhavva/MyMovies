import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import type { GapStatus, GapSuggestion } from '@/domain/types';
import { gapReasonLabel, gapTitle } from '@/i18n/labels';
import { Button } from './Button';

interface GapCardProps {
  suggestion: GapSuggestion;
  onStatus: (status: GapStatus) => void;
}

export function GapCard({ suggestion, onStatus }: GapCardProps) {
  const { t } = useTranslation();
  const planned = suggestion.status === 'planned';
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{gapTitle(t, suggestion)}</Text>
      <Text style={styles.reason}>{gapReasonLabel(t, suggestion)}</Text>
      <Text style={styles.priority}>{t('insights.priority', { priority: suggestion.priority })}</Text>
      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button
            label={planned ? t('insights.planned') : t('insights.plan')}
            variant={planned ? 'secondary' : 'primary'}
            onPress={() => onStatus(planned ? 'open' : 'planned')}
          />
        </View>
        <View style={styles.flex}>
          <Button label={t('insights.acquired')} variant="secondary" onPress={() => onStatus('acquired')} />
        </View>
        <View style={styles.flex}>
          <Button label={t('insights.dismiss')} variant="secondary" onPress={() => onStatus('dismissed')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, gap: spacing.xs },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  reason: { fontSize: fontSize.md, color: colors.text },
  priority: { fontSize: fontSize.sm, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
});
