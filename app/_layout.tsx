import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
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

import { useColorScheme } from "@/hooks/use-color-scheme";

// Disable Reanimated strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // OneSignal Initialization
    OneSignal.initialize("cf9e7276-32f7-4b1c-9859-cf09d2ff0779");

    // Request notification permissions
    OneSignal.Notifications.requestPermission(true);

    // Optional: Handle notification events
    OneSignal.Notifications.addEventListener("click", (event) => {
      console.log("OneSignal: notification clicked:", event);
    });

    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event) => {
        console.log("OneSignal: notification will show in foreground:", event);
        event.preventDefault();
        event.getNotification().display();
      }
    );
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
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
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
