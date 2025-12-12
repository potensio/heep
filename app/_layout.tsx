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
import { OneSignal } from "react-native-onesignal";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { ErrorBoundary } from "@/src/components/ui";
import { queryClient } from "@/src/lib/query-client";

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

      OneSignal.initialize(appId);

      // Check current permission status
      const hasPermission = await OneSignal.Notifications.getPermissionAsync();

      if (hasPermission) {
        // Already granted - ensure subscription is active
        OneSignal.User.pushSubscription.optIn();
      } else {
        // Request permission if not yet asked
        // OneSignal tracks if permission was already requested, so this won't
        // show the popup again if user already denied or dismissed it
        await OneSignal.Notifications.requestPermission(true);
      }

      // Deep link from OneSignal launchURL will be handled automatically by Expo Router
      // Format: swissbelhotelapp://notification-webview?url=https://example.com

      OneSignal.Notifications.addEventListener(
        "foregroundWillDisplay",
        (event) => {
          event.preventDefault();
          event.getNotification().display();
        }
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
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
