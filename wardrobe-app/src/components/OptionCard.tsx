import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/config/theme';

interface OptionCardProps {
  title: string;
  body: string;
  icon: string;
  selected?: boolean;
  onPress: () => void;
}

export function OptionCard({ title, body, icon, selected = false, onPress }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${body}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 2, borderColor: colors.border, marginBottom: spacing.md, minHeight: 96 },
  selected: { borderColor: colors.primary },
  pressed: { opacity: 0.85 },
  icon: { fontSize: 28, marginBottom: spacing.xs },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  body: { fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.xs },
});
