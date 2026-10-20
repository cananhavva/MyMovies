import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PhotoStrip } from '@/components/PhotoStrip';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, fontSize, MIN_TOUCH, radius, spacing } from '@/config/theme';
import type { Garment, InspirationItem } from '@/domain/types';
import { colorLabel, subcategoryLabel } from '@/i18n/labels';
import { matchLevel, type MatchLevel } from '@/rules/matching';
import { useInspirationStore } from '@/store/inspirationStore';
import { useWardrobeStore } from '@/store/wardrobeStore';

const LEVEL_COLOR: Readonly<Record<MatchLevel, string>> = {
  owned: colors.tier.premium,
  similar: colors.tier.average,
  missing: colors.tier.low,
};

function ItemRow({ item, garments }: { item: InspirationItem; garments: readonly Garment[] }) {
  const { t } = useTranslation();
  const level = matchLevel(item.matchScore);
  const matches = item.matchedGarmentIds
    .map((id) => garments.find((g) => g.id === id))
    .filter((g): g is Garment => g !== undefined);
  const name = [
    ...item.colors.slice(0, 1).map((c) => colorLabel(t, c)),
    item.subcategory ? subcategoryLabel(t, item.subcategory) : t(`enums.category.${item.category}`),
  ].join(' ');

  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{name}</Text>
        <View style={[styles.level, { backgroundColor: LEVEL_COLOR[level] }]}>
          <Text style={styles.levelText}>{t(`look.${level}`)}</Text>
        </View>
      </View>
      {item.description ? <Text style={styles.muted}>{item.description}</Text> : null}
      {matches.map((garment) => (
        <Pressable
          key={garment.id}
          accessibilityRole="link"
          onPress={() => router.push(`/garment/${garment.id}`)}
          style={styles.match}
        >
          <Text style={styles.matchText}>→ {garment.name}</Text>
        </Pressable>
      ))}
      {item.likelyBrands && item.likelyBrands.length > 0 ? (
        <View style={styles.brands}>
          <Text style={styles.muted}>{t('look.whereFrom')}: </Text>
          <Text style={styles.brandText}>{item.likelyBrands.join(', ')}</Text>
          <View style={styles.estimate}>
            <Text style={styles.estimateText}>{t('common.estimate')}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function LookDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const look = useInspirationStore((s) => s.looks.find((l) => l.id === id));
  const toggleLike = useInspirationStore((s) => s.toggleLike);
  const removeLook = useInspirationStore((s) => s.removeLook);
  const garments = useWardrobeStore((s) => s.garments);

  if (!look) return <EmptyState title={t('garment.notFound')} />;

  return (
    <Screen
      footer={<Button label={look.liked ? `♥ ${t('look.liked')}` : `♡ ${t('look.like')}`} onPress={() => void toggleLike(look.id)} />}
    >
      <PhotoStrip uris={look.imageUris} />
      <Text style={styles.title}>{t('inspire.recreatable', { percent: Math.round(look.recreatability * 100) })}</Text>
      <SectionTitle>{t('look.items')}</SectionTitle>
      {look.items.map((item) => (
        <ItemRow key={item.id} item={item} garments={garments} />
      ))}
      <View style={styles.gap} />
      <Button
        variant="danger"
        label={t('look.delete')}
        onPress={() => {
          void removeLook(look.id);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  item: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.xs },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemName: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  level: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  levelText: { color: colors.primaryText, fontWeight: '700', fontSize: fontSize.sm },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  match: { minHeight: MIN_TOUCH - 8, justifyContent: 'center' },
  matchText: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
  brands: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  brandText: { fontSize: fontSize.sm, color: colors.text },
  estimate: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.warning, paddingHorizontal: spacing.sm },
  estimateText: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '600' },
  gap: { height: spacing.xl },
});
