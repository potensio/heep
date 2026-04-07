import { useTranslation } from "react-i18next";
import { useCallback } from "react";

export type Language = "en" | "id";

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language as Language;

  const changeLanguage = useCallback(
    async (language: Language) => {
      try {
        await i18n.changeLanguage(language);
      } catch (error) {
        console.error("Error changing language:", error);
      }
    },
    [i18n],
  );

  const toggleLanguage = useCallback(async () => {
    const newLanguage = currentLanguage === "en" ? "id" : "en";
    await changeLanguage(newLanguage);
  }, [currentLanguage, changeLanguage]);

  return {
    currentLanguage,
    changeLanguage,
    toggleLanguage,
    isEnglish: currentLanguage === "en",
    isIndonesian: currentLanguage === "id",
  };
}
