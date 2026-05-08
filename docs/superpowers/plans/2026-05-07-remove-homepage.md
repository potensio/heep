# Remove Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the native homepage screen and make the SwissBelhotel booking webview the root screen, moving the bell icon into the webview bar and relying on native device navigation for in-webview back/forward.

**Architecture:** The `(tabs)` group and `HomeScreen` are deleted. A new `main-webview` screen becomes the post-onboarding destination. `WebViewScreen` gains three optional props (`showBackButton`, `rightAction`, `trapBackAtRoot`) to support the different needs of the main view vs deep-link stack screens. Native navigation handles in-page back on both platforms.

**Tech Stack:** Expo Router, React Native WebView, OneSignal (via existing `useNotifications` hook), React Native BackHandler (Android), `allowsBackForwardNavigationGestures` (iOS WebView prop)

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `src/components/ui/WebViewScreen.tsx` | Add `showBackButton`, `rightAction`, `trapBackAtRoot` props; update BackHandler; add iOS swipe gesture |
| Create | `app/main-webview.tsx` | New root screen — webview with bell icon in header |
| Modify | `app/index.tsx` | Redirect to `/main-webview` instead of `/(tabs)` |
| Modify | `app/_layout.tsx` | Add `main-webview` Stack.Screen; remove `(tabs)` Screen |
| Modify | `src/screens/index.ts` | Remove `HomeScreen` export |
| Delete | `src/screens/HomeScreen.tsx` | No longer needed |
| Delete | `app/(tabs)/index.tsx` | No longer needed |
| Delete | `app/(tabs)/_layout.tsx` | No longer needed |

---

## Task 1: Update WebViewScreen

**Files:**
- Modify: `src/components/ui/WebViewScreen.tsx`

### Context
Current props: `url`, `injectedJavaScript`, `injectedJavaScriptBeforeContentLoaded`.
Current header: Left = Back button (arrow + text), Right = Close (✕) button.
Current BackHandler: returns `false` when `!canGoBack`, which lets Android pop the navigation stack.

We need three new optional props:
- `showBackButton` — hides the Back arrow when false (main-webview has no use for it; native handles back)
- `rightAction` — renders a custom node in place of the Close button (used by main-webview for the bell)
- `trapBackAtRoot` — when `true`, BackHandler returns `true` at webview root (prevents Android from exiting the app when on the main screen)

We also enable `allowsBackForwardNavigationGestures` unconditionally — this is an iOS-only WebView prop that enables Safari-style swipe-to-go-back within the page history. It is a no-op on Android.

- [ ] **Step 1: Replace the entire file content**

```tsx
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

interface WebViewScreenProps {
  url: string;
  injectedJavaScript?: string;
  injectedJavaScriptBeforeContentLoaded?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  trapBackAtRoot?: boolean;
}

export function WebViewScreen({
  url,
  injectedJavaScript,
  injectedJavaScriptBeforeContentLoaded,
  showBackButton = true,
  rightAction,
  trapBackAtRoot = false,
}: WebViewScreenProps): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleGoBack = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    if (trapBackAtRoot) {
      return true;
    }
    return false;
  }, [canGoBack, trapBackAtRoot]);

  const handleClose = () => {
    router.back();
  };

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
        {showBackButton ? (
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
        ) : (
          <View style={styles.placeholder} />
        )}

        {rightAction ?? (
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1F1F1F" />
          </TouchableOpacity>
        )}
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
        allowsBackForwardNavigationGestures={true}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={
          injectedJavaScriptBeforeContentLoaded
        }
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={() => {}}
        setSupportMultipleWindows={false}
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
  placeholder: {
    width: 40,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `WebViewScreen.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/WebViewScreen.tsx
git commit -m "feat: add showBackButton, rightAction, trapBackAtRoot props to WebViewScreen"
```

---

## Task 2: Create main-webview screen

**Files:**
- Create: `app/main-webview.tsx`

### Context
This is the new root screen. It loads the same SwissBelhotel URL as the current `booking-webview.tsx` (including UTM params and scripts). It passes `showBackButton={false}` and `trapBackAtRoot={true}` to WebViewScreen, and supplies a bell icon with unread badge as `rightAction`.

The bell icon SVG is the same one currently in `HomeScreen.tsx` — copy it here.

- [ ] **Step 1: Create the file**

```tsx
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { WebViewScreen } from "@/src/components/ui";
import { useNotifications } from "@/src/hooks";
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

function BellIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9ZM13.73 21a2 2 0 0 1-3.46 0"
        stroke="#1F1F1F"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellButton() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity
      onPress={() => router.push("/notifications")}
      className="relative p-2"
    >
      <BellIcon />
      {unreadCount > 0 && (
        <View className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F04F31]" />
      )}
    </TouchableOpacity>
  );
}

export default function MainWebView() {
  const bookingUrl = appendUtmParams(getSwissBelhotelUrl());

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <WebViewScreen
        url={bookingUrl}
        injectedJavaScript={COMBINED_SCRIPT}
        showBackButton={false}
        trapBackAtRoot={true}
        rightAction={<BellButton />}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/main-webview.tsx
git commit -m "feat: add main-webview as new root screen with bell icon"
```

---

## Task 3: Update app routing

**Files:**
- Modify: `app/index.tsx`
- Modify: `app/_layout.tsx`

### Context
`app/index.tsx` currently redirects to `/(tabs)` after onboarding. It must redirect to `/main-webview` instead.
`app/_layout.tsx` must register `main-webview` as a Stack screen and remove the `(tabs)` screen registration.

- [ ] **Step 1: Update `app/index.tsx`**

Replace the file with:

```tsx
import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { storage } from "@/src/lib/storage";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await storage.hasSeenOnboarding();
      setHasSeenOnboarding(seen);
      setIsLoading(false);
    };
    checkOnboarding();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#B8860B" />
      </View>
    );
  }

  if (hasSeenOnboarding) {
    return <Redirect href="/main-webview" />;
  }

  return <Redirect href="/(onboarding)" />;
}
```

- [ ] **Step 2: Update `app/_layout.tsx`**

Find the `<Stack>` block and replace it so `main-webview` is registered and `(tabs)` is removed:

```tsx
<Stack>
  <Stack.Screen name="index" options={{ headerShown: false }} />
  <Stack.Screen
    name="(onboarding)"
    options={{ headerShown: false }}
  />
  <Stack.Screen name="main-webview" options={{ headerShown: false }} />
  <Stack.Screen
    name="booking-webview"
    options={{ headerShown: false }}
  />
  <Stack.Screen
    name="member-loyalty-webview"
    options={{ headerShown: false }}
  />
  <Stack.Screen
    name="notifications"
    options={{ headerShown: false }}
  />
  <Stack.Screen
    name="notification-webview"
    options={{ headerShown: false }}
  />
  <Stack.Screen
    name="modal"
    options={{ presentation: "modal", title: "Modal" }}
  />
</Stack>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/index.tsx app/_layout.tsx
git commit -m "feat: redirect to main-webview after onboarding, remove (tabs) from stack"
```

---

## Task 4: Remove HomeScreen and tabs group

**Files:**
- Modify: `src/screens/index.ts`
- Delete: `src/screens/HomeScreen.tsx`
- Delete: `app/(tabs)/index.tsx`
- Delete: `app/(tabs)/_layout.tsx`

### Context
`HomeScreen` is no longer used anywhere. `(tabs)` only existed to host it. Removing these files ensures no dead code remains and avoids Expo Router picking up the `(tabs)` route.

- [ ] **Step 1: Remove HomeScreen from screens index**

Replace `src/screens/index.ts` with:

```ts
export { default as NotificationsScreen } from "./NotificationsScreen";
export { default as OnboardingScreen } from "./OnboardingScreen";
```

- [ ] **Step 2: Delete the HomeScreen file**

```bash
rm src/screens/HomeScreen.tsx
```

- [ ] **Step 3: Delete the tabs group**

```bash
rm app/\(tabs\)/index.tsx app/\(tabs\)/_layout.tsx
rmdir app/\(tabs\)
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If `HomeScreen` is still referenced anywhere, this will catch it.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove HomeScreen and (tabs) group"
```

---

## Task 5: Manual verification checklist

Run the app on a simulator or device and verify:

- [ ] **Fresh install (no onboarding seen):** app opens to onboarding screen
- [ ] **After completing onboarding:** app redirects to SwissBelhotel website in fullscreen webview
- [ ] **Bell icon visible** in top-right of webview header
- [ ] **Bell badge appears** when there are unread notifications
- [ ] **Tapping bell** opens the Notifications screen
- [ ] **Back arrow in Notifications screen** returns to webview
- [ ] **Navigating within the website** (clicking links): Back icon and Close icon still work in `booking-webview` and `member-loyalty-webview` if accessed via deep link
- [ ] **Android hardware back at webview root:** does nothing (app does not exit)
- [ ] **Android hardware back mid-site:** goes back one page in the website
- [ ] **iOS swipe-from-left on webview:** goes back one page in the website (same as Safari)
- [ ] **No crash on cold start**
