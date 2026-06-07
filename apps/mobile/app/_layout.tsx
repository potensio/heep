import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { enableScreens } from "react-native-screens";
import { useMMKVString } from "react-native-mmkv";
import { AUTH_STORAGE_KEYS } from "@/features/auth/store/auth.store";
import {
  DMSans_200ExtraLight,
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@/context/ThemeContext";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "../global.css";

enableScreens();
SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const [accessToken] = useMMKVString(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === 'auth';
    if (!accessToken && !inAuthGroup) {
      router.replace('/auth');
    } else if (accessToken && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [accessToken, segments]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "DM-Sans-ExtraLight": DMSans_200ExtraLight,
    "DM-Sans-Light": DMSans_300Light,
    "DM-Sans": DMSans_400Regular,
    "DM-Sans-Medium": DMSans_500Medium,
    "DM-Sans-SemiBold": DMSans_600SemiBold,
    "DM-Sans-Bold": DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <GluestackUIProvider>
            <BottomSheetModalProvider>
              <AuthGuard />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="conversation/[id]" />
              </Stack>
            </BottomSheetModalProvider>
          </GluestackUIProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
