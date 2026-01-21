import { Stack } from "expo-router";
import { WebViewScreen } from "@/src/components/ui";
import {
  appendUtmParams,
  getAnalyticsInjectionScript,
} from "@/src/utils/analytics";

const HIDE_ELEMENT_SCRIPT = `
  (function() {
    // Inject CSS immediately to prevent flash
    var style = document.createElement('style');
    style.id = 'hide-element-style';
    style.textContent = '#ff093436 { display: none !important; visibility: hidden !important; }';
    
    // Try to append immediately (for early injection)
    if (document.head) {
      document.head.appendChild(style);
    } else if (document.documentElement) {
      document.documentElement.appendChild(style);
    }
  })();
  true;
`;

const HIDE_ELEMENT_OBSERVER_SCRIPT = `
  (function() {
    function hideElement() {
      // Ensure style exists
      var style = document.getElementById('hide-element-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'hide-element-style';
        style.textContent = '#ff093436 { display: none !important; visibility: hidden !important; }';
        document.head.appendChild(style);
      }
      
      // Also directly hide if element exists
      var element = document.getElementById('ff093436');
      if (element) {
        element.style.display = 'none';
        element.style.visibility = 'hidden';
      }
    }
    
    // Run immediately if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideElement);
    } else {
      hideElement();
    }
    
    // Watch for dynamically added elements (for iOS)
    var observer = new MutationObserver(function() {
      var element = document.getElementById('ff093436');
      if (element) {
        element.style.display = 'none';
        element.style.visibility = 'hidden';
      }
    });
    
    // Start observing once body is available
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  })();
  true;
`;

const ANALYTICS_SCRIPT = getAnalyticsInjectionScript();
const COMBINED_AFTER_SCRIPT = HIDE_ELEMENT_OBSERVER_SCRIPT + ANALYTICS_SCRIPT;

// URL with UTM parameters for GA4 attribution
const BOOKING_URL = appendUtmParams("https://www.swiss-belhotel.com/");

export default function BookingWebView() {
  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen
        url={BOOKING_URL}
        injectedJavaScriptBeforeContentLoaded={HIDE_ELEMENT_SCRIPT}
        injectedJavaScript={COMBINED_AFTER_SCRIPT}
      />
    </>
  );
}
