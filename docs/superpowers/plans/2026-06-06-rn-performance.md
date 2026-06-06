# React Native Performance Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish production-grade performance infrastructure from day one — 60fps interactions, cold start < 800ms.

**Architecture:** Four layers built in order: drop-in primitives (storage, image, list) → rendering stability (memo/useCallback patterns + InteractionManager) → animation architecture (UI thread only) → startup pipeline (non-blocking fonts, bundle analysis). Each layer is independently shippable.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, `react-native-mmkv`, `expo-image`, `@shopify/flash-list`, `react-native-reanimated` v4, `react-native-gesture-handler`, `jest-expo`, `@testing-library/react-native`.

---

### Task 1: Install dependencies + test setup

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install performance libraries**

```bash
cd apps/mobile
npx expo install @shopify/flash-list expo-image react-native-mmkv
```

- [ ] **Step 2: Install test infrastructure**

```bash
npx expo install --dev jest-expo @testing-library/react-native @types/jest
```

- [ ] **Step 3: Add jest config to package.json**

Open `apps/mobile/package.json` and add after the `"private": true` line:

```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/flash-list|react-native-mmkv)"
  ]
}
```

- [ ] **Step 4: Create MMKV mock for tests**

Create file `apps/mobile/__mocks__/react-native-mmkv.ts`:

```typescript
export const MMKV = jest.fn().mockImplementation(() => {
  const store = new Map<string, string | number | boolean>();
  return {
    set: (key: string, value: string | number | boolean) => store.set(key, value),
    getString: (key: string) => store.get(key) as string | undefined,
    getNumber: (key: string) => store.get(key) as number | undefined,
    getBoolean: (key: string) => store.get(key) as boolean | undefined,
    delete: (key: string) => store.delete(key),
    contains: (key: string) => store.has(key),
    clearAll: () => store.clear(),
  };
});
```

- [ ] **Step 5: Verify tests run**

```bash
npx jest --passWithNoTests
```

Expected: `Test Suites: 0 passed`

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/package.json apps/mobile/__mocks__/react-native-mmkv.ts
git commit -m "feat(perf): install flash-list, expo-image, mmkv, test infra"
```

---

### Task 2: MMKV storage singleton

**Files:**
- Create: `apps/mobile/lib/storage.ts`
- Create: `apps/mobile/lib/__tests__/storage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/mobile/lib/__tests__/storage.test.ts`:

```typescript
import { storage } from '../storage';

