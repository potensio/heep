import { Stack, useLocalSearchParams } from "expo-router";
import { WebViewScreen } from "@/src/components/ui";

export default function NotificationWebView() {
  const { url } = useLocalSearchParams<{ url: string }>();

  if (!url) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <WebViewScreen url={url} />
    </>
  );
}
