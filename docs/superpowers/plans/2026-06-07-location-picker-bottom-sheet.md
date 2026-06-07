# Location Picker Bottom Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable bottom sheet with a blurred backdrop and spring animation, wired to the "Select a location" button on the dashboard.

**Architecture:** A generic `BottomSheet` wrapper (using `@gorhom/bottom-sheet`'s `BottomSheetModal` + `expo-blur` backdrop) lives in `components/ui/`. A `LocationPickerBottomSheet` consumes it for location-specific content. The dashboard screen holds `selectedLocation` state and passes it down.

**Tech Stack:** `@gorhom/bottom-sheet` v5, `expo-blur`, `react-native-reanimated` v4, `react-native-gesture-handler`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/mobile/package.json` | Modify | Add expo-blur dependency |
| `apps/mobile/app/_layout.tsx` | Modify | Wrap navigation in `BottomSheetModalProvider` |
| `apps/mobile/components/ui/bottom-sheet.tsx` | Create | Reusable sheet: blur backdrop, spring anim, open/close ref API |
| `apps/mobile/components/ui/__tests__/bottom-sheet.test.tsx` | Create | Unit tests for BottomSheet |
| `apps/mobile/features/dashboard/components/location-picker-bottom-sheet.tsx` | Create | Location list content inside BottomSheet |
| `apps/mobile/features/dashboard/components/__tests__/location-picker-bottom-sheet.test.tsx` | Create | Unit tests for LocationPickerBottomSheet |
| `apps/mobile/features/dashboard/screens/dashboard-screen.tsx` | Modify | Wire up button → open sheet → update label |

---

## Task 1: Install expo-blur

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install expo-blur**

Run from `apps/mobile/`:
```bash
npx expo install expo-blur
```
Expected output: `+ expo-blur@x.x.x` added to package.json

- [ ] **Step 2: Verify install**

```bash
ls node_modules/expo-blur
```
Expected: directory exists (index.js, etc.)

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/package.json apps/mobile/package-lock.json
git commit -m "chore: install expo-blur for bottom sheet backdrop"
```

---

## Task 2: Add BottomSheetModalProvider to _layout.tsx

`@gorhom/bottom-sheet`'s modal API requires `BottomSheetModalProvider` to be an ancestor of any screen that uses `BottomSheetModal`. It goes inside `GestureHandlerRootView` (already present).

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Update _layout.tsx**

Replace the contents of `apps/mobile/app/_layout.tsx` with:

```tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { enableScreens } from "react-native-screens";
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@/context/ThemeContext";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "../global.css";

enableScreens();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "DM-Sans-Light": DMSans_300Light,
    "DM-Sans": DMSans_400Regular,
    "DM-Sans-Medium": DMSans_500Medium,
    "DM-Sans-SemiBold": DMSans_600SemiBold,
    "DM-Sans-Bold": DMSans_700Bold,
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
            <BottomSheetModalProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
              </Stack>
            </BottomSheetModalProvider>
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

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat: add BottomSheetModalProvider to root layout"
```

---

## Task 3: Create reusable BottomSheet component (TDD)

**Files:**
- Create: `apps/mobile/components/ui/__tests__/bottom-sheet.test.tsx`
- Create: `apps/mobile/components/ui/bottom-sheet.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/mobile/components/ui/__tests__/bottom-sheet.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BottomSheet, BottomSheetRef } from '../bottom-sheet';

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  return {
    BottomSheetModal: React.forwardRef(({ children }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        present: jest.fn(),
        dismiss: jest.fn(),
      }));
      return children ?? null;
    }),
    useBottomSheetSpringConfigs: () => ({}),
  };
});

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

describe('BottomSheet', () => {
  it('renders children', () => {
    const ref = React.createRef<BottomSheetRef>();
    const { getByText } = render(
      <BottomSheet ref={ref}>
        <Text>Hello</Text>
      </BottomSheet>
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('exposes open and close via ref', () => {
    const ref = React.createRef<BottomSheetRef>();
    render(
      <BottomSheet ref={ref}>
        <Text>Content</Text>
      </BottomSheet>
    );
    expect(typeof ref.current?.open).toBe('function');
    expect(typeof ref.current?.close).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `apps/mobile/`:
```bash
npx jest components/ui/__tests__/bottom-sheet.test.tsx --no-coverage
```
Expected: FAIL — `Cannot find module '../bottom-sheet'`

- [ ] **Step 3: Create the BottomSheet component**

Create `apps/mobile/components/ui/bottom-sheet.tsx`:

```tsx
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  Extrapolation,
} from "react-native-reanimated";
import {
  BottomSheetModal,
  BottomSheetBackdropProps,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[];
}

