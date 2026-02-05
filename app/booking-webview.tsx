import { Stack } from "expo-router";
import { WebViewScreen } from "@/src/components/ui";
import {
  appendUtmParams,
  getAnalyticsInjectionScript,
} from "@/src/utils/analytics";

const ANALYTICS_SCRIPT = getAnalyticsInjectionScript();

// URL with UTM parameters for GA4 attribution
const BOOKING_URL = appendUtmParams("https://www.swiss-belhotel.com/");

export default function BookingWebView() {
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen url={BOOKING_URL} injectedJavaScript={ANALYTICS_SCRIPT} />
    </>
  );
}
