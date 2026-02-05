import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

const SWISSBELHOTEL_URL = "https://www.swiss-belhotel.com/";

export default function InAppBrowser() {
  const router = useRouter();

  useEffect(() => {
    const openBrowser = async () => {
      await WebBrowser.openBrowserAsync(SWISSBELHOTEL_URL);
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
