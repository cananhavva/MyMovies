import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import { useAiStore } from '@/store/aiStore';
import { Button } from './Button';

/** Apple 5.1.2(i): explicit consent before photos or text are first sent to the AI provider. */
export function AiConsentSheet() {
  const { t } = useTranslation();
  const visible = useAiStore((s) => s.consentRequest !== undefined);
  const answer = useAiStore((s) => s.answerConsent);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => void answer(false)}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('consent.title')}
          </Text>
          <Text style={styles.body}>{t('consent.body')}</Text>
          <Button label={t('consent.accept')} onPress={() => void answer(true)} />
          <Button label={t('consent.decline')} variant="secondary" onPress={() => void answer(false)} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, gap: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  body: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },
});
