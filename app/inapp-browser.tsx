import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { getSwissBelhotelUrl } from "@/src/utils/url-helpers";

export default function InAppBrowser() {
  const router = useRouter();

  useEffect(() => {
    const openBrowser = async () => {
      // Get URL based on current language (id -> /id, en -> /)
      const url = getSwissBelhotelUrl();
      await WebBrowser.openBrowserAsync(url);
      // Navigate back after browser is closed
      router.back();
    };

    openBrowser();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Opening browser...</Text>
    </View>
  );
}
