# Location Feature Design

**Date:** 2026-05-31
**Status:** Approved

## Overview

Add city-level location to BantuJual so that listed products and search results are relevant to the user's location. Users manually select a city via Google Places Autocomplete. Location is a single source of truth stored on the user's profile, visible on product cards, and used as a filter in search. Product listings can override the user's default location per-listing.

---

## Data Model

### `Location` type

```ts
interface Location {
  name: string;      // Display name, e.g. "Surabaya"
  placeId: string;   // Google Place ID — for deduplication and future reference
  lat: number;       // For future range sorting (Haversine)
  lng: number;
}
```

### Updated `User` type (`context/AuthContext.tsx`)

```ts
interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  profileCompleted: boolean;
  location: Location | null;   // NEW
}
```

### Updated `Product` type (`lib/types.ts`)

```ts
interface Product {
  // ...existing fields
  location: Location | null;   // NEW — set at listing time, not synced to user.location
}
```

### Updated `SellFormData` (`features/sell/types.ts`)

```ts
interface SellFormData {
  // ...existing fields
  location: Location | null;   // NEW — defaults to user.location, overridable
}
```

---

## `CityPicker` Component

**Path:** `features/shared/components/CityPicker.tsx`

A reusable bottom sheet that wraps Google Places Autocomplete. Used at every touchpoint that needs city selection.

```ts
interface CityPickerProps {
  value: Location | null;
  onSelect: (location: Location) => void;
  onClose: () => void;
}
```

- Renders as a `@gorhom/bottom-sheet`
- Contains a `TextInput` that queries the Google Places Autocomplete API via HTTP
- Filtered to `types=["(cities)"]` and `components=country:id` (Indonesia only)
- On selection, resolves `name`, `placeId`, `lat`, `lng` from the Places response and calls `onSelect`
- Does not know its usage context — purely presentational

### Google Places integration

- API key stored in `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`
- HTTP wrapper in `lib/googlePlaces.ts` — exports `searchCities(query: string): Promise<Location[]>`
- No native SDK required — plain `fetch` to the Places Autocomplete endpoint

---

## Touchpoints

### 1. CompleteProfileScreen

- Add a required "Kota" field after "Nomor Handphone"
- Rendered as a tappable read-only input showing `location.name` (or placeholder if null)
- Tap → open `CityPicker` bottom sheet
- `isValid` check includes `location !== null`
- On submit, location is included in the `updateProfile` call

### 2. ProductInfoStep (sell flow)

- Add an optional-but-pre-filled "Lokasi" field after "Deskripsi"
- Defaults to `user.location` when the step mounts
- Tappable read-only input — tap opens `CityPicker`
- User can override per-listing
- If `user.location` is null (edge case), field is empty and required

### 3. ProductCard

- Add a location line below seller name
- Only rendered if `product.location` is not null
- Format: pin icon + `product.location.name`
- Example: `📍 Surabaya`

### 4. SearchProductsScreen

- Add a `MapPin` icon button to the left of the search bar in the header
- Tap → open `CityPicker` bottom sheet
- On selection: call `updateProfile` API → update `AuthContext` user
- When `hasSubmitted`: show a single line below the search bar reading "Menampilkan produk di **[city]**"
- If user has no location set, icon button shows without a city label

### 5. Settings — Profil page

- Add a "Lokasi" row in the Akun & Profil section
- Shows current `user.location.name` as the value
- Tap → open `CityPicker` bottom sheet → call `updateProfile` API → update `AuthContext`

---

## State & Data Flow

`user.location` in `AuthContext` is the single source of truth for the user's location.

```
User changes city (from any touchpoint)
  → PATCH /users/me { location: { name, placeId, lat, lng } }
  → AuthContext.updateUser(updatedUser)
  → All components reading user.location re-render automatically
```

`Product.location` is set at listing time and is independent of `user.location`. It represents where the product was listed, not where the seller is now.

---

## Out of Scope

- GPS / device location detection
- Range/distance sorting (coordinates are stored but sorting logic is a backend concern, deferred)
- Location filtering in search results (the city button updates user.location but does not filter the results list — filtering is a future enhancement)
- Support for locations outside Indonesia
