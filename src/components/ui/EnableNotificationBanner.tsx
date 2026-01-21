import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { OneSignal } from "react-native-onesignal";

/**
 * A banner component that prompts users to enable notifications.
 * Only shows when notification permission has not been granted.
 * Shows separate buttons for iOS (opens Settings) and Android (requests permission).
 */
export function EnableNotificationBanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequestingAndroid, setIsRequestingAndroid] = useState(false);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    // Always check actual permission status from the system
    const permission = await OneSignal.Notifications.getPermissionAsync();
    setHasPermission(permission);
  };

  const handleEnableNotificationsAndroid = async () => {
    setIsRequestingAndroid(true);
    try {
      // On Android, we can request permission again
      const result = await OneSignal.Notifications.requestPermission(true);
      setHasPermission(result);
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    } finally {
      setIsRequestingAndroid(false);
    }
  };

  const handleOpenSettings = async () => {
    setIsOpeningSettings(true);
    try {
      // On iOS, once permission is denied, we can only direct users to Settings
      // The system won't show the prompt again
      await Linking.openSettings();
      // Re-check permission when user returns (handled by useEffect on focus)
    } catch (error) {
      console.error("Failed to open settings:", error);
    } finally {
      setIsOpeningSettings(false);
    }
  };

  // Re-check permission when component mounts or app comes to foreground
  useEffect(() => {
    const interval = setInterval(checkPermission, 1000);
    // Only run for 5 seconds after opening settings
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isOpeningSettings]);

  // Don't render while checking permission status
  if (hasPermission === null) {
    return null;
  }

  // Don't render if permission is already granted
  if (hasPermission) {
    return null;
  }

  return (
    <View className="mx-4 my-3 p-4 bg-[#FFF6F4] rounded-lg border border-[#F04F31]/20">
      <Text className="text-sm mb-3">
        Stay updated with exclusive offers, booking confirmations, and important
        updates.
      </Text>

      {Platform.OS === "ios" ? (
        // iOS: Open Settings button
        <TouchableOpacity
          onPress={handleOpenSettings}
          disabled={isOpeningSettings}
          className="bg-[#F04F31] py-2.5 px-4 rounded-lg items-center"
          activeOpacity={0.7}
        >
          {isOpeningSettings ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white text-sm font-medium">
              Open Settings
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        // Android: Enable Notifications button
        <TouchableOpacity
          onPress={handleEnableNotificationsAndroid}
          disabled={isRequestingAndroid}
          className="bg-[#F04F31] py-2.5 px-4 rounded-lg items-center"
          activeOpacity={0.7}
        >
          {isRequestingAndroid ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white text-sm font-medium">
              Enable Notifications
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default EnableNotificationBanner;
