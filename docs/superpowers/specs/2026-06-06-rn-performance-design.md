# React Native Performance — Production Grade

**Goal:** 60fps across all interactions, cold start < 800ms.  
**Stack:** Expo SDK 54, React Native 0.81, Reanimated v4, React 19, Expo Router v6.

---

## Layer 1: Drop-in Swaps

### FlashList
Replace all `FlatList` instances with `@shopify/flash-list`.

- Set `estimatedItemSize` to the actual average item height — measure with layout inspection, not guessing
- Use `overrideItemLayout` for variable-height lists
- Set `drawDistance` to ~2x screen height (default is fine, tune if blank cells appear during fast scroll)
- Do not use `keyExtractor` returning index — use stable unique IDs

### expo-image
Replace all `<Image>` from `react-native` with `expo-image`.

- `cachePolicy="memory-disk"` on all images
- Every image that loads from network must have a `placeholder` — use blurhash or thumbhash
- Generate blurhash server-side at upload time, store alongside image URL
- Set `transition={200}` for smooth load-in on cache miss
- Do not use `resizeMode` prop — use `contentFit` instead

### MMKV
Replace `AsyncStorage` with `react-native-mmkv`.

- Create a single MMKV instance, export it as a singleton
- All reads are synchronous — remove `await` from storage calls
- Auth session hydration in app startup becomes synchronous, eliminating the async gap before first render with user data

---

## Layer 2: Animation Architecture

### Reanimated Worklets
Every animation must run on the UI thread.

- All visual state driven by `useSharedValue`, never `useState`
- All style computation in `useAnimatedStyle` — no JS-side style objects that change on animation
- No `setTimeout`, `setState`, or any JS call inside animation callbacks — use `runOnJS` if a JS-side effect is needed after animation completes
- Delete all `Animated` usage from `react-native` core

### Gesture Handling
- Replace all `PanResponder`, `TouchableOpacity`, `TouchableHighlight` with `GestureDetector` + `Gesture.*` from `react-native-gesture-handler`
- `Pressable` is acceptable for simple tap targets where no animation is triggered
- Gesture event processing happens on UI thread before JS is involved

### Navigation
- Use `react-native-screens` native stack — JS-animated stack is not acceptable
- Ensure `enableScreens()` is called before any navigation renders
- Do not trigger data fetches or heavy state updates synchronously during screen mount — defer via `InteractionManager` (see Layer 3)

### Bottom Sheet
- `@gorhom/bottom-sheet` v5 is already worklet-based
- Audit `onAnimate`, `onChange` callbacks — must not do heavy JS work inline
- Sheet open/close must be driven by `useSharedValue`, not state toggle

---

## Layer 3: React Rendering Layer

### List Item Stability
FlashList recycling is only effective when item components are stable.

- Wrap every list item component with `React.memo`
- Every callback passed as prop to a list item must be wrapped in `useCallback` with correct deps
- Every object/array passed as prop to a list item must be stable — either from outside the render or memoized with `useMemo`
- Rule of thumb: if a prop changes on every parent render, the item will re-render on every scroll

### Concurrent React
React 19 concurrent features are available and must be used for user-input-driven renders.

- Wrap search/filter state updates in `startTransition` — the input field stays responsive even if the result list is expensive to render
- Use `useDeferredValue` for the query value passed to search result rendering — React will render stale results first, then update when idle
- Do not use `startTransition` for state that must be immediately consistent (auth, navigation)

### InteractionManager
Heavy work must not block navigation transitions.

- Any data fetch, heavy computation, or non-critical setup that fires on screen mount must be wrapped in `InteractionManager.runAfterInteractions`
- This applies to: initial API calls on screen open, analytics events, non-critical subscriptions
- Navigation transition completes first, then work fires — eliminates jank on screen push

---

## Layer 4: Startup & Bundle

### Font Loading
`useFonts` from `expo-font` blocks first paint until fonts are ready.

- Replace blocking font wait with a system font fallback during load
- Or use `expo-splash-screen` to hold the splash until fonts are ready — but measure the tradeoff vs showing UI immediately with fallback font
- Do not render the full app tree inside a font-loading gate

### Lazy Route Loading
Expo Router loads all routes eagerly by default.

- Only the initial tab route loads at startup
- All other routes — protected routes, sell flow, settings, auth — are lazy loaded on first navigation
- Implement via dynamic imports at the route level

### Provider Deferral
`_layout.tsx` provider tree instantiates everything at startup.

- Identify which providers are required before first paint (auth state, theme) vs which can defer (analytics, feature flags, non-critical context)
- Non-critical providers wrap in a deferred component that mounts after first paint

### Bundle Analysis
- Run `react-native-bundle-visualizer` on the production bundle before shipping
- Identify any dependency that contributes > 50kb to the initial bundle unexpectedly
- Common offenders: moment.js, lodash (use lodash-es or direct imports), unused icon packs
- Target: initial JS bundle < 1MB parsed size

---

## Success Criteria

| Metric | Target |
|---|---|
| Cold start (JS ready → first paint) | < 800ms |
| Scroll FPS | 60fps sustained, no drops below 55 |
| Navigation transition | No visible jank, < 300ms |
| Image load (cached) | Immediate, no pop-in |
| Search input → results | Input never blocks regardless of result count |

---

## Implementation Order

1. Layer 1 — FlashList, expo-image, MMKV (highest ROI, lowest risk)
2. Layer 3 — React.memo + useCallback on list items (required for Layer 1 to be effective)
3. Layer 2 — Animation architecture (UI thread animations)
4. Layer 4 — Startup and bundle (measure after Layers 1-3 are done)

Layer 3 is listed before Layer 2 in implementation order because FlashList's recycling depends on item stability — without memo/useCallback, FlashList gains are partially negated.
