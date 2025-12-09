import { Stack } from "expo-router";
import { WebViewScreen } from "@/src/components/ui";

export default function MemberLoyaltyWebView() {
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen url="https://sbec.swiss-belhotel.com/login" />
    </>
  );
}
