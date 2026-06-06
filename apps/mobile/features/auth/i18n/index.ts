import { getLocales } from 'expo-localization';
import en from './translations/en.json';
import fr from './translations/fr.json';

const translations: Record<string, Record<string, string>> = { en, fr };

export function useAuthTranslation() {
  const deviceLocale = getLocales()[0]?.languageCode || 'en';
  const locale = ['en', 'fr'].includes(deviceLocale) ? deviceLocale : 'en';

  const t = (key: string, params?: Record<string, string>): string => {
    let text = translations[locale]?.[key] ?? translations['en'][key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, v);
      });
    }
    return text;
  };

  return { t, locale };
}
