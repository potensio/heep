/**
 * Analytics tracking utilities for Google Analytics 4
 * Handles UTM parameters and GA4 Measurement Protocol events
 */

/**
 * Appends UTM parameters to a URL for Google Analytics tracking
 * This helps identify traffic coming from the mobile app's WebView
 *
 * @param baseUrl - The original URL to append UTM params to
 * @returns URL string with UTM parameters appended
 */
export function appendUtmParams(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", "swissbelhotel_app");
  url.searchParams.set("utm_medium", "mobile_webview");
  return url.toString();
}

/**
 * GA4 Measurement Protocol credentials
 * Used for sending events directly to Google Analytics
 */
const GA4_MEASUREMENT_ID = "G-4LQG9NVQ0E";
const GA4_API_SECRET = "Vby52NYEQLa05JkEoaa-4g";

/**
 * Generates JavaScript to inject into WebView for GA4 tracking
 * Sends a custom event via GA4 Measurement Protocol
 *
 * Performance characteristics:
 * - Runs once after page loads
 * - Single HTTP request (async, non-blocking)
 * - Minimal storage usage (localStorage/sessionStorage)
 *
 * @returns JavaScript string to inject into WebView
 */
export function getAnalyticsInjectionScript(): string {
  return `
    (function() {
      // Generate a random client ID for this session
      function getClientId() {
        var clientId = localStorage.getItem('ga_client_id');
        if (!clientId) {
          clientId = Math.random().toString(36).substring(2) + '.' + Date.now();
          localStorage.setItem('ga_client_id', clientId);
        }
        return clientId;
      }
      
      // Send event directly to GA4 via Measurement Protocol
      function sendToGA4() {
        var clientId = getClientId();
        var url = 'https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}';
        
        var sessionId = sessionStorage.getItem('ga_session_id');
        if (!sessionId) {
          sessionId = Date.now().toString();
          sessionStorage.setItem('ga_session_id', sessionId);
        }
        
        var payload = {
          client_id: clientId,
          user_properties: {
            traffic_source: { value: 'swissbelhotel_app' }
          },
          events: [{
            name: 'app_webview_visit',
            params: {
              session_id: sessionId,
              engagement_time_msec: 1000,
              event_category: 'app_traffic',
              source: 'swissbelhotel_app',
              medium: 'mobile_webview',
              page_location: window.location.href,
              page_title: document.title
            }
          }]
        };
        
        fetch(url, {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        .then(function() {
          console.log('[SwissBelhotelApp] GA4 Measurement Protocol event sent');
        })
        .catch(function(err) {
          console.error('[SwissBelhotelApp] GA4 error:', err);
        });
      }
      
      // Send after page loads
      if (document.readyState === 'complete') {
        setTimeout(sendToGA4, 1000);
      } else {
        window.addEventListener('load', function() {
          setTimeout(sendToGA4, 1000);
        });
      }
    })();
    true;
  `;
}
