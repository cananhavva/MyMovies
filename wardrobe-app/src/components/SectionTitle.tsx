import { StyleSheet, Text } from 'react-native';
import { colors, fontSize, spacing } from '@/config/theme';

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
});
