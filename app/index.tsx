import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { storage } from "@/src/lib/storage";

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const seen = await storage.hasSeenOnboarding();
    setHasSeenOnboarding(seen);
    setIsChecking(false);
  };

  if (isChecking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F04E30" />
      </View>
    );
  }

  return <Redirect href={hasSeenOnboarding ? "/(tabs)" : "/(onboarding)"} />;
}
