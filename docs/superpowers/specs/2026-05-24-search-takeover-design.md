# Search Takeover UX — Design Spec

**Date:** 2026-05-24  
**Status:** Approved

---

## Problem

The current search UX doesn't feel like a polished marketplace app:
- The home screen has a live `TextInput` search bar where users type before navigating
- The home screen has a filter button — filter belongs only on the search screen
- The search screen doesn't auto-focus or open the keyboard on arrival
- The result feels like a generic page push, not a dedicated search experience

## Goal

Make search feel like Tokopedia/Shopee: tapping the home search bar immediately takes the user to a full-screen search experience with the keyboard already open.

---

## Approach: Simple Navigation + Autofocus

The keyboard opening instantly on the search screen is what creates the "takeover" feel — no custom animation required.

---

## Changes

### 1. `HomeScreen.tsx`
- Replace the `SearchBar` + filter `TouchableOpacity` row with a single dummy search button
- The dummy button is a styled `View` that looks like the search bar (same shape, placeholder text "Cari produk...")
- Wrap it in a `TouchableOpacity` — tapping navigates to `/search` with no query param
- Remove all search/filter/sort state (`searchQuery`, `sortBy`, `openFilterSheet`, `handleSearch`, `handleFilter`)
- Keep `handleProductPress` and `handleSellerPress` (still needed for the product grid)

### 2. `app/(public)/search.tsx`
- Read `search` query param via `useLocalSearchParams`
- Pass it as `initialQuery` prop to `SearchProductsScreen`
- Pass `onBack` callback using `useRouter().back()`
- Pass `onProductPress` and `onSellerPress` navigation callbacks

### 3. `SearchProductsScreen.tsx`
- Accept props: `initialQuery?: string`, `onBack: () => void`, `onProductPress: (id: string) => void`, `onSellerPress: (id: string) => void`
- Remove internal `useRouter` and `useLocalSearchParams` calls (props-over-routing rule)
- Initialise `searchQuery` state from `initialQuery`
- Run initial filter on mount when `initialQuery` is present
- Pass `autoFocus` to `SearchBar` so keyboard opens immediately

### 4. `SearchBar.tsx`
- Add optional `autoFocus?: boolean` prop, forwarded to the underlying `TextInput`

---

## What Stays the Same

- Filter sheet lives only on `SearchProductsScreen` — not on home
- Route structure unchanged (`(public)/search.tsx` already exists)
- All mock data and filter/sort logic unchanged
- Back button already exists on `ProductDetailScreen` — search screen gets its own via `onBack` prop

---

## UX Flow

```
Home screen
  └─ Tap dummy search bar
       └─ router.push("/search")
            └─ SearchProductsScreen mounts
                 ├─ keyboard opens immediately (autoFocus)
                 └─ if initialQuery present → results pre-filtered
```

---

## Out of Scope

- Search history persistence
- Real API integration
- Custom transition animations
