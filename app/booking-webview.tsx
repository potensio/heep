import { Stack } from "expo-router";
import { WebViewScreen } from "@/src/components/ui";
import {
  appendUtmParams,
  getAnalyticsInjectionScript,
} from "@/src/utils/analytics";

const HIDE_ELEMENT_SCRIPT = `
  (function() {
    var style = document.createElement('style');
    style.textContent = '#ff093436 { display: none !important; visibility: hidden !important; }';
    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        document.head.appendChild(style);
      });
    }
  })();
  true;
`;

const ANALYTICS_SCRIPT = getAnalyticsInjectionScript();
const COMBINED_SCRIPT = HIDE_ELEMENT_SCRIPT + ANALYTICS_SCRIPT;

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
