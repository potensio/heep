import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { FjallaOne_400Regular } from "@expo-google-fonts/fjalla-one";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import "../global.css";

// Disable Reanimated strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

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
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="sell" 
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="product" 
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
