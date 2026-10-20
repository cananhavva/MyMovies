import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import type { InspirationLook } from '@/domain/types';

export function LookCard({ look, onPress }: { look: InspirationLook; onPress: () => void }) {
  const { t } = useTranslation();
  const percent = Math.round(look.recreatability * 100);
  const label = t('inspire.recreatable', { percent });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {look.imageUris[0] ? <Image source={{ uri: look.imageUris[0] }} style={styles.image} accessibilityIgnoresInvertColors /> : null}
      <View style={styles.body}>
        <Text style={styles.title}>
          {look.liked ? '♥ ' : ''}
          {label}
        </Text>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.md, minHeight: 96 },
  pressed: { opacity: 0.85 },
  image: { width: 72, height: 96, backgroundColor: colors.chip },
  body: { flex: 1, padding: spacing.md, justifyContent: 'center', gap: spacing.sm },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  bar: { height: 8, borderRadius: radius.pill, backgroundColor: colors.chip, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.primary },
});
