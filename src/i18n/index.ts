import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import translation files
import enCommon from "./locales/en/common.json";
import enHome from "./locales/en/home.json";
import enOnboarding from "./locales/en/onboarding.json";
import enNotifications from "./locales/en/notifications.json";

import idCommon from "./locales/id/common.json";
import idHome from "./locales/id/home.json";
import idOnboarding from "./locales/id/onboarding.json";
import idNotifications from "./locales/id/notifications.json";

const LANGUAGE_STORAGE_KEY = "@swissbelhotel:language";

// Language detector plugin
const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // If no saved language, detect from device
      const deviceLanguage = Localization.getLocales()[0]?.languageCode;

      // Map device language to supported languages
      const supportedLanguage = deviceLanguage === "id" ? "id" : "en";
      callback(supportedLanguage);
    } catch (error) {
      console.error("Error detecting language:", error);
      callback("en"); // Fallback to English
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  },
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3", // Important for React Native
    resources: {
      en: {
        common: enCommon,
        home: enHome,
        onboarding: enOnboarding,
        notifications: enNotifications,
      },
      id: {
        common: idCommon,
        home: idHome,
        onboarding: idOnboarding,
        notifications: idNotifications,
      },
    },
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Important for React Native
    },
  });

export default i18n;
export { LANGUAGE_STORAGE_KEY };
