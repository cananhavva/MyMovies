import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { AiClient } from '@/ai/AiClient';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { TextField } from '@/components/TextField';
import { isProductionBuild } from '@/config/env';
import { colors, fontSize, spacing } from '@/config/theme';
import { deleteAllData } from '@/data/dataAdmin';
import { dbCall } from '@/data/database';
import { getRepositories } from '@/data/openDatabase';
import type { AppError } from '@/errors/AppError';
import { clearByokKey, saveByokKey } from '@/services/apiKeyStore';
import { shareDataExport } from '@/services/exportService';
import { deleteAllImages } from '@/services/imageStorage';
import { useAiStore } from '@/store/aiStore';
import { useGapStore } from '@/store/gapStore';
import { useInspirationStore } from '@/store/inspirationStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { useWardrobeStore } from '@/store/wardrobeStore';

async function wipeEverything(): Promise<AppError | undefined> {
  const result = await dbCall(async () => {
    await deleteAllData(getRepositories().db);
    deleteAllImages();
  });
  if (!result.ok) return result.error;
  useWardrobeStore.getState().clear();
  useInspirationStore.getState().clear();
  useGapStore.getState().clear();
  await useSettingsStore.getState().load();
  return undefined;
}

function DeveloperSection() {
  const { t } = useTranslation();
  const resetClient = useAiStore((s) => s.resetClient);
  const showToast = useToastStore((s) => s.show);
  const [key, setKey] = useState('');

  return (
    <>
      <SectionTitle>{t('settings.developer')}</SectionTitle>
      <TextField
        label={t('settings.byokLabel')}
        hint={t('settings.byokHint')}
        value={key}
        onChangeText={setKey}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.actions}>
        <Button
          label={t('settings.byokSave')}
          disabled={key.trim() === ''}
          onPress={async () => {
            await saveByokKey(key);
            setKey('');
            resetClient();
            showToast(t('settings.byokSaved'));
          }}
        />
        <Button
          label={t('settings.byokClear')}
          variant="secondary"
          onPress={async () => {
            await clearByokKey();
            resetClient();
            showToast(t('common.deleted'));
          }}
        />
      </View>
    </>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const aiConsentGranted = useSettingsStore((s) => s.aiConsentGranted);
  const setAiConsent = useSettingsStore((s) => s.setAiConsent);
  const getClient = useAiStore((s) => s.getClient);
  const client = useAiStore((s) => s.client);
  const showToast = useToastStore((s) => s.show);
  const [backend, setBackend] = useState<AiClient['kind'] | undefined>(client?.kind);
  const [error, setError] = useState<AppError | undefined>();

  useEffect(() => {
    void getClient().then((c) => setBackend(c.kind));
  }, [getClient, client]);

  const exportData = async () => {
    const result = await shareDataExport(getRepositories().db);
    if (!result.ok) setError(result.error);
  };

  const confirmDeleteAll = () =>
    Alert.alert(t('settings.deleteAll'), t('settings.deleteAllConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const failure = await wipeEverything();
          if (failure) setError(failure);
          else showToast(t('settings.deleteAllDone'));
        },
      },
    ]);

  return (
    <Screen>
      {error ? <ErrorBanner error={error} /> : null}
      <SectionTitle>{t('settings.language')}</SectionTitle>
      <Text style={styles.text}>{t('settings.languageInfo')}</Text>

      <SectionTitle>{t('settings.aiConsent')}</SectionTitle>
      <Text style={styles.text}>{t('consent.body')}</Text>
      {aiConsentGranted ? (
        <View style={styles.actions}>
          <Text style={styles.text}>✓ {t('settings.aiConsentGranted')}</Text>
          <Button label={t('settings.aiConsentRevoke')} variant="secondary" onPress={() => void setAiConsent(false)} />
        </View>
      ) : null}
      {backend ? (
        <Text style={styles.muted}>
          {t('settings.aiBackend')}: {t(`settings.backend.${backend}`)}
        </Text>
      ) : null}

      <SectionTitle>{t('settings.data')}</SectionTitle>
      <Text style={styles.text}>{t('settings.dataInfo')}</Text>
      <View style={styles.actions}>
        <Button label={t('settings.export')} variant="secondary" onPress={() => void exportData()} />
        <Button label={t('settings.deleteAll')} variant="danger" onPress={confirmDeleteAll} />
      </View>

      {isProductionBuild ? null : <DeveloperSection />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: fontSize.md, color: colors.text, marginBottom: spacing.sm, lineHeight: 22 },
  muted: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
  actions: { gap: spacing.sm },
});
