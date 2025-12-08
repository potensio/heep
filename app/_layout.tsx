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
    // OneSignal Initialization
    const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
    if (appId) {
      OneSignal.initialize(appId);

      // Request notification permissions
      OneSignal.Notifications.requestPermission(true);

      // Handle notification events
      OneSignal.Notifications.addEventListener("click", (event) => {
        // Notification clicked - handle navigation or action here
      });

      OneSignal.Notifications.addEventListener(
        "foregroundWillDisplay",
        (event) => {
          event.preventDefault();
          event.getNotification().display();
        }
      );
    }
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
