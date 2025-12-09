import { useState, useEffect, useCallback } from "react";
import { OneSignal } from "react-native-onesignal";
import {
  savePreference,
  loadPreference,
} from "@/src/utils/notification-preference-storage";

/**
 * Return type for the useNotificationPreference hook.
 * Requirements: 2.1, 3.1, 3.2, 3.3
 */
export interface UseNotificationPreferenceReturn {
  /** Current notification preference state */
  isEnabled: boolean;
  /** Loading state during async operations */
  isLoading: boolean;
  /** Error state if operation fails */
  error: Error | null;
  /** Toggle the notification preference */
  togglePreference: () => Promise<void>;
}

/**
 * Custom hook for managing notification preferences.
 *
 * Handles:
 * - Loading stored preference from AsyncStorage on mount
 * - Defaulting to enabled (true) when no stored preference exists
 * - Toggling preference with OneSignal integration
 * - Persisting preference changes to AsyncStorage
 * - Error handling with rollback on failure
 *
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.3, 4.4
 */
export function useNotificationPreference(): UseNotificationPreferenceReturn {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load preference from AsyncStorage on mount
  // Requirements: 3.1, 3.2, 3.3
  useEffect(() => {
    const initializePreference = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const storedPreference = await loadPreference();

        if (storedPreference !== null) {
          // Apply stored preference
          // Requirements: 3.2
          setIsEnabled(storedPreference);
          await applyOneSignalPreference(storedPreference);
        } else {
          // Default to enabled when no stored preference exists
          // Requirements: 3.3
          setIsEnabled(true);
          await applyOneSignalPreference(true);
        }
      } catch (err) {
        console.error(
          "[useNotificationPreference] Failed to load preference:",
          err
        );
        // Default to enabled on error
        setIsEnabled(true);
        setError(
          err instanceof Error ? err : new Error("Failed to load preference")
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializePreference();
  }, []);

  /**
   * Apply notification preference to OneSignal SDK.
   * Enables or disables push notifications.
   */
  const applyOneSignalPreference = async (enabled: boolean): Promise<void> => {
    try {
      if (enabled) {
        // Enable push notifications
        OneSignal.User.pushSubscription.optIn();
      } else {
        // Disable push notifications
        OneSignal.User.pushSubscription.optOut();
      }
    } catch (err) {
      console.error(
        "[useNotificationPreference] OneSignal preference update failed:",
        err
      );
      throw err;
    }
  };

  /**
   * Toggle the notification preference.
   * Implements optimistic update pattern with rollback on failure.
   *
   * Requirements: 2.1, 2.2, 2.3, 4.3, 4.4
   */
  const togglePreference = useCallback(async (): Promise<void> => {
    const previousValue = isEnabled;
    const newValue = !isEnabled;

    try {
      setIsLoading(true);
      setError(null);

      // Optimistic update
      setIsEnabled(newValue);

      // Update OneSignal subscription
      // Requirements: 2.1, 2.2
      await applyOneSignalPreference(newValue);

      // Persist to AsyncStorage
      // Requirements: 2.3
      await savePreference(newValue);
    } catch (err) {
      // Rollback on failure
      // Requirements: 4.3
      console.error(
        "[useNotificationPreference] Toggle failed, rolling back:",
        err
      );
      setIsEnabled(previousValue);
      setError(
        err instanceof Error ? err : new Error("Failed to save preference")
      );
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  return {
    isEnabled,
    isLoading,
    error,
    togglePreference,
  };
}
