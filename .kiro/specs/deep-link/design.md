# Deep Link - Technical Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Entry Points                              │
├─────────────────┬─────────────────┬─────────────────────────┤
│   URL Scheme    │  OneSignal Tap  │    Universal Link       │
│ swissbelhotelapp://  │  notification   │    (future)            │
└────────┬────────┴────────┬────────┴─────────────────────────┘
         │                 │
         ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Deep Link Handler (hooks/useDeepLink.ts)        │
│  - Parse URL                                                 │
│  - Extract path & query params                               │
│  - Validate route                                            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Expo Router                               │
│  router.push() / router.replace()                           │
└─────────────────────────────────────────────────────────────┘
```

## Route Mapping

| Deep Link Path | Target Screen   | File                             |
| -------------- | --------------- | -------------------------------- |
| `/booking`     | Booking WebView | `app/booking-webview.tsx`        |
| `/membership`  | Member Loyalty  | `app/member-loyalty-webview.tsx` |
| `/home`        | Home Tab        | `app/(tabs)/index.tsx`           |
| `/` (root)     | Home Tab        | `app/(tabs)/index.tsx`           |

## Implementation Components

### 1. Deep Link Hook (`hooks/useDeepLink.ts`)

Custom hook yang handle:

- Listen to incoming URLs via `expo-linking`
- Parse URL menjadi path dan query params
- Return parsed data untuk navigation

```typescript
interface DeepLinkData {
  path: string;
  queryParams: Record<string, string>;
}
```

### 2. Deep Link Handler (`utils/deepLinkHandler.ts`)

Utility functions:

- `parseDeepLink(url: string): DeepLinkData` - Parse URL
- `getRouteFromPath(path: string): string` - Map path ke route
- `isValidRoute(path: string): boolean` - Validate route

### 3. Integration Points

#### A. Root Layout (`app/_layout.tsx`)

- Initialize deep link listener on mount
- Handle initial URL (cold start)
- Handle incoming URLs (warm start)

#### B. OneSignal Handler

- Extract deep link from notification data
- Trigger navigation via deep link handler

## Data Flow

### Cold Start Flow

1. User taps notification / deep link
2. App launches dengan initial URL
3. `Linking.getInitialURL()` returns the URL
4. Parse URL → Navigate to target screen

### Warm Start Flow

1. App sudah running (foreground/background)
2. User taps notification / deep link
3. `Linking.addEventListener('url')` triggered
4. Parse URL → Navigate to target screen

### OneSignal Notification Flow

1. User receives notification dengan `data.deepLink`
2. User taps notification
3. OneSignal `click` event fired
4. Extract `deepLink` from event data
5. Call `Linking.openURL(deepLink)` atau direct navigation

## Notification Payload Structure

```json
{
  "headings": { "en": "New Booking Available" },
  "contents": { "en": "Check out our latest deals!" },
  "data": {
    "deepLink": "swissbelhotelapp://booking?hotelId=123",
    "type": "promo"
  }
}
```

## Error Handling

| Scenario                | Handling                                   |
| ----------------------- | ------------------------------------------ |
| Invalid/unknown path    | Redirect to home                           |
| Malformed URL           | Log error, redirect to home                |
| Missing required params | Navigate without params, let screen handle |
| Navigation fails        | Show error toast (optional)                |

## Testing Scenarios

1. **Cold start deep link**: `xcrun simctl openurl booted "swissbelhotelapp://booking"`
2. **Warm start deep link**: Same command while app is open
3. **OneSignal test**: Send test notification via OneSignal dashboard with deep link data
4. **Invalid path**: Test with unknown path, should go to home

## Dependencies

- `expo-linking` (already installed)
- `expo-router` (already installed)
- `react-native-onesignal` (already installed)

## Files to Create/Modify

| File                       | Action | Description                  |
| -------------------------- | ------ | ---------------------------- |
| `hooks/useDeepLink.ts`     | Create | Deep link hook               |
| `utils/deepLinkHandler.ts` | Create | URL parsing utilities        |
| `app/_layout.tsx`          | Modify | Add deep link initialization |
| `constants/routes.ts`      | Create | Route constants & mapping    |
