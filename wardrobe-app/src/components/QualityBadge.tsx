import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import type { QualityAssessment } from '@/domain/types';
import { qualityReasonLabel } from '@/i18n/labels';

export function QualityBadge({ quality }: { quality: QualityAssessment }) {
  const { t } = useTranslation();
  if (quality.tier === 'unknown') {
    return <Text style={styles.unknown}>{t('quality.unknown')}</Text>;
  }
  const estimated = quality.compositionSource === 'ai_guess';
  const reasons = quality.reasons.filter((r) => r !== 'estimated');
  return (
    <View style={styles.box} accessible accessibilityLabel={`${t('quality.title')}: ${t(`quality.tier.${quality.tier}`)}, ${Math.round(quality.score)}/100`}>
      <View style={styles.row}>
        <View style={[styles.pill, { backgroundColor: colors.tier[quality.tier] }]}>
          <Text style={styles.pillText}>{t(`quality.tier.${quality.tier}`)}</Text>
        </View>
        <Text style={styles.score}>{t('quality.score', { score: Math.round(quality.score) })}</Text>
        {estimated ? (
          <View style={styles.estimate}>
            <Text style={styles.estimateText}>{t('common.estimate')}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.caption}>{estimated ? t('quality.estimated') : t('quality.byComposition')}</Text>
      {reasons.map((reason) => (
        <Text key={reason} style={styles.reason}>
          • {qualityReasonLabel(t, reason)}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pillText: { color: colors.primaryText, fontWeight: '700', fontSize: fontSize.md },
  score: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  estimate: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.warning, paddingHorizontal: spacing.sm },
  estimateText: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '600' },
  caption: { fontSize: fontSize.sm, color: colors.textMuted },
  reason: { fontSize: fontSize.md, color: colors.text },
  unknown: { fontSize: fontSize.md, color: colors.textMuted },
});
