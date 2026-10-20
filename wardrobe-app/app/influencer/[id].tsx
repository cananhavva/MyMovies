import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { BusyOverlay } from '@/components/BusyOverlay';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { LookCard } from '@/components/LookCard';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { colors, fontSize, spacing } from '@/config/theme';
import { useLookImport } from '@/hooks/useLookImport';
import { detectPlatform } from '@/services/platformDetect';
import { useInspirationStore } from '@/store/inspirationStore';

export default function InfluencerScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useInspirationStore((s) => s.influencers.find((i) => i.id === id));
  const allLooks = useInspirationStore((s) => s.looks);
  const looks = useMemo(() => allLooks.filter((l) => l.influencerId === id), [allLooks, id]);
  const removeInfluencer = useInspirationStore((s) => s.removeInfluencer);
  const { importScreenshots, error, busyMessage, cancel } = useLookImport();

  if (!profile) return <EmptyState title={t('garment.notFound')} />;
  const restricted = detectPlatform(profile.profileUrl).restricted;
  const addScreenshots = () => void importScreenshots({ influencerId: profile.id });

  return (
    <Screen footer={<Button label={t('inspire.addScreenshots')} onPress={addScreenshots} />}>
      <Text style={styles.title}>@{profile.handle}</Text>
      <Text style={styles.subtitle}>{t(`enums.platform.${profile.platform}`)}</Text>
      {restricted ? <Notice message={t('inspire.restrictedInfo')} /> : null}
      {error ? <ErrorBanner error={error} /> : null}
      <Button label={t('influencer.openProfile')} variant="secondary" onPress={() => void Linking.openURL(profile.profileUrl)} />

      <SectionTitle>{t('influencer.looks')}</SectionTitle>
      {looks.length === 0 ? <Text style={styles.subtitle}>{t('inspire.emptyLooks')}</Text> : null}
      {looks.map((look) => (
        <LookCard key={look.id} look={look} onPress={() => router.push(`/inspiration/${look.id}`)} />
      ))}
      <View style={styles.gap} />
      <Button
        variant="danger"
        label={t('influencer.delete')}
        onPress={() => {
          void removeInfluencer(profile.id);
          router.back();
        }}
      />
      <BusyOverlay message={busyMessage} onCancel={cancel} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.md },
  gap: { height: spacing.xl },
});