function CustomBackdrop({ animatedIndex, style }: BottomSheetBackdropProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <BlurView intensity={25} style={StyleSheet.absoluteFill} tint="dark" />
    </Animated.View>
  );
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  ({ children, snapPoints = ["40%"] }, ref) => {
    const modalRef = useRef<BottomSheetModal>(null);

    const springConfig = useBottomSheetSpringConfigs({
      damping: 20,
      stiffness: 200,
    });

    useImperativeHandle(ref, () => ({
      open: () => modalRef.current?.present(),
      close: () => modalRef.current?.dismiss(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => <CustomBackdrop {...props} />,
      []
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#000" }}
        handleComponent={() => null}
        animationConfigs={springConfig}
      >
        {children}
      </BottomSheetModal>
    );
  }
);

BottomSheet.displayName = "BottomSheet";
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest components/ui/__tests__/bottom-sheet.test.tsx --no-coverage
```
Expected: PASS — 2 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/components/ui/bottom-sheet.tsx apps/mobile/components/ui/__tests__/bottom-sheet.test.tsx
git commit -m "feat: add reusable BottomSheet component with blur backdrop"
```

---

## Task 4: Create LocationPickerBottomSheet (TDD)

**Files:**
- Create: `apps/mobile/features/dashboard/components/__tests__/location-picker-bottom-sheet.test.tsx`
- Create: `apps/mobile/features/dashboard/components/location-picker-bottom-sheet.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/mobile/features/dashboard/components/__tests__/location-picker-bottom-sheet.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  LocationPickerBottomSheet,
  LocationPickerBottomSheetRef,
} from '../location-picker-bottom-sheet';

jest.mock('@/components/ui/bottom-sheet', () => {
  const React = require('react');
  return {
    BottomSheet: React.forwardRef(({ children }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        open: jest.fn(),
        close: jest.fn(),
      }));
      return children ?? null;
    }),
  };
});

describe('LocationPickerBottomSheet', () => {
  const locations = ['Villa Sunset', 'City Loft'];

  it('renders all location buttons', () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { getByText } = render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={null}
        onSelect={jest.fn()}
      />
    );
    expect(getByText('Villa Sunset')).toBeTruthy();
    expect(getByText('City Loft')).toBeTruthy();
  });

  it('calls onSelect with the tapped location', () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const onSelect = jest.fn();
    const { getByText } = render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation={null}
        onSelect={onSelect}
      />
    );
    fireEvent.press(getByText('Villa Sunset'));
    expect(onSelect).toHaveBeenCalledWith('Villa Sunset');
  });

  it('renders selected location with white background', () => {
    const ref = React.createRef<LocationPickerBottomSheetRef>();
    const { getByTestId } = render(
      <LocationPickerBottomSheet
        ref={ref}
        locations={locations}
        selectedLocation="Villa Sunset"
        onSelect={jest.fn()}
      />
    );
    const selectedItem = getByTestId('location-item-Villa Sunset');
    expect(selectedItem.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#fff' }),
      ])
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest features/dashboard/components/__tests__/location-picker-bottom-sheet.test.tsx --no-coverage
```
Expected: FAIL — `Cannot find module '../location-picker-bottom-sheet'`

- [ ] **Step 3: Create LocationPickerBottomSheet**

Create `apps/mobile/features/dashboard/components/location-picker-bottom-sheet.tsx`:

```tsx
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomSheet, BottomSheetRef } from "@/components/ui/bottom-sheet";
import { Text } from "@/components/ui/text";

export type LocationPickerBottomSheetRef = BottomSheetRef;

interface LocationPickerBottomSheetProps {
  locations: string[];
  selectedLocation: string | null;
  onSelect: (location: string) => void;
}

export const LocationPickerBottomSheet = forwardRef<
  LocationPickerBottomSheetRef,
  LocationPickerBottomSheetProps
>(({ locations, selectedLocation, onSelect }, ref) => {
  const sheetRef = useRef<BottomSheetRef>(null);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.open(),
    close: () => sheetRef.current?.close(),
  }));

  return (
    <BottomSheet ref={sheetRef} snapPoints={["40%"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Select a location</Text>
        {locations.map((location) => {
          const isSelected = location === selectedLocation;
          return (
            <Pressable
              key={location}
              testID={`location-item-${location}`}
              onPress={() => {
                onSelect(location);
                sheetRef.current?.close();
              }}
              style={[styles.item, isSelected && styles.itemSelected]}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {location}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
});

LocationPickerBottomSheet.displayName = "LocationPickerBottomSheet";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  title: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginBottom: 8,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  itemSelected: {
    backgroundColor: "#fff",
  },
  itemText: {
    color: "#fff",
    fontSize: 14,
  },
  itemTextSelected: {
    color: "#000",
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest features/dashboard/components/__tests__/location-picker-bottom-sheet.test.tsx --no-coverage
```
Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/features/dashboard/components/location-picker-bottom-sheet.tsx apps/mobile/features/dashboard/components/__tests__/location-picker-bottom-sheet.test.tsx
git commit -m "feat: add LocationPickerBottomSheet component"
```

---

## Task 5: Wire up DashboardScreen

**Files:**
- Modify: `apps/mobile/features/dashboard/screens/dashboard-screen.tsx`

- [ ] **Step 1: Update DashboardScreen**

Replace the full contents of `apps/mobile/features/dashboard/screens/dashboard-screen.tsx` with:

```tsx
import { useRef, useState } from "react";
import { Pressable, ScrollView, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  House,
  CaretRight,
  Info,
  ArrowsClockwise,
  ClipboardText,
  CalendarBlank,
  ChatCircle,
  CurrencyDollar,
} from "phosphor-react-native";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/ui/image";
import { useTheme } from "@/context/ThemeContext";
import { LocationPickerBottomSheet, LocationPickerBottomSheetRef } from "@/features/dashboard/components/location-picker-bottom-sheet";

const LOCATIONS = ["Villa Sunset", "City Loft", "Beach House"];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const iconColor = resolvedTheme === "dark" ? "#ffffff" : "#000000";

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const locationSheetRef = useRef<LocationPickerBottomSheetRef>(null);

  return (
    <Box className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, flexGrow: 1 }}
      >
        {/* Main Container */}
        <VStack className="items-center mt-6">
          {/* Logo */}
          <Box style={{ width: 110, height: 34 }} className="self-start">
            <Image
              uri="https://7cbab3b115b49c9476434817972a418e.cdn.bubble.io/cdn-cgi/image/w=,h=,f=auto,dpr=2,fit=contain/f1764007668221x929520795912023900/Heep.ai%20%282%29.png"
              width={110}
              height={34}
              contentFit="contain"
            />
          </Box>

          {/* Location Buttons Row */}
          <HStack className="w-full mt-6 gap-5">
            {/* All Locations Button */}
            <HStack
              className="items-center px-6 py-4 rounded-full bg-white"
              style={{ gap: 12 }}
            >
              <House size={20} color={iconColor} weight="regular" />
              <Text className="text-xs text-foreground">All Locations</Text>
            </HStack>

            {/* Select Location Button */}
            <Pressable onPress={() => locationSheetRef.current?.open()}>
              <HStack
                className="items-center px-6 py-4 rounded-full bg-white"
                style={{ gap: 12 }}
              >
                <Text className="text-xs text-foreground">
                  {selectedLocation ?? "Select a location"}
                </Text>
                <CaretRight size={16} color={iconColor} weight="regular" />
              </HStack>
            </Pressable>
          </HStack>

          {/* Greeting Text */}
          <Text className="mt-6 max-w-xs text-2xl self-start tracking-[-1] font-light">
            Hi — Heep has handled 461 messages for you.
          </Text>

          {/* Limited Features Toast */}
          <HStack
            className="mt-6 px-4 py-3 w-full bg-[#3c454a] rounded-[32px]"
            style={{ gap: 16 }}
          >
            <Box className="self-center">
              <Info size={24} color="yellow" weight="regular" />
            </Box>
            <VStack className="flex-1">
              <Text className="text-[17px] text-white tracking-tight">
                Limited features on mobile
              </Text>
              <Text className="text-[13px] opacity-70 mt-1 text-white/90">
                To access all features and options, open the web version
              </Text>
            </VStack>
          </HStack>

          {/* Main Content Cards Row */}
          <HStack className="mt-6 mb-6 w-full flex-wrap" style={{ gap: 12 }}>
            {/* AI Host Assistant Card */}
            <VStack
              className="overflow-hidden rounded-[32px] flex-1"
              style={{ minWidth: 0, flexGrow: 1, marginBottom: 12 }}
            >
              <ImageBackground
                source={require("@/public/card-bg-1.webp")}
                style={{ flex: 1 }}
                resizeMode="cover"
              >
                {/* Card Content */}
                <VStack className="">
                  {/* Title */}
                  <Text className="text-xl tracking-tighter pt-6 px-6">
                    Ai Host Assistant
                  </Text>

                  {/* Bookings Stat */}
                  <VStack className="mt-6 px-4">
                    <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                      <CalendarBlank
                        size={16}
                        color="#000000"
                        weight="regular"
                      />
                      <Text className="text-xs ml-2">
                        Bookings confirmed today
                      </Text>
                    </HStack>
                    <HStack className="mt-5 mx-3 items-end" style={{ gap: 10 }}>
                      <Text className="text-7xl font-normal tracking-tight">
                        12
                      </Text>
                      <Text className="text-xs mb-2">Bookings confirmed</Text>
                    </HStack>
                  </VStack>

                  {/* Conversations Stat */}
                  <VStack className="mt-6 px-4">
                    <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                      <ChatCircle size={16} color="#000000" weight="regular" />
                      <Text className="text-xs ml-2">Conversation handled</Text>
                    </HStack>
                    <HStack className="mt-5 mx-3 items-end" style={{ gap: 10 }}>
                      <Text className="text-7xl font-normal tracking-tight">
                        12
                      </Text>
                      <Text className="text-xs mb-2">Chats responded</Text>
                    </HStack>
                  </VStack>

                  {/* Revenue Stat */}
                  <VStack className="mt-6 mb-8 px-4">
                    <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                      <CurrencyDollar
                        size={16}
                        color="#000000"
                        weight="regular"
                      />
                      <Text className="text-xs ml-2">Revenue with heep</Text>
                    </HStack>
                    <HStack className="mt-5 mx-3 items-end" style={{ gap: 10 }}>
                      <Text className="text-5xl font-normal tracking-tight">
                        23.000€
                      </Text>
                      <Text className="text-xs mb-2">Last 30 days</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </ImageBackground>
            </VStack>

            {/* Right Column: Monthly Usage & Requests Cards */}
            <VStack className="min-w-full" style={{ gap: 12 }}>
              {/* Monthly Usage Card */}
              <VStack
                className="border-2 rounded-[32px] p-6"
                style={{ borderColor: "rgba(153, 153, 153, 0.3)" }}
              >
                {/* Header */}
                <HStack className="items-center" style={{ gap: 10 }}>
                  <HStack
                    className="p-3 rounded-full border"
                    style={{ borderColor: "rgb(153, 153, 153)" }}
                  >
                    <ArrowsClockwise
                      size={20}
                      color={iconColor}
                      weight="regular"
                    />
                  </HStack>
                  <Text className="text-xl tracking-tighter">
                    Monthly Usage
                  </Text>
                </HStack>

                {/* Credits */}
                <HStack className="mt-5 items-end" style={{ gap: 10 }}>
                  <Text className="text-7xl font-normal tracking-tight">
                    1000
                  </Text>
                  <Text className="text-xs mb-2">Credits remaining</Text>
                </HStack>

                {/* Daily Usage */}
                <VStack className="mt-6">
                  <HStack className="px-3 h-8 items-center bg-white/40 rounded-[1000px] self-start">
                    <ChatCircle size={16} color="#000000" weight="regular" />
                    <Text className="text-xs ml-2">Avg daily usage</Text>
                  </HStack>
                  <HStack className="mt-5 items-end" style={{ gap: 10 }}>
                    <Text className="text-5xl font-normal tracking-tight">
                      24
                    </Text>
                    <Text className="text-xs mb-2">messages/day</Text>
                  </HStack>
                </VStack>
              </VStack>

              {/* Requests Card */}
              <VStack
                className="border-2 rounded-[32px] p-6"
                style={{ borderColor: "rgba(153, 153, 153, 0.3)" }}
              >
                {/* Header */}
                <HStack className="items-center" style={{ gap: 10 }}>
                  <HStack
                    className="p-3 rounded-full border"
                    style={{ borderColor: "rgb(153, 153, 153)" }}
                  >
                    <ClipboardText
                      size={20}
                      color={iconColor}
                      weight="regular"
                    />
                  </HStack>
                  <Text className="text-xl">Requests</Text>
                </HStack>

                {/* Description */}
                <Text className="text-xs mt-4 opacity-80 tracking-tight">
                  Guests who couldn't book right away but still want a table.
                  Don't miss the chance to seat them.
                </Text>

                {/* Stats Pills */}
                <VStack className="mt-5 mb-6" style={{ gap: 16 }}>
                  <HStack
                    className="pl-3 pr-4 py-2.5 rounded-full items-center self-start"
                    style={{
                      gap: 8,
                      backgroundColor: "rgba(118, 118, 128, 0.12)",
                    }}
                  >
                    <Text className="text-xs font-semibold">22</Text>
                    <Text className="text-xs">Unfulfilled Requests</Text>
                  </HStack>
                  <HStack
                    className="pl-3 pr-4 py-2.5 rounded-full items-center self-start"
                    style={{
                      gap: 8,
                      backgroundColor: "rgba(118, 118, 128, 0.12)",
                    }}
                  >
                    <Text className="text-xs font-semibold">-</Text>
                    <Text className="text-xs">Most Requested Time</Text>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>
          </HStack>
        </VStack>
      </ScrollView>

      {/* Location Picker Sheet */}
      <LocationPickerBottomSheet
        ref={locationSheetRef}
        locations={LOCATIONS}
        selectedLocation={selectedLocation}
        onSelect={setSelectedLocation}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Run all tests to verify nothing is broken**

Run from `apps/mobile/`:
```bash
npx jest --no-coverage
```
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/dashboard/screens/dashboard-screen.tsx
git commit -m "feat: wire location picker bottom sheet to dashboard screen"
```
