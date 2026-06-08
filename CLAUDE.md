# Performance Rules

**Goal:** 60fps all interactions, cold start < 800ms.

> **Note:** Project currently runs on Expo Go. Native-only solutions (MMKV, GestureDetector worklets) are deferred until native build.

---

## Images
Always use `components/ui/Image` — never RN core `<Image>`.
Always provide `blurhash` prop. Generate server-side at upload time.

## Lists
Every list item component must be wrapped in `React.memo`.
Every callback passed to a list item must be wrapped in `useCallback`.

## Animations
All animations via Reanimated: `useSharedValue` + `useAnimatedStyle`.
Use presets from `lib/animations` (`spring`, `timing`, `fadeIn`, `fadeOut`).
Never use `Animated` from `react-native` core — it runs on the JS thread.
Use `Pressable` for gestures — not `TouchableOpacity`, not `GestureDetector` (requires worklets, not available in Expo Go).

## Data fetching on screen mount
Use `hooks/useScreenData` — defers fetch until after navigation transition.
Never fetch directly in `useEffect` on screen mount.

## Search / filter inputs
Wrap state update in `startTransition`. Pass `useDeferredValue` to the list.

## Storage
Use `AsyncStorage` via `@react-native-async-storage/async-storage` — acceptable for MVP on Expo Go.
Never use MMKV (requires native build) or SecureStore (requires native build).
Auth tokens managed exclusively via React Query + `features/auth/store/auth.store.ts`.
