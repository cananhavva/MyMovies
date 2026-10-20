import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, MIN_TOUCH, radius, spacing } from '@/config/theme';
import { useToastStore } from '@/store/toastStore';

export function ToastHost() {
  const { message, action, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, { bottom: insets.bottom + 72 }]}
    >
      <Text style={styles.text}>{message}</Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            action.onPress();
            hide();
          }}
          style={styles.action}
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingLeft: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH + 8,
  },
  text: { flex: 1, color: colors.surface, fontSize: fontSize.md },
  action: { minHeight: MIN_TOUCH, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  actionText: { color: '#9FD3B0', fontWeight: '700', fontSize: fontSize.md },
});
