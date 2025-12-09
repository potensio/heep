import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFERENCE_KEY = "notification_preference";

/**
 * Serialize and store notification preference to AsyncStorage.
 * Stores the boolean value as a JSON string.
 *
 * @param enabled - The notification preference state to save
 * @throws Error if AsyncStorage write fails
 */
export async function savePreference(enabled: boolean): Promise<void> {
  const value = JSON.stringify(enabled);
  await AsyncStorage.setItem(PREFERENCE_KEY, value);
}

/**
 * Retrieve and deserialize notification preference from AsyncStorage.
 * Returns null if no preference has been stored.
 *
 * @returns The stored preference value, or null if not set
 * @throws Error if AsyncStorage read fails
 */
export async function loadPreference(): Promise<boolean | null> {
  const value = await AsyncStorage.getItem(PREFERENCE_KEY);
  if (value === null) {
    return null;
  }
  return JSON.parse(value) as boolean;
}

export { PREFERENCE_KEY };
