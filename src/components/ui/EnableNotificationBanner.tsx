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
 * On iOS, opens Settings since permission can only be requested once.
 * On Android, triggers the native permission popup.
 */
export function EnableNotificationBanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    // Always check actual permission status from the system
    const permission = await OneSignal.Notifications.getPermissionAsync();
    setHasPermission(permission);
  };

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      if (Platform.OS === "ios") {
        // On iOS, once permission is denied, we can only direct users to Settings
        // The system won't show the prompt again
        await Linking.openSettings();
        // Re-check permission when user returns (handled by useEffect on focus)
      } else {
        // On Android, we can request permission again
        const result = await OneSignal.Notifications.requestPermission(true);
        setHasPermission(result);
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    } finally {
      setIsRequesting(false);
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
  }, [isRequesting]);

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
      <TouchableOpacity
        onPress={handleEnableNotifications}
        disabled={isRequesting}
        className="bg-[#F04F31] py-2.5 px-4 rounded-lg items-center"
        activeOpacity={0.7}
      >
        {isRequesting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-white text-sm font-medium">
            {Platform.OS === "ios" ? "Open Settings" : "Enable Notifications"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default EnableNotificationBanner;
