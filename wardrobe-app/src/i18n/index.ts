import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import tr from './tr.json';

export type AppLanguage = 'tr' | 'en';

export const resources = { tr: { translation: tr }, en: { translation: en } } as const;

/** Turkish for Turkish devices, English for everything else (plan §0). */
export function detectLanguage(languageCode: string | null | undefined): AppLanguage {
  return languageCode?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export function currentLanguage(): AppLanguage {
  return detectLanguage(i18n.language);
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(getLocales()[0]?.languageCode),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
