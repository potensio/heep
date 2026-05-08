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

const COMBINED_SCRIPT = combineScripts(
  getTargetBlankHandlerScript(),
  getAnalyticsInjectionScript(),
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
