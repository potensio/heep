import React from "react";
import {
  View,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useThemeColor } from "@/src/hooks/use-theme-color";

/**
 * Props for the NotificationToggle component.
 * Requirements: 1.2, 1.3, 1.4, 4.1, 4.2
 */
export interface NotificationToggleProps {
  /** Current enabled state */
  isEnabled: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Callback when toggle is pressed */
  onToggle: () => void;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * A toggle switch component for enabling/disabling push notifications.
 *
 * Features:
 * - Displays on/off visual states based on isEnabled prop
 * - Shows loading indicator during async operations
 * - Styled to match app theme colors
 * - Accessible with proper labels and touch targets
 *
 * Requirements: 1.2, 1.3, 1.4, 4.1, 4.2, 5.1, 5.2, 5.3
 */
export function NotificationToggle({
  isEnabled,
  isLoading,
  onToggle,
  testID = "notification-toggle",
}: NotificationToggleProps): JSX.Element {
  const tintColor = useThemeColor({}, "tint");
  const iconColor = useThemeColor({}, "icon");

  // Track color for enabled state (iOS uses this for the background when on)
  const trackColorOn = Platform.OS === "ios" ? tintColor : tintColor;
  // Track color for disabled state
  const trackColorOff = Platform.OS === "ios" ? "#767577" : iconColor;

  return (
    <View style={styles.container} testID={testID}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={tintColor}
            testID={`${testID}-loading`}
            accessibilityLabel="Loading notification preference"
          />
        </View>
      ) : (
        <Switch
          testID={`${testID}-switch`}
          value={isEnabled}
          onValueChange={onToggle}
          trackColor={{
            false: trackColorOff,
            true: trackColorOn,
          }}
          thumbColor={isEnabled ? "#ffffff" : "#f4f3f4"}
          ios_backgroundColor={trackColorOff}
          // Accessibility attributes
          // Requirements: 5.1, 5.2, 5.3
          accessibilityLabel={`Push notifications ${isEnabled ? "enabled" : "disabled"}. Double tap to ${isEnabled ? "disable" : "enable"}.`}
          accessibilityRole="switch"
          accessibilityState={{ checked: isEnabled }}
          accessibilityHint="Toggle to enable or disable push notifications"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Ensure minimum 44x44 touch target
    // Requirements: 5.3
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    // Match switch dimensions for consistent layout
    width: 51, // Default Switch width on iOS
    height: 31, // Default Switch height on iOS
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NotificationToggle;
