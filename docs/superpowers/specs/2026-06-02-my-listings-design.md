# My Listings Screen — Design Spec

**Date:** 2026-06-02
**Status:** Approved

## Overview

Add a "Produk Saya" menu item to the Settings page so logged-in users can view all their active product listings in one place.

## Scope

- Show active + approved listings only (matches existing public seller view)
- No backend changes — reuses `GET /users/:id/products`
- Accessible from Settings → Akun & Profil → Produk Saya

## New Files

### `features/my-listings/hooks/useMyListings.ts`
React Query infinite query hook. Reads `user.id` from `AuthContext`, calls `fetchSellerProducts(user.id, cursor)`. Returns `{ data, isLoading, error, fetchMore, hasMore, refetch }`. Normalises items with `normalizeProduct`.

### `features/my-listings/MyListingsScreen.tsx`
Self-contained screen — reads auth from context, no props required. Layout:
- Header: back button (`router.back()`) + "Produk Saya" title, safe-area top padding
- Body: `FlatList`, 2 columns, `ProductCard` items
- States: loading spinner, error message, empty state ("Belum ada produk aktif"), pull-to-refresh, paginated scroll

### `app/(protected)/settings/produk.tsx`
Thin route wrapper — renders `<MyListingsScreen />`, nothing else.

## Changed Files

### `lib/queryKeys.ts`
Add `myListings: () => ['myListings'] as const`.

### `features/settings/SettingsScreen.tsx`
- Add `onNavigateToListings: () => void` to props interface
- Add new `SettingsItem` (icon: `Tag`, label: "Produk Saya") in the "Akun & Profil" group, between "Nomor Handphone" and "Produk Disimpan"

### `app/(protected)/settings/index.tsx`
Wire `onNavigateToListings={() => router.push('/(protected)/settings/produk')}`.

## Data Flow

```
AuthContext.user.id
  → useMyListings hook
  → fetchSellerProducts(userId, cursor)  [GET /users/:id/products]
  → normalizeProduct
  → ProductCard grid
```

## Out of Scope

- Draft / pending / expired listings (requires new authenticated backend endpoint)
- Edit / delete actions from this screen
