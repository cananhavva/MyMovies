import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import { useAiStore } from '@/store/aiStore';
import { Button } from './Button';

interface BusyOverlayProps {
  message?: string;
  onCancel: () => void;
}

/**
 * Blocking progress with a cancel button (AbortController behind it). Stays hidden while the AI
 * consent sheet is open: tasks start busy before the consent gate, and iOS can't stack two modals.
 */
export function BusyOverlay({ message, onCancel }: BusyOverlayProps) {
  const { t } = useTranslation();
  const awaitingConsent = useAiStore((s) => s.consentRequest !== undefined);
  return (
    <Modal visible={message !== undefined && !awaitingConsent} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.box} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>{message}</Text>
          <Button label={t('common.cancel')} variant="secondary" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg, alignItems: 'stretch' },
  text: { fontSize: fontSize.lg, color: colors.text, textAlign: 'center' },
});
