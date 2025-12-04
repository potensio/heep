# Deep Link Implementation Tasks

## Task 1: Create Route Constants

- [ ] Create `constants/routes.ts`
- [ ] Define route mapping object (deep link path → app route)
- [ ] Export route constants for type safety

## Task 2: Create Deep Link Utilities

- [ ] Create `utils/deepLinkHandler.ts`
- [ ] Implement `parseDeepLink(url)` function
- [ ] Implement `getRouteFromPath(path)` function
- [ ] Implement `isValidRoute(path)` function
- [ ] Add proper TypeScript types

## Task 3: Create useDeepLink Hook

- [ ] Create `hooks/useDeepLink.ts`
- [ ] Setup `Linking.getInitialURL()` for cold start
- [ ] Setup `Linking.addEventListener('url')` for warm start
- [ ] Return parsed deep link data
- [ ] Handle cleanup on unmount

## Task 4: Integrate Deep Link in Root Layout

- [ ] Import useDeepLink hook in `app/_layout.tsx`
- [ ] Add navigation logic based on deep link data
- [ ] Ensure navigation happens after router is ready
- [ ] Test cold start and warm start scenarios

## Task 5: Integrate OneSignal with Deep Link

- [ ] Modify OneSignal click handler in `app/_layout.tsx`
- [ ] Extract `deepLink` from notification data
- [ ] Trigger navigation using deep link handler
- [ ] Handle edge cases (no deep link in payload)

## Task 6: Update WebView Screens for Query Params

- [ ] Modify `app/booking-webview.tsx` to accept query params
- [ ] Modify `app/member-loyalty-webview.tsx` to accept query params
- [ ] Pass query params to WebView URL if needed

## Task 7: Testing & Validation

- [ ] Test deep link via simulator command
- [ ] Test OneSignal notification with deep link
- [ ] Test invalid/malformed URLs
- [ ] Test cold start vs warm start behavior
- [ ] Document testing commands in BUILD.md
