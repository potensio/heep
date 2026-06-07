# Location Picker Bottom Sheet

**Date:** 2026-06-07  
**Status:** Approved

## Overview

A reusable bottom sheet component with a blurred backdrop and smooth spring animation. The first consumer is the "Select a location" button on the dashboard. The generic wrapper can be used on any screen across the app.

---

## Architecture

Two layers:

1. **Generic wrapper** — `components/ui/bottom-sheet.tsx`  
   Wraps `@gorhom/bottom-sheet`. Owns the backdrop, animation config, and visual chrome (black background, no handle). Any screen in the app can use this.

2. **Feature-specific content** — `features/dashboard/components/location-picker-bottom-sheet.tsx`  
   Uses the generic wrapper. Renders the location list. Accepts the locations array, current selection, and a callback.

---

## Files

| File | Purpose |
|------|---------|
| `components/ui/bottom-sheet.tsx` | Reusable sheet wrapper |
| `features/dashboard/components/location-picker-bottom-sheet.tsx` | Location list content |
| `features/dashboard/screens/dashboard-screen.tsx` | Wire up button → sheet → label update |

**Install required:** `expo-blur` (first-party Expo package, not yet in package.json)

---

## Component API

### `BottomSheet` (generic wrapper)

```ts
interface BottomSheetRef {
  open: () => void;
  close: () => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[]; // default: ['40%']
}
```

Exposed via `forwardRef` so callers do:
```ts
const sheetRef = useRef<BottomSheetRef>(null);
sheetRef.current?.open();
```

### `LocationPickerBottomSheet`

```ts
interface LocationPickerBottomSheetProps {
  locations: string[];
  selectedLocation: string | null;
  onSelect: (location: string) => void;
}
```

Also exposed via `forwardRef` (passes ref through to the inner `BottomSheet`).

---

## Animation & Backdrop

- **Library:** `@gorhom/bottom-sheet` v5 (`BottomSheetModal` + `BottomSheetModalProvider`)
- **Sheet animation:** Spring config from `lib/animations.ts` (damping 20, stiffness 200) via `useBottomSheetSpringConfigs`
- **Backdrop:** Custom component using `BlurView` from `expo-blur`
  - `tint: "dark"`, `intensity: 25`
  - Animated opacity via Reanimated `interpolate` on `animatedIndex`: `[-1, 0] → [0, 1]`
  - Tapping backdrop closes the sheet (`disappearsOnIndex: -1`)
- **Handle:** Hidden (`handleComponent={() => null}`)
- **Background:** Black (`backgroundStyle={{ backgroundColor: '#000' }}`)

---

## Location List UI

Inside the sheet (top to bottom):

1. Title: "Select a location" — white, small, padded top
2. Location items — full-width rounded pill buttons, vertically stacked with gap
   - **Default:** dark grey bg (`rgba(255,255,255,0.1)`), white text
   - **Selected:** white bg, black text
3. Tapping an item calls `onSelect(location)` then closes the sheet

---

## Data Flow

```
DashboardScreen
  selectedLocation (state)  ←──────────────────────┐
  sheetRef.current.open()   ──→  LocationPickerBS    │
                                   onSelect(loc)  ───┘
                                   sheet.close()
```

The dashboard screen owns state. The sheet is stateless — it receives `selectedLocation` and fires `onSelect`. The button label renders `selectedLocation ?? 'Select a location'`.

---

## Setup: BottomSheetModalProvider

`@gorhom/bottom-sheet` requires `BottomSheetModalProvider` wrapping the app. It goes in `app/_layout.tsx`, wrapping the existing navigation stack.

---

## Out of Scope

- Fetching locations from an API (static list only)
- Search or filtering within the sheet
- Multi-select
