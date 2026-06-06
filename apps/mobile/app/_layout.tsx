import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { FjallaOne_400Regular } from "@expo-google-fonts/fjalla-one";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { ThemeProvider } from "@/context/ThemeContext";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "../global.css";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Fjalla-One": FjallaOne_400Regular,
    "Plus-Jakarta": PlusJakartaSans_400Regular,
    "Plus-Jakarta-Medium": PlusJakartaSans_500Medium,
    "Plus-Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
    "Plus-Jakarta-Bold": PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <GluestackUIProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="auth" />
            </Stack>
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
