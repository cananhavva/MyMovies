import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { colors, MIN_TOUCH } from '@/config/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return ({ focused, size }: { focused: boolean; size: number }) => (
    <Ionicons name={name} color={focused ? colors.primary : colors.textMuted} size={size} />
  );
}

function SettingsButton() {
  const { t } = useTranslation();
  return (
    <Link href="/settings" asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={t('settings.title')} style={styles.headerButton}>
        <Ionicons name="settings-outline" size={24} color={colors.primary} />
      </Pressable>
    </Link>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.background },
        tabBarStyle: { minHeight: MIN_TOUCH + 12 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.wardrobe'), tabBarIcon: tabIcon('shirt-outline'), headerRight: () => <SettingsButton /> }}
      />
      <Tabs.Screen name="add" options={{ title: t('tabs.add'), tabBarIcon: tabIcon('add-circle-outline') }} />
      <Tabs.Screen name="inspire" options={{ title: t('tabs.inspire'), tabBarIcon: tabIcon('sparkles-outline') }} />
      <Tabs.Screen name="insights" options={{ title: t('tabs.insights'), tabBarIcon: tabIcon('analytics-outline') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
});
