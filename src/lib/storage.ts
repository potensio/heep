import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  HAS_SEEN_ONBOARDING: "hasSeenOnboarding",
  HAS_SEEN_NOTIFICATION_PROMPT: "hasSeenNotificationPrompt",
} as const;

export const storage = {
  /**
   * Check if user has completed onboarding
   */
  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(
        STORAGE_KEYS.HAS_SEEN_ONBOARDING
      );
      return value === "true";
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  },

  /**
   * Mark onboarding as completed
   */
  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, "true");
    } catch (error) {
      console.error("Error setting onboarding status:", error);
    }
  },

  /**
   * Check if user has seen the notification prompt
   */
  async hasSeenNotificationPrompt(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(
        STORAGE_KEYS.HAS_SEEN_NOTIFICATION_PROMPT
      );
      return value === "true";
    } catch (error) {
      console.error("Error checking notification prompt status:", error);
      return false;
    }
  },

  /**
   * Mark notification prompt as seen
   */
  async setNotificationPromptSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.HAS_SEEN_NOTIFICATION_PROMPT,
        "true"
      );
    } catch (error) {
      console.error("Error setting notification prompt status:", error);
    }
  },
};
