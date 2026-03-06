import { Stack } from "expo-router";
import { WebViewScreen } from "@/src/components/ui";
import {
  appendUtmParams,
  getAnalyticsInjectionScript,
} from "@/src/utils/analytics";
import {
  getTargetBlankHandlerScript,
  combineScripts,
} from "@/src/utils/webview-scripts";

// Analytics tracking
const ANALYTICS_SCRIPT = getAnalyticsInjectionScript();

// Handle target="_blank" links
const TARGET_BLANK_SCRIPT = getTargetBlankHandlerScript();

// Combine scripts (no element hiding needed for loyalty page)
const COMBINED_SCRIPT = combineScripts(TARGET_BLANK_SCRIPT, ANALYTICS_SCRIPT);

// URL with UTM parameters for GA4 attribution
const LOYALTY_URL = appendUtmParams("https://sbec.swiss-belhotel.com/login");

export default function MemberLoyaltyWebView() {
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen url={LOYALTY_URL} injectedJavaScript={COMBINED_SCRIPT} />
    </>
  );
}
