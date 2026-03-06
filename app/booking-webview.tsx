import { Stack } from "expo-router";
import { WebViewScreen } from "@/src/components/ui";
import {
  appendUtmParams,
  getAnalyticsInjectionScript,
} from "@/src/utils/analytics";
import {
  getHideElementScript,
  getTargetBlankHandlerScript,
  combineScripts,
} from "@/src/utils/webview-scripts";

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

// URL with UTM parameters for GA4 attribution
const BOOKING_URL = appendUtmParams("https://www.swiss-belhotel.com/");

export default function BookingWebView() {
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen url={BOOKING_URL} injectedJavaScript={COMBINED_SCRIPT} />
    </>
  );
}
