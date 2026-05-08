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
import { getSwissBelhotelUrl } from "@/src/utils/url-helpers";

// Analytics tracking
const ANALYTICS_SCRIPT = getAnalyticsInjectionScript();

// Handle target="_blank" links
const TARGET_BLANK_SCRIPT = getTargetBlankHandlerScript();

// Hide login button (element ID: ff093436)
// Conservative settings: checks every 1 second, max 10 attempts (10 seconds total)
// COMMENTED OUT: Temporarily disabled - uncomment to restore element hiding
// const HIDE_LOGIN_BUTTON_SCRIPT = getHideElementScript({
//   elementId: "ff093436",
//   checkInterval: 1000, // 1 second between checks
//   maxChecks: 10, // 10 attempts max
// });

// Combine all scripts (without element hiding for now)
const COMBINED_SCRIPT = combineScripts(
  // HIDE_LOGIN_BUTTON_SCRIPT, // Commented out
  TARGET_BLANK_SCRIPT,
  ANALYTICS_SCRIPT,
);

export default function BookingWebView() {
  // Get URL based on current language (id -> /id, en -> /)
  const bookingUrl = appendUtmParams(getSwissBelhotelUrl());

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen url={bookingUrl} injectedJavaScript={COMBINED_SCRIPT} />
    </>
  );
}
