import i18n from "@/src/i18n";

/**
 * Get the Swiss-Belhotel website URL based on current language
 * @returns URL with language-specific path
 */
export function getSwissBelhotelUrl(): string {
  const currentLanguage = i18n.language;
  const baseUrl = "https://www.swiss-belhotel.com";

  // If Indonesian, append /id to the URL
  if (currentLanguage === "id") {
    return `${baseUrl}/id`;
  }

  // Default to English (no language suffix)
  return baseUrl;
}
