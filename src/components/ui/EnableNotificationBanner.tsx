import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { OneSignal } from "react-native-onesignal";

/**
 * A banner component that prompts users to enable notifications.
 * Only shows when notification permission has not been granted.
 * Triggers the native permission popup when tapped.
 */
export function EnableNotificationBanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const permission = await OneSignal.Notifications.getPermissionAsync();
    setHasPermission(permission);
  };

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const result = await OneSignal.Notifications.requestPermission(true);
      setHasPermission(result);
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    } finally {
      setIsRequesting(false);
    }
  };

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
            Enable Notifications
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default EnableNotificationBanner;
