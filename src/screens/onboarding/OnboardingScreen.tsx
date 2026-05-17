import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-white"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-xl font-bold text-gray-800">Onboarding</Text>
      <Text className="text-gray-500 mt-2">Welcome to the app!</Text>
    </View>
  );
}
