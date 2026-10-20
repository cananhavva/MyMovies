import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '@/config/theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.xxl, alignItems: 'stretch', gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' },
  body: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
});
