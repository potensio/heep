# Performance Rules

**Goal:** 60fps all interactions, cold start < 800ms.

---

## Images
Always use `components/ui/Image` — never RN core `<Image>`.
Always provide `blurhash` prop. Generate server-side at upload time.

## Lists
Always use `components/ui/List` — never `FlatList`.
Every list item component must be wrapped in `React.memo`.
Every callback passed to a list item must be wrapped in `useCallback`.

## Animations
All animations via Reanimated: `useSharedValue` + `useAnimatedStyle`.
Use presets from `lib/animations` (`spring`, `timing`, `fadeIn`, `fadeOut`).
Never use `Animated` from `react-native` core — it runs on the JS thread.
Gestures via `GestureDetector` from `react-native-gesture-handler`, not `TouchableOpacity`.

## Data fetching on screen mount
Use `hooks/useScreenData` — defers fetch until after navigation transition.
Never fetch directly in `useEffect` on screen mount.

## Search / filter inputs
Wrap state update in `startTransition`. Pass `useDeferredValue` to the list.

## Storage
Use `lib/storage` (MMKV) — never `AsyncStorage`. All reads are synchronous.