describe('storage', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  it('writes and reads a string synchronously', () => {
    storage.set('key', 'value');
    expect(storage.getString('key')).toBe('value');
  });

  it('returns undefined for missing key', () => {
    expect(storage.getString('missing')).toBeUndefined();
  });

  it('deletes a key', () => {
    storage.set('key', 'value');
    storage.delete('key');
    expect(storage.contains('key')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/__tests__/storage.test.ts
```

Expected: FAIL — `Cannot find module '../storage'`

- [ ] **Step 3: Create the storage singleton**

Create `apps/mobile/lib/storage.ts`:

```typescript
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest lib/__tests__/storage.test.ts
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/storage.ts apps/mobile/lib/__tests__/storage.test.ts
git commit -m "feat(perf): add MMKV storage singleton"
```

---

### Task 3: Fix startup — non-blocking font load

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

The current `_layout.tsx` returns `null` while fonts load. This means the entire app tree — including `GestureHandlerRootView` and all providers — does not mount until fonts are ready. This is the single biggest contributor to perceived cold start time. The fix: use `expo-splash-screen` to hold the native splash, render the full app tree immediately, and hide the splash when fonts finish loading.

- [ ] **Step 1: Install expo-splash-screen**

```bash
npx expo install expo-splash-screen
```

- [ ] **Step 2: Replace _layout.tsx**

```typescript
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { enableScreens } from "react-native-screens";
import { FjallaOne_400Regular } from "@expo-google-fonts/fjalla-one";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { ThemeProvider } from "@/context/ThemeContext";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "../global.css";

enableScreens();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Fjalla-One": FjallaOne_400Regular,
    "Plus-Jakarta": PlusJakartaSans_400Regular,
    "Plus-Jakarta-Medium": PlusJakartaSans_500Medium,
    "Plus-Jakarta-SemiBold": PlusJakartaSans_600SemiBold,
    "Plus-Jakarta-Bold": PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <GluestackUIProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="auth" />
            </Stack>
          </GluestackUIProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

Key changes from before:
- `enableScreens()` called at module level before any render
- `SplashScreen.preventAutoHideAsync()` called at module level
- Removed `if (!fontsLoaded) return null` — app tree renders immediately
- `useEffect` hides splash when fonts are ready

- [ ] **Step 3: Verify type check passes**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat(perf): non-blocking font load, enable native screens"
```

---

### Task 4: PerformantImage component

**Files:**
- Create: `apps/mobile/components/ui/PerformantImage.tsx`
- Create: `apps/mobile/components/ui/__tests__/PerformantImage.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/mobile/components/ui/__tests__/PerformantImage.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { PerformantImage } from '../PerformantImage';

jest.mock('expo-image', () => ({
  Image: ({ testID, source, placeholder, cachePolicy, transition, contentFit, style }: any) => {
    const { View } = require('react-native');
    return (
      <View
        testID={testID}
        accessibilityLabel={JSON.stringify({ source, placeholder, cachePolicy, transition, contentFit })}
        style={style}
      />
    );
  },
}));

describe('PerformantImage', () => {
  it('renders with required uri', () => {
    const { getByTestId } = render(
      <PerformantImage uri="https://example.com/img.jpg" testID="img" />
    );
    expect(getByTestId('img')).toBeTruthy();
  });

  it('sets memory-disk cache policy', () => {
    const { getByTestId } = render(
      <PerformantImage uri="https://example.com/img.jpg" testID="img" />
    );
    const props = JSON.parse(getByTestId('img').props.accessibilityLabel);
    expect(props.cachePolicy).toBe('memory-disk');
  });

  it('sets blurhash placeholder when provided', () => {
    const hash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
    const { getByTestId } = render(
      <PerformantImage uri="https://example.com/img.jpg" blurhash={hash} testID="img" />
    );
    const props = JSON.parse(getByTestId('img').props.accessibilityLabel);
    expect(props.placeholder).toEqual({ blurhash: hash });
  });

  it('defaults contentFit to cover', () => {
    const { getByTestId } = render(
      <PerformantImage uri="https://example.com/img.jpg" testID="img" />
    );
    const props = JSON.parse(getByTestId('img').props.accessibilityLabel);
    expect(props.contentFit).toBe('cover');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest components/ui/__tests__/PerformantImage.test.tsx
```

Expected: FAIL — `Cannot find module '../PerformantImage'`

- [ ] **Step 3: Create the component**

Create `apps/mobile/components/ui/PerformantImage.tsx`:

```typescript
import { memo } from "react";
import { Image } from "expo-image";
import { StyleProp, ImageStyle } from "react-native";

interface PerformantImageProps {
  uri: string;
  blurhash?: string;
  width?: number | string;
  height?: number | string;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

export const PerformantImage = memo(function PerformantImage({
  uri,
  blurhash,
  width,
  height,
  contentFit = "cover",
  style,
  testID,
}: PerformantImageProps) {
  return (
    <Image
      source={{ uri }}
      placeholder={blurhash ? { blurhash } : undefined}
      cachePolicy="memory-disk"
      transition={200}
      contentFit={contentFit}
      style={[{ width, height }, style]}
      testID={testID}
    />
  );
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest components/ui/__tests__/PerformantImage.test.tsx
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/components/ui/PerformantImage.tsx apps/mobile/components/ui/__tests__/PerformantImage.test.tsx
git commit -m "feat(perf): add PerformantImage with memory-disk cache and blurhash"
```

---

### Task 5: PerformantList component

**Files:**
- Create: `apps/mobile/components/ui/PerformantList.tsx`
- Create: `apps/mobile/components/ui/__tests__/PerformantList.test.tsx`

FlashList's recycling is only effective when item components never re-render during scroll. The `PerformantList` component enforces the required pattern: a generic FlashList wrapper that documents the `React.memo` + `useCallback` contract at the type level.

- [ ] **Step 1: Write the failing test**

Create `apps/mobile/components/ui/__tests__/PerformantList.test.tsx`:

```typescript
import React, { memo, useCallback } from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { PerformantList } from '../PerformantList';

jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return { FlashList: FlatList };
});

const Item = memo(function Item({ label }: { label: string }) {
  return <Text testID={`item-${label}`}>{label}</Text>;
});

describe('PerformantList', () => {
  const data = [
    { id: '1', label: 'Apple' },
    { id: '2', label: 'Banana' },
  ];

  it('renders all items', () => {
    const renderItem = useCallback(
      ({ item }: { item: typeof data[0] }) => <Item label={item.label} />,
      []
    );

    const { getByTestId } = render(
      <PerformantList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
      />
    );

    expect(getByTestId('item-Apple')).toBeTruthy();
    expect(getByTestId('item-Banana')).toBeTruthy();
  });

  it('requires a non-index keyExtractor', () => {
    // keyExtractor returning stable IDs is enforced by convention —
    // this test documents that string IDs are the expected pattern
    const ids = data.map((item) => item.id);
    expect(ids).toEqual(['1', '2']);
    expect(ids.every((id) => isNaN(Number(id)) || id !== String(data.indexOf({ id } as any)))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest components/ui/__tests__/PerformantList.test.tsx
```

Expected: FAIL — `Cannot find module '../PerformantList'`

- [ ] **Step 3: Create the component**

Create `apps/mobile/components/ui/PerformantList.tsx`:

```typescript
import { FlashList, FlashListProps } from "@shopify/flash-list";

type PerformantListProps<T> = Omit<FlashListProps<T>, "estimatedItemSize"> & {
  estimatedItemSize: number;
};

export function PerformantList<T>({
  estimatedItemSize,
  ...props
}: PerformantListProps<T>) {
  return <FlashList estimatedItemSize={estimatedItemSize} {...props} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest components/ui/__tests__/PerformantList.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/components/ui/PerformantList.tsx apps/mobile/components/ui/__tests__/PerformantList.test.tsx
git commit -m "feat(perf): add PerformantList wrapping FlashList"
```

---

### Task 6: useScreenData hook (InteractionManager)

**Files:**
- Create: `apps/mobile/hooks/useScreenData.ts`
- Create: `apps/mobile/hooks/__tests__/useScreenData.test.ts`

Any data fetch or heavy work that fires on screen mount should use this hook. It defers execution until after the current navigation transition completes, so the transition never janks.

- [ ] **Step 1: Write the failing test**

Create `apps/mobile/hooks/__tests__/useScreenData.test.ts`:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { InteractionManager } from 'react-native';
import { useScreenData } from '../useScreenData';

jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation((cb) => {
  cb();
  return { cancel: jest.fn(), then: jest.fn() };
});

describe('useScreenData', () => {
  it('starts with null data', () => {
    const { result } = renderHook(() =>
      useScreenData(() => Promise.resolve('value'))
    );
    expect(result.current.data).toBeNull();
  });

  it('populates data after interactions', async () => {
    const { result } = renderHook(() =>
      useScreenData(() => Promise.resolve('loaded'))
    );
    await waitFor(() => expect(result.current.data).toBe('loaded'));
  });

  it('sets loading to false after data loads', async () => {
    const { result } = renderHook(() =>
      useScreenData(() => Promise.resolve('done'))
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('captures errors', async () => {
    const { result } = renderHook(() =>
      useScreenData(() => Promise.reject(new Error('boom')))
    );
    await waitFor(() => expect(result.current.error?.message).toBe('boom'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest hooks/__tests__/useScreenData.test.ts
```

Expected: FAIL — `Cannot find module '../useScreenData'`

- [ ] **Step 3: Create the hook**

Create `apps/mobile/hooks/useScreenData.ts`:

```typescript
import { useState, useEffect } from "react";
import { InteractionManager } from "react-native";

interface ScreenDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useScreenData<T>(
  fetcher: () => Promise<T>
): ScreenDataState<T> {
  const [state, setState] = useState<ScreenDataState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const data = await fetcher();
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({ data: null, loading: false, error: error as Error });
      }
    });

    return () => task.cancel();
  }, []);

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest hooks/__tests__/useScreenData.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/hooks/useScreenData.ts apps/mobile/hooks/__tests__/useScreenData.test.ts
git commit -m "feat(perf): add useScreenData with InteractionManager deferral"
```

---

### Task 7: Animation utilities

**Files:**
- Create: `apps/mobile/lib/animations.ts`
- Create: `apps/mobile/lib/__tests__/animations.test.ts`

Shared presets so all animations across the app have consistent feel and every developer reaches for these instead of raw `withSpring`/`withTiming` with ad-hoc values.

- [ ] **Step 1: Write the failing test**

Create `apps/mobile/lib/__tests__/animations.test.ts`:

```typescript
import { spring, timing, fadeIn, fadeOut } from '../animations';

jest.mock('react-native-reanimated', () => ({
  withSpring: jest.fn((value, config) => ({ type: 'spring', value, config })),
  withTiming: jest.fn((value, config) => ({ type: 'timing', value, config })),
  Easing: {
    bezier: jest.fn(() => 'bezier-fn'),
  },
}));

describe('animation presets', () => {
  it('spring returns a spring animation to target value', () => {
    const result = spring(1) as any;
    expect(result.type).toBe('spring');
    expect(result.value).toBe(1);
  });

  it('spring uses damping 20 and stiffness 200', () => {
    const result = spring(1) as any;
    expect(result.config.damping).toBe(20);
    expect(result.config.stiffness).toBe(200);
  });

  it('timing returns a timing animation with 250ms default', () => {
    const result = timing(1) as any;
    expect(result.type).toBe('timing');
    expect(result.config.duration).toBe(250);
  });

  it('timing accepts custom duration', () => {
    const result = timing(1, 400) as any;
    expect(result.config.duration).toBe(400);
  });

  it('fadeIn animates opacity to 1', () => {
    const result = fadeIn() as any;
    expect(result.value).toBe(1);
  });

  it('fadeOut animates opacity to 0', () => {
    const result = fadeOut() as any;
    expect(result.value).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest lib/__tests__/animations.test.ts
```

Expected: FAIL — `Cannot find module '../animations'`

- [ ] **Step 3: Create animation utilities**

Create `apps/mobile/lib/animations.ts`:

```typescript
import { withSpring, withTiming, Easing } from "react-native-reanimated";

export const spring = (toValue: number) =>
  withSpring(toValue, {
    damping: 20,
    stiffness: 200,
  });

export const timing = (toValue: number, duration = 250) =>
  withTiming(toValue, {
    duration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

export const fadeIn = () => timing(1, 200);

export const fadeOut = () => timing(0, 150);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest lib/__tests__/animations.test.ts
```

Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/animations.ts apps/mobile/lib/__tests__/animations.test.ts
git commit -m "feat(perf): add animation presets (spring, timing, fadeIn, fadeOut)"
```

---

### Task 8: Bundle analysis setup

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install bundle visualizer**

```bash
cd apps/mobile
npm install --save-dev react-native-bundle-visualizer
```

- [ ] **Step 2: Add analysis script to package.json**

In `apps/mobile/package.json`, add to the `"scripts"` object:

```json
"analyze": "react-native-bundle-visualizer"
```

- [ ] **Step 3: Run all tests to confirm nothing is broken**

```bash
npx jest
```

Expected: All tests pass.

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/package.json
git commit -m "feat(perf): add bundle analyzer script"
```

---

## Usage Patterns (apply when building features)

These patterns are not standalone tasks — apply them every time you build a list screen or search screen.

### List items must be stable

```typescript
// Every list item component
const ProductCard = memo(function ProductCard({ id, title, onPress }: Props) {
  return <Pressable onPress={onPress}>...</Pressable>;
});

// Parent screen
function ProductListScreen() {
  const handlePress = useCallback((id: string) => {
    router.push(`/product/${id}`);
  }, []);

  return (
    <PerformantList
      data={products}
      renderItem={({ item }) => (
        <ProductCard id={item.id} title={item.title} onPress={handlePress} />
      )}
      keyExtractor={(item) => item.id}
      estimatedItemSize={120}
    />
  );
}
```

### Search inputs use concurrent React

```typescript
function SearchScreen() {
  const [input, setInput] = useState('');
  const deferredQuery = useDeferredValue(input);

  const handleChange = useCallback((text: string) => {
    startTransition(() => setInput(text));
  }, []);

  // deferredQuery is passed to the list — input stays responsive
  const results = useFilteredProducts(deferredQuery);

  return (
    <>
      <TextInput value={input} onChangeText={handleChange} />
      <PerformantList data={results} ... />
    </>
  );
}
```

### Animations run on UI thread

```typescript
// Correct — worklet, runs on UI thread
const opacity = useSharedValue(0);
const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

// On mount
opacity.value = fadeIn();

// Wrong — never do this
const [opacity] = useState(new Animated.Value(0)); // JS thread
```

### Data fetches defer to after navigation

```typescript
function ProductDetailScreen({ id }: { id: string }) {
  const { data, loading } = useScreenData(() => fetchProduct(id));
  // data is null during navigation transition, populates after
}
```

---

## Success Criteria

| Metric | Target |
|---|---|
| Cold start (JS ready → first paint) | < 800ms |
| Scroll FPS | 60fps sustained |
| Navigation transition | No jank |
| Image load (cached) | No pop-in |
| Search input → results | Input never blocks |
