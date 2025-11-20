import { Image } from "expo-image";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function OnboardingScreen3() {
  const router = useRouter();

  const handleContinue = () => {
    // TODO: Set AsyncStorage flag and navigate to main app
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center px-4">
        {/* Logo */}
        <Image
          source={require("@/assets/images/swissbel-logo.svg")}
          style={{ width: 209.53, height: 43.29 }}
          className="mt-[52px]"
          contentFit="contain"
        />

        {/* Illustration */}
        <Image
          source={require("@/assets/images/onboarding-3-illustration-3420cb.png")}
          style={{ width: 320, height: 225 }}
          className="mt-[55px]"
          contentFit="contain"
        />

        {/* Slider Indicator */}
        <Image
          source={require("@/assets/images/slider-3.svg")}
          style={{ width: 80, height: 5 }}
          className="mt-3"
          contentFit="contain"
        />

        {/* Content */}
        <View className="w-[358px] gap-5 mt-[37px] items-center">
          <Text className="text-text-primary text-2xl font-semibold text-center leading-[29px]">
            One App, Two Experiences
          </Text>
          <Text className="text-text-secondary text-sm text-center leading-5">
            Access both Hotel Booking and Member Loyalty in one seamless
            platform. Choose your journey after you sign in.
          </Text>
        </View>

        {/* Continue Button */}
        <View className="w-[358px] mt-[50px]">
          <TouchableOpacity
            className="bg-primary rounded-[10px] py-2.5 px-2.5 items-center"
            onPress={handleContinue}
          >
            <Text className="text-white text-sm font-medium leading-5">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
