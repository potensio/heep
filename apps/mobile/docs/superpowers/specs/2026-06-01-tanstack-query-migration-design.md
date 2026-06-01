# TanStack Query Migration Design

**Date:** 2026-06-01  
**Scope:** Replace hand-rolled `useState`/`useEffect` data-fetching hooks with `@tanstack/react-query`

---

## Problem

All 5 data-fetching hooks are hand-rolled with `useState`/`useEffect`/`useRef`. Issues:
- No caching — full re-fetch on every mount/navigation
- No deduplication — two components using `useProduct("123")` each fire their own request
- `normalizeProduct()` copy-pasted in 3 hooks (`useProductFeed`, `useProductSearch`, `useSellerProducts`)
- Paginated hooks are ~50 lines each with manual ref juggling

---

## Approach

**Approach B: TanStack Query swap + central query keys file**

Install `@tanstack/react-query`. Replace hook internals with `useQuery`/`useInfiniteQuery`. Add `lib/queryKeys.ts` with typed key factories for all queries — single place for cache invalidation.

---

## New Files

### `lib/queryKeys.ts`
Typed key factories for all queries:
```ts
export const queryKeys = {
  feed: ()                       => ['feed'] as const,
  search: (params: SearchParams) => ['search', params] as const,
  product: (id: string)          => ['product', id] as const,
  seller: (id: string)           => ['seller', id] as const,
  sellerProducts: (id: string)   => ['sellerProducts', id] as const,
}
```

### `lib/queryClient.ts`
Singleton `QueryClient` with global defaults:
- `staleTime: 60_000` — data stays fresh for 60s before background refetch
- `retry: 1` — one retry on failure (default 3 is too aggressive for mobile)

### `lib/normalize.ts`
Shared `normalizeProduct(item: ProductListItem): Product` — replaces 3 duplicate copies currently in `useProductFeed`, `useProductSearch`, `useSellerProducts`.

---

## Changed Files

### `app/_layout.tsx`
Wrap root layout with `<QueryClientProvider client={queryClient}>`.

### `features/home/hooks/useProductFeed.ts`
`useInfiniteQuery` with `getNextPageParam: page => page.nextCursor ?? undefined`. Hook flattens pages internally so consumers don't change.

Return shape preserved: `{ data, isLoading, error, fetchMore, hasMore, refetch }`.

### `features/product/hooks/useProduct.ts`
`useQuery({ queryKey: queryKeys.product(id), queryFn: () => fetchProduct(id) })`.

Return shape preserved: `{ data, isLoading, error }`.

### `features/search/hooks/useProductSearch.ts`
`useInfiniteQuery` disabled by default (`enabled: false`). `search(params)` sets params state and resets the query. `fetchMore` calls `fetchNextPage`.

Return shape preserved: `{ data, isLoading, error, hasMore, search, fetchMore }`.

### `features/seller/hooks/useSeller.ts`
`useQuery({ queryKey: queryKeys.seller(id), queryFn: () => fetchSeller(id) })`.

Return shape preserved: `{ data, isLoading, error }`.

### `features/seller/hooks/useSellerProducts.ts`
`useInfiniteQuery` with `getNextPageParam`. Pages flattened internally.

Return shape preserved: `{ data, isLoading, error, fetchMore, hasMore }`.

---

## What Doesn't Change

- `lib/api.ts` — raw fetch functions untouched
- All consumer screens/components — hook return shapes are identical
- `lib/types.ts` — no type changes

---

## Cache Invalidation (future use)

After publishing a product:
```ts
queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
queryClient.invalidateQueries({ queryKey: queryKeys.sellerProducts(userId) });
```

---

## Out of Scope

- `useSuspenseQuery` variants (Approach C) — revisit once app is stable
- Prefetching in layouts
- Optimistic updates
