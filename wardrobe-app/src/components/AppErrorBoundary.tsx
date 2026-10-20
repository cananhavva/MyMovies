import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import i18n from '@/i18n';
import { colors, fontSize, spacing } from '@/config/theme';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** UNKNOWN errors land here instead of a white screen; data on disk is unaffected. */
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  override render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{i18n.t('errorBoundary.title')}</Text>
        <Text style={styles.body}>{i18n.t('errorBoundary.body')}</Text>
        <Button label={i18n.t('errorBoundary.restart')} onPress={() => this.setState({ hasError: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center' },
  body: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
});
