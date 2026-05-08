# Design: Remove Main Homepage

**Date:** 2026-05-07
**Status:** Approved

---

## Context

The client has refined their landing page to serve both the booking site and SBEC in one place. The app's native homepage is now redundant. We are removing it and making the SwissBelhotel booking webview the root screen of the app.

---

## Decisions

| Item | Decision |
|---|---|
| Notification bell | Move to webview top bar (right side, replaces Close button) |
| Close button | Remove |
| In-app Back button | Remove — rely on native device navigation |
| Android hardware back | Intercept via BackHandler → in-webview navigation; do nothing at webview root |
| iOS swipe-back | Enable `allowsBackForwardNavigationGestures` on WebView |
| Language switcher | Remove — the website handles its own language toggle |
| Member Loyalty card | Remove from UI; keep route in `_layout.tsx` for deep link compatibility |
| `(tabs)` group | Retire — no longer needed |

---

## New App Flow

```
app/index.tsx
  → hasSeenOnboarding? → /(onboarding)
  → else             → /main-webview  (new root screen)

/notifications        → opens on top of /main-webview
/notification-webview → opens on top of /main-webview
```

---

## Changes Required

### 1. New root screen: `app/main-webview.tsx`
- Replaces `(tabs)/index.tsx` as the post-onboarding destination
- Loads the SwissBelhotel booking URL (same as current `booking-webview.tsx`)
- No Back button, no Close button
- Bell icon on the right of the top bar with unread badge
- Tapping bell → `router.push('/notifications')`

### 2. Update `WebViewScreen` component
- Remove Back button UI
- Remove Close button UI
- Add optional `rightAction` prop (used by main-webview to render bell icon)
- Enable `allowsBackForwardNavigationGestures` (iOS in-webview swipe)
- `BackHandler`: when `canGoBack` → go back in webview; when at root → do nothing (return `true` to trap)

### 3. Update `app/index.tsx`
- Change redirect from `/(tabs)` to `/main-webview`

### 4. Update `app/_layout.tsx`
- Add `Stack.Screen` for `main-webview`
- Remove `Stack.Screen` for `(tabs)` (or keep quietly for now)

### 5. Update `NotificationsScreen`
- Change back action from `router.back()` to `router.back()` — this stays correct since notifications is always pushed on top of main-webview

### 6. Remove `HomeScreen` and `(tabs)` group
- `src/screens/HomeScreen.tsx` — delete
- `app/(tabs)/` directory — delete

### 7. Remove Language Switcher
- `src/components/ui/LanguageSwitcher.tsx` — no longer used in any screen (keep file, just stop referencing it)

---

## Out of Scope
- `member-loyalty-webview` route — kept as-is for deep link compatibility, not linked from UI
- `booking-webview` route — kept as-is (may still be used by deep links)
- Onboarding flow — no changes
- Notification infrastructure — no changes
