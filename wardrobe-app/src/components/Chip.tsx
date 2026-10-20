import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, MIN_TOUCH, radius, spacing } from '@/config/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Shows ✨ to mark a value suggested by AI that the user has not confirmed yet. */
  aiSuggested?: boolean;
  accessibilityHint?: string;
}

export function Chip({ label, selected, onPress, aiSuggested = false, accessibilityHint }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {aiSuggested && selected ? '✨ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.chip,
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selected: { backgroundColor: colors.chipSelected },
  pressed: { opacity: 0.75 },
  label: { fontSize: fontSize.md, color: colors.text },
  selectedLabel: { color: colors.primaryText, fontWeight: '600' },
});
