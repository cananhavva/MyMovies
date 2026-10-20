import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { BusyOverlay } from '@/components/BusyOverlay';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ChipGroup } from '@/components/ChipGroup';
import { ErrorBanner } from '@/components/ErrorBanner';
import { LookCard } from '@/components/LookCard';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { TextField } from '@/components/TextField';
import { colors, fontSize, spacing } from '@/config/theme';
import type { ID } from '@/domain/types';
import { useLookImport } from '@/hooks/useLookImport';
import { saveInspirationLink } from '@/services/flows/inspirationFlows';
import { useInspirationStore } from '@/store/inspirationStore';
import { useToastStore } from '@/store/toastStore';

export default function InspireScreen() {
  const { t } = useTranslation();
  const influencers = useInspirationStore((s) => s.influencers);
  const looks = useInspirationStore((s) => s.looks);
  const saveInfluencer = useInspirationStore((s) => s.saveInfluencer);
  const showToast = useToastStore((s) => s.show);
  const { analyzeImages, importScreenshots, error, setError, busyMessage, run, cancel } = useLookImport();
  const [link, setLink] = useState('');
  const [info, setInfo] = useState<string | undefined>();
  const [influencerId, setInfluencerId] = useState<ID | undefined>();
  const [sourceUrl, setSourceUrl] = useState<string | undefined>();

  const saveLink = async () => {
    setError(undefined);
    setInfo(undefined);
    const saved = await run(t('common.analyzing'), () => saveInspirationLink(link));
    if (!saved.ok) return setError(saved.error);
    setLink('');
    setSourceUrl(saved.value.url);
    let profileId: ID | undefined = influencerId;
    if (saved.value.influencer) {
      const profile = await saveInfluencer(saved.value.influencer);
      if (profile.ok) {
        profileId = profile.value.id;
        setInfluencerId(profileId);
        showToast(t('inspire.profileSaved'));
      }
    }
    if (saved.value.previewImageUri) {
      return analyzeImages([saved.value.previewImageUri], { influencerId: profileId, sourceUrl: saved.value.url });
    }
    setInfo(saved.value.info.restricted ? t('inspire.restrictedInfo') : t('inspire.postSaved'));
  };

  const addScreenshots = () => void importScreenshots({ influencerId, sourceUrl });

  return (
    <Screen>
      <TextField
        placeholder={t('inspire.linkPlaceholder')}
        value={link}
        onChangeText={setLink}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onSubmitEditing={() => void saveLink()}
      />
      <Button label={t('inspire.saveLink')} variant="secondary" disabled={link.trim() === ''} onPress={() => void saveLink()} />
      <View style={styles.gap} />
      {info ? <Notice message={info} /> : null}
      {error ? <ErrorBanner error={error} onAction={addScreenshots} supportedActions={['add_screenshot']} /> : null}

      {influencers.length > 0 ? (
        <ChipGroup
          mode="single"
          allowClear
          title={t('inspire.attachTo')}
          options={influencers.map((i) => i.id)}
          selected={influencerId}
          labelOf={(id) => `@${influencers.find((i) => i.id === id)?.handle ?? ''}`}
          onChange={setInfluencerId}
        />
      ) : null}
      <Text style={styles.hint}>{t('inspire.screenshotsHint')}</Text>
      <Button label={t('inspire.addScreenshots')} onPress={addScreenshots} />

      {influencers.length > 0 ? (
        <>
          <SectionTitle>{t('inspire.influencers')}</SectionTitle>
          <View style={styles.row}>
            {influencers.map((profile) => (
              <Chip
                key={profile.id}
                label={`@${profile.handle} · ${t(`enums.platform.${profile.platform}`)}`}
                selected={false}
                onPress={() => router.push(`/influencer/${profile.id}`)}
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle>{t('inspire.looks')}</SectionTitle>
      {looks.length === 0 ? <Text style={styles.hint}>{t('inspire.emptyLooks')}</Text> : null}
      {looks.map((look) => (
        <LookCard key={look.id} look={look} onPress={() => router.push(`/inspiration/${look.id}`)} />
      ))}
      <BusyOverlay message={busyMessage} onCancel={cancel} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { height: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { fontSize: fontSize.md, color: colors.textMuted, marginVertical: spacing.md },
});
