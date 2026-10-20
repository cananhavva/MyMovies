import { Image, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/config/theme';

interface PhotoStripProps {
  uris: readonly string[];
  onRemove?: (uri: string) => void;
  removeLabel?: string;
}

export function PhotoStrip({ uris, onRemove, removeLabel }: PhotoStripProps) {
  if (uris.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
      {uris.map((uri) => (
        <Pressable
          key={uri}
          disabled={!onRemove}
          accessibilityRole={onRemove ? 'button' : 'image'}
          accessibilityLabel={removeLabel}
          onPress={() => onRemove?.(uri)}
        >
          <Image source={{ uri }} style={styles.photo} accessibilityIgnoresInvertColors />
          {onRemove ? <Text style={styles.remove}>✕</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { marginBottom: spacing.md },
  photo: { width: 120, height: 160, borderRadius: radius.md, marginRight: spacing.sm, backgroundColor: colors.chip },
  remove: { position: 'absolute', top: spacing.xs, right: spacing.md, color: colors.surface, fontWeight: '700' },
});
