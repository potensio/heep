import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { storage } from "@/src/lib/storage";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await storage.hasSeenOnboarding();
      setHasSeenOnboarding(seen);
      setIsLoading(false);
    };
    checkOnboarding();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#B8860B" />
      </View>
    );
  }

  if (hasSeenOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)" />;
}
