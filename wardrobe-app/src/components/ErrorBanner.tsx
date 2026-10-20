import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/config/theme';
import type { AppError } from '@/errors/AppError';
import { errorActions, errorMessageKey, isSilentError, type ErrorAction } from '@/errors/errorMessages';
import { useAiStore } from '@/store/aiStore';
import { Button } from './Button';

interface ErrorBannerProps {
  error: AppError;
  /** Only actions the screen can perform are shown. */
  onAction?: (action: ErrorAction) => void;
  supportedActions?: readonly ErrorAction[];
}

export function useErrorMessage() {
  const { t } = useTranslation();
  const byokMode = useAiStore((s) => s.client?.kind === 'direct');
  return (error: AppError): string => {
    if (error.code === 'AI_RATE_LIMITED' && error.retryAfterSec) {
      return t('errors.AI_RATE_LIMITED_WAIT', { seconds: error.retryAfterSec });
    }
    return t(errorMessageKey(error, { byokMode }));
  };
}

export function ErrorBanner({ error, onAction, supportedActions }: ErrorBannerProps) {
  const { t } = useTranslation();
  const messageOf = useErrorMessage();
  if (isSilentError(error)) return null;
  const actions = errorActions(error).filter((a) => !supportedActions || supportedActions.includes(a));
  return (
    <View accessibilityRole="alert" style={styles.box}>
      <Text style={styles.text}>{messageOf(error)}</Text>
      {onAction && actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <Button
              key={action}
              label={t(`errorActions.${action}`)}
              variant={index === 0 ? 'primary' : 'secondary'}
              onPress={() => onAction(action)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.warningBackground, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, gap: spacing.md },
  text: { fontSize: fontSize.md, color: colors.text },
  actions: { gap: spacing.sm },
});
