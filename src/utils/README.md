# WebView Utilities Documentation

This directory contains utilities for WebView JavaScript injection and analytics tracking.

## Files Overview

### `webview-scripts.ts`

Handles DOM manipulation and browser behavior modifications in WebViews.

**Functions:**

- `getHideElementScript(config)` - Hides specific elements by ID
- `getTargetBlankHandlerScript()` - Handles target="\_blank" links
- `combineScripts(...scripts)` - Combines multiple scripts

### `analytics.ts`

Handles Google Analytics 4 tracking for WebView traffic.

**Functions:**

- `appendUtmParams(url)` - Adds UTM parameters to URLs
- `getAnalyticsInjectionScript()` - GA4 event tracking script

## Usage Examples

### Basic WebView with Analytics

```typescript
import { getAnalyticsInjectionScript } from "@/src/utils/analytics";

const SCRIPT = getAnalyticsInjectionScript();
<WebView injectedJavaScript={SCRIPT} />
```

### Hide Element with Custom Timing

```typescript
import { getHideElementScript } from "@/src/utils/webview-scripts";

const SCRIPT = getHideElementScript({
  elementId: "unwanted-banner",
  checkInterval: 500, // Check every 500ms
  maxChecks: 20, // Try 20 times (10 seconds total)
});
```

### Combine Multiple Scripts

```typescript
import {
  combineScripts,
  getTargetBlankHandlerScript,
} from "@/src/utils/webview-scripts";
import { getAnalyticsInjectionScript } from "@/src/utils/analytics";

const COMBINED = combineScripts(
  getTargetBlankHandlerScript(),
  getAnalyticsInjectionScript(),
);
```

## Performance Considerations

### Element Hiding Script

- **Duration:** Temporary (stops after max attempts or finding element)
- **Default:** 10 checks × 1000ms = 10 seconds maximum
- **Impact:** Minimal - runs only during initial page load period
- **Platform:** Works on both iOS and Android

### Target Blank Handler

- **Duration:** Permanent (entire session)
- **Trigger:** Event-driven (only on user clicks)
- **Impact:** Negligible - idle until user interaction
- **Platform:** Works on both iOS and Android

### Analytics Script

- **Duration:** One-time execution
- **Trigger:** After page load
- **Impact:** Single async HTTP request
- **Platform:** Works on both iOS and Android

## Best Practices

1. **Conservative timing:** Use longer intervals (1000ms) and fewer checks (10) to avoid performance issues
2. **Combine scripts:** Use `combineScripts()` to reduce injection overhead
3. **Test on both platforms:** iOS and Android may have different timing behaviors
4. **Monitor console:** Scripts log their actions for debugging

## Troubleshooting

### Element not being hidden

- Increase `maxChecks` if element loads very late
- Check console logs for "Element not found" messages
- Verify element ID is correct

### Script not executing

- Ensure `javaScriptEnabled={true}` on WebView
- Check that script ends with `true;` (required by react-native-webview)
- Test on both iOS and Android separately

### Performance issues

- Reduce `maxChecks` to lower number
- Increase `checkInterval` to reduce frequency
- Remove unnecessary scripts from combination
