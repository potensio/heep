import { createContext, useContext, useRef, ReactNode, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

interface WebViewContextType {
  bookingWebViewRef: React.RefObject<WebView | null>;
  loyaltyWebViewRef: React.RefObject<WebView | null>;
  showBookingWebView: () => void;
  hideBookingWebView: () => void;
  showLoyaltyWebView: () => void;
  hideLoyaltyWebView: () => void;
}

const WebViewContext = createContext<WebViewContextType | undefined>(undefined);

export function WebViewProvider({ children }: { children: ReactNode }) {
  const bookingWebViewRef = useRef<WebView>(null);
  const loyaltyWebViewRef = useRef<WebView>(null);
  const [bookingVisible, setBookingVisible] = useState(false);
  const [loyaltyVisible, setLoyaltyVisible] = useState(false);

  const injectedJSBooking = `
    (function() {
      const hideElement = () => {
        const element = document.getElementById('ff093436');
        if (element) {
          element.style.display = 'none';
        }
      };
      
      hideElement();
      setTimeout(hideElement, 1000);
      setTimeout(hideElement, 2000);
      
      const observer = new MutationObserver(hideElement);
      observer.observe(document.body, { childList: true, subtree: true });
    })();
    true;
  `;

  const showBookingWebView = () => setBookingVisible(true);
  const hideBookingWebView = () => setBookingVisible(false);
  const showLoyaltyWebView = () => setLoyaltyVisible(true);
  const hideLoyaltyWebView = () => setLoyaltyVisible(false);

  return (
    <WebViewContext.Provider
      value={{
        bookingWebViewRef,
        loyaltyWebViewRef,
        showBookingWebView,
        hideBookingWebView,
        showLoyaltyWebView,
        hideLoyaltyWebView,
      }}
    >
      {children}

      {/* Persistent WebViews */}
      <View style={bookingVisible ? styles.visible : styles.hidden}>
        <WebView
          ref={bookingWebViewRef}
          source={{ uri: "https://www.swiss-belhotel.com/" }}
          style={styles.webview}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          cacheEnabled={true}
          incognito={false}
          injectedJavaScript={injectedJSBooking}
        />
      </View>

      <View style={loyaltyVisible ? styles.visible : styles.hidden}>
        <WebView
          ref={loyaltyWebViewRef}
          source={{ uri: "https://sbec.swiss-belhotel.com/login" }}
          style={styles.webview}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          cacheEnabled={true}
          incognito={false}
        />
      </View>
    </WebViewContext.Provider>
  );
}

export function useWebView() {
  const context = useContext(WebViewContext);
  if (!context) {
    throw new Error("useWebView must be used within WebViewProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  hidden: {
    position: "absolute",
    top: -10000,
    left: -10000,
    width: 1,
    height: 1,
  },
  visible: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webview: {
    flex: 1,
  },
});
