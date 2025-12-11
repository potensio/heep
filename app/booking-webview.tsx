import { Stack } from "expo-router";
import { WebViewScreen } from "@/src/components/ui";
import {
  appendUtmParams,
  getAnalyticsInjectionScript,
} from "@/src/utils/analytics";

const HIDE_ELEMENT_SCRIPT = `
  (function() {
    function hideElement() {
      var el = document.getElementById('ff093436');
      if (el) el.style.display = 'none';
    }
    hideElement();
    var observer = new MutationObserver(hideElement);
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  true;
`;

const ANALYTICS_SCRIPT = getAnalyticsInjectionScript("booking");
const COMBINED_SCRIPT = HIDE_ELEMENT_SCRIPT + ANALYTICS_SCRIPT;

// URL with UTM parameters for GA4 attribution
const BOOKING_URL = appendUtmParams(
  "https://www.swiss-belhotel.com/",
  "booking"
);

export default function BookingWebView() {
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen url={BOOKING_URL} injectedJavaScript={COMBINED_SCRIPT} />
    </>
  );
}
