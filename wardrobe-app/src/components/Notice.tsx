import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/config/theme';

interface NoticeProps {
  message: string;
  tone?: 'info' | 'warning';
}

export function Notice({ message, tone = 'info' }: NoticeProps) {
  return (
    <View accessibilityRole="alert" style={[styles.box, tone === 'warning' ? styles.warning : styles.info]}>
      <Text style={[styles.text, tone === 'warning' && styles.warningText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  info: { backgroundColor: colors.infoBackground },
  warning: { backgroundColor: colors.warningBackground },
  text: { fontSize: fontSize.md, color: colors.text },
  warningText: { color: colors.warning },
});
