import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import type { Garment } from '@/domain/types';

interface GarmentCardProps {
  garment: Garment;
  onPress: () => void;
}

export function GarmentCard({ garment, onPress }: GarmentCardProps) {
  const { t } = useTranslation();
  const image = garment.imageUris[0];
  const category = t(`enums.category.${garment.category}`);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${garment.name}, ${category}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.image} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>{category}</Text>
        </View>
      )}
      <Text numberOfLines={1} style={styles.name}>
        {garment.favorite ? '♥ ' : ''}
        {garment.name}
      </Text>
      <Text numberOfLines={1} style={styles.meta}>
        {category}
        {garment.pendingAnalysis ? ' · …' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { margin: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', paddingBottom: spacing.sm },
  pressed: { opacity: 0.85 },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.chip },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textMuted, fontSize: fontSize.md },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  meta: { fontSize: fontSize.sm, color: colors.textMuted, paddingHorizontal: spacing.sm },
});
