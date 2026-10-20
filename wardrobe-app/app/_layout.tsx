import '@/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AiConsentSheet } from '@/components/AiConsentSheet';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { ErrorBanner } from '@/components/ErrorBanner';
import { ToastHost } from '@/components/ToastHost';
import { colors, spacing } from '@/config/theme';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useDerivedDataSync } from '@/hooks/useDerivedDataSync';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppShell />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const { t } = useTranslation();
  const boot = useAppBootstrap();
  useDerivedDataSync(boot.status === 'ready');

  if (boot.status !== 'ready') {
    return (
      <View style={styles.center}>
        {boot.status === 'loading' ? <ActivityIndicator size="large" color={colors.primary} /> : <ErrorBanner error={boot.error} />}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="garment/review" options={{ title: t('review.title') }} />
        <Stack.Screen name="garment/[id]" options={{ title: '' }} />
        <Stack.Screen name="inspiration/[id]" options={{ title: t('look.title') }} />
        <Stack.Screen name="influencer/[id]" options={{ title: t('influencer.title') }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      </Stack>
      <ToastHost />
      <AiConsentSheet />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
});
