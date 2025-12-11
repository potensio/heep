import { Stack } from "expo-router";
import { WebViewScreen } from "@/src/components/ui";
import {
  appendUtmParams,
  getAnalyticsInjectionScript,
} from "@/src/utils/analytics";

const ANALYTICS_SCRIPT = getAnalyticsInjectionScript("loyalty");

// URL with UTM parameters for GA4 attribution
const LOYALTY_URL = appendUtmParams(
  "https://sbec.swiss-belhotel.com/login",
  "loyalty"
);

export default function MemberLoyaltyWebView() {
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen url={LOYALTY_URL} injectedJavaScript={ANALYTICS_SCRIPT} />
    </>
  );
}
