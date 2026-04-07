import type { ComponentType } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image, ImageProps } from "expo-image";
import { OneSignal } from "react-native-onesignal";
import { useTranslation } from "react-i18next";
import { storage } from "@/src/lib/storage";

// Workaround for expo-image type incompatibility with React 19
const ExpoImage = Image as unknown as ComponentType<ImageProps>;

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation(["onboarding", "common"]);

  const handleGetStarted = async () => {
    await storage.setOnboardingCompleted();

    // Request notification permission after user interaction (iOS requirement)
    try {
      await OneSignal.Notifications.requestPermission(true);
    } catch (error) {
      console.log("[Onboarding] Permission request error:", error);
    }

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-between py-12 px-4">
        {/* Logo */}
        <ExpoImage
          source={require("@/assets/images/swissbel-logo.svg")}
          style={{ width: 209.53, height: 43.29 }}
          className="mt-[52px]"
          contentFit="contain"
        />

        {/* Content */}
        <View className="flex-1 w-full items-center justify-center mb-8 px-4">
          <View className="w-[358px] items-center">
            <ExpoImage
              source={require("@/assets/images/onboarding-3-illustration-3420cb.png")}
              style={{ width: 320, aspectRatio: 7 / 5, borderRadius: 12 }}
              contentFit="contain"
            />
            <Text className="text-text-primary text-2xl font-semibold text-center mt-3">
              {t("onboarding:title")}
            </Text>
            <Text className="text-text-secondary text-center leading-relaxed mt-4">
              {t("onboarding:description")}
            </Text>
          </View>
        </View>

        {/* Button */}
        <View className="w-[358px]">
          <TouchableOpacity
            className="bg-primary rounded-[10px] p-4 items-center"
            onPress={handleGetStarted}
          >
            <Text className="text-white font-medium leading-5">
              {t("common:button.getStarted")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
