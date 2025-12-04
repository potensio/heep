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
import firebase from "@react-native-firebase/app";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { NotificationProvider } from "@/contexts/NotificationContext";

// Firebase auto-initializes from native config files (google-services.json / GoogleService-Info.plist)
// We just log the status here - actual initialization happens in native code
try {
  const apps = firebase.apps;
  if (apps && apps.length > 0) {
    console.log("Firebase sudah ter-inisialisasi");
  } else {
    console.log(
      "Firebase belum ter-inisialisasi - akan auto-init dari native config"
    );
  }
} catch (error) {
  console.log("Firebase check error (ini normal jika belum ready):", error);
}

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
    console.log("OneSignal App ID:", appId);
    if (appId) {
      console.log("Initializing OneSignal with App ID:", appId);
      OneSignal.initialize(appId);

      // Request notification permissions
      console.log("Requesting notification permission...");
      OneSignal.Notifications.requestPermission(true);

      // Optional: Handle notification events
      OneSignal.Notifications.addEventListener("click", (event) => {
        console.log("OneSignal: notification clicked:", event);
      });

      OneSignal.Notifications.addEventListener(
        "foregroundWillDisplay",
        (event) => {
          console.log(
            "OneSignal: notification will show in foreground:",
            event
          );
          event.preventDefault();
          event.getNotification().display();
        }
      );
    } else {
      console.error("OneSignal App ID not found in environment variables!");
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <NotificationProvider>
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
        </NotificationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
