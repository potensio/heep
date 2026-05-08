import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { useEffect } from "react";
import { OneSignal, LogLevel } from "react-native-onesignal";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { ErrorBoundary } from "@/src/components/ui";
import { queryClient } from "@/src/lib/query-client";
import "@/src/i18n"; // Initialize i18n

// Disable Reanimated strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const initOneSignal = async () => {
      const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
      if (!appId) return;

      // Enable verbose logging for debugging (remove in production)
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);

      OneSignal.initialize(appId);

      // Check current permission status and opt-in if already granted
      const hasPermission = await OneSignal.Notifications.getPermissionAsync();
      if (hasPermission) {
        OneSignal.User.pushSubscription.optIn();
      }
      // Note: Permission request is handled in OnboardingScreen after user interaction
      // This is required for iOS to properly show the permission prompt

      // Deep link from OneSignal launchURL will be handled automatically by Expo Router
      // Format: swissbelhotelapp://notification-webview?url=https://example.com

      OneSignal.Notifications.addEventListener(
        "foregroundWillDisplay",
        (event) => {
          event.preventDefault();
          event.getNotification().display();
        },
      );
    };

    initOneSignal();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <ErrorBoundary>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="(onboarding)"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="main-webview" options={{ headerShown: false }} />
              <Stack.Screen
                name="booking-webview"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="member-loyalty-webview"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="notifications"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="notification-webview"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            <StatusBar style="dark" />
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
