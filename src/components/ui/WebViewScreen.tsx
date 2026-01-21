import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Text,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Script to remove target="_blank" from all links on page load and for dynamically added links
const REMOVE_TARGET_BLANK_SCRIPT = `
  (function() {
    function removeTargetBlank() {
      document.querySelectorAll('a[target="_blank"]').forEach(function(link) {
        link.removeAttribute('target');
      });
    }
    
    // Run on initial load
    removeTargetBlank();
    
    // Observe DOM changes for dynamically added links
    const observer = new MutationObserver(removeTargetBlank);
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  true;
`;

interface WebViewScreenProps {
  url: string;
  injectedJavaScript?: string;
  injectedJavaScriptBeforeContentLoaded?: string;
}

export function WebViewScreen({
  url,
  injectedJavaScript,
  injectedJavaScriptBeforeContentLoaded,
}: WebViewScreenProps): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  // Combine the target="_blank" removal script with any custom injected JS
  const combinedInjectedJS = injectedJavaScript
    ? `${REMOVE_TARGET_BLANK_SCRIPT}\n${injectedJavaScript}`
    : REMOVE_TARGET_BLANK_SCRIPT;

  const handleGoBack = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  }, [canGoBack]);

  const handleClose = () => {
    router.back();
  };

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleGoBack,
    );
    return () => backHandler.remove();
  }, [handleGoBack]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          disabled={!canGoBack}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={canGoBack ? "#1F1F1F" : "#CCCCCC"}
          />
          <Text
            style={[styles.backText, !canGoBack && styles.backTextDisabled]}
          >
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1F1F1F" />
        </TouchableOpacity>
      </View>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={[styles.webview, { marginBottom: insets.bottom }]}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        startInLoadingState={true}
        cacheEnabled={true}
        incognito={false}
        injectedJavaScript={combinedInjectedJS}
        injectedJavaScriptBeforeContentLoaded={
          injectedJavaScriptBeforeContentLoaded
        }
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F1F1F",
  },
  backTextDisabled: {
    color: "#CCCCCC",
  },
  closeButton: {
    padding: 8,
  },
  webview: {
    flex: 1,
  },
});
