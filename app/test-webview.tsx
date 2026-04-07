import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { getSwissBelhotelUrl } from "@/src/utils/url-helpers";

/**
 * Minimal WebView for testing fixed position elements.
 * No safe area insets, no injected JS, no margins — just raw WebView.
 */
export default function TestWebView() {
  // Get URL based on current language (id -> /id, en -> /)
  const testUrl = getSwissBelhotelUrl();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Test WebView",
          gestureEnabled: true,
        }}
      />
      <View style={styles.container}>
        <WebView
          source={{ uri: testUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
