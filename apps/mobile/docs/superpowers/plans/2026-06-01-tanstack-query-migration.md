# TanStack Query Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 5 hand-rolled `useState`/`useEffect` data-fetching hooks with `@tanstack/react-query`, adding caching, deduplication, and a central query keys file.

**Architecture:** Install `@tanstack/react-query` v5. Create `lib/queryKeys.ts` (typed key factories), `lib/queryClient.ts` (singleton with `staleTime: 60s`), and `lib/normalize.ts` (shared product normalizer). Wrap the app root with `QueryClientProvider`. Replace simple hooks with `useQuery`, paginated hooks with `useInfiniteQuery`. All hook return shapes stay identical so no consumer changes are needed.

**Tech Stack:** `@tanstack/react-query` v5, React 19, Expo SDK 54, TypeScript

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `lib/queryKeys.ts` | Typed key factories for all queries |
| Create | `lib/queryClient.ts` | Singleton `QueryClient` with global config |
| Create | `lib/normalize.ts` | Shared `normalizeProduct()` util |
| Modify | `app/_layout.tsx` | Add `QueryClientProvider` wrapper |
| Modify | `features/home/hooks/useProductFeed.ts` | `useInfiniteQuery` |
| Modify | `features/product/hooks/useProduct.ts` | `useQuery` |
| Modify | `features/search/hooks/useProductSearch.ts` | `useInfiniteQuery`, disabled by default |
| Modify | `features/seller/hooks/useSeller.ts` | `useQuery` |
| Modify | `features/seller/hooks/useSellerProducts.ts` | `useInfiniteQuery` |

---

## Task 1: Install @tanstack/react-query

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

Run from `apps/mobile`:
```bash
npx expo install @tanstack/react-query
```

Expected: package added to `package.json`, no peer dep warnings.

- [ ] **Step 2: Verify type check still passes**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: install @tanstack/react-query"
```

---

## Task 2: Create `lib/queryKeys.ts`

**Files:**
- Create: `lib/queryKeys.ts`

- [ ] **Step 1: Create the file**

`lib/queryKeys.ts`:
```ts
import type { SearchParams } from '@/lib/api';

export const queryKeys = {
  feed: () => ['feed'] as const,
  search: (params: SearchParams) => ['search', params] as const,
  product: (id: string) => ['product', id] as const,
  seller: (id: string) => ['seller', id] as const,
  sellerProducts: (id: string) => ['sellerProducts', id] as const,
};
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/queryKeys.ts
git commit -m "feat(query): add queryKeys factory"
```

---

## Task 3: Create `lib/queryClient.ts`

**Files:**
- Create: `lib/queryClient.ts`

- [ ] **Step 1: Create the file**

`lib/queryClient.ts`:
```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/queryClient.ts
git commit -m "feat(query): add QueryClient singleton"
```

---

## Task 4: Create `lib/normalize.ts`

**Files:**
- Create: `lib/normalize.ts`

- [ ] **Step 1: Create the file**

`lib/normalize.ts`:
```ts
import type { ProductListItem } from '@/lib/api';
import type { Product } from '@/lib/types';

export function normalizeProduct(item: ProductListItem): Product {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.photos[0]?.url ?? '',
    seller: item.seller.name ?? '',
    sellerId: item.seller.id,
    category: item.category,
  };
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/normalize.ts
git commit -m "feat(query): extract shared normalizeProduct util"
```

---

## Task 5: Wrap app root with QueryClientProvider

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add QueryClientProvider**

In `app/_layout.tsx`, add the import and wrap the return:

```ts
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
```

Wrap the entire JSX return inside `QueryClientProvider` as the outermost wrapper:

```tsx
return (
  <QueryClientProvider client={queryClient}>
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <FilterSheetProvider>
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(public)" />
                <Stack.Screen name="(protected)" />
                <Stack.Screen name="auth" />
              </Stack>
            </BottomSheetModalProvider>
          </FilterSheetProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  </QueryClientProvider>
);
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(query): wrap app root with QueryClientProvider"
```

---

## Task 6: Migrate `useProduct`

**Files:**
- Modify: `features/product/hooks/useProduct.ts`

- [ ] **Step 1: Replace hook contents**

Full file replacement for `features/product/hooks/useProduct.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { fetchProduct, type ProductDetailItem } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useProduct(id: string) {
  const { data, isLoading, error } = useQuery<ProductDetailItem, Error>({
    queryKey: queryKeys.product(id),
    queryFn: () => fetchProduct(id),
  });

  return { data: data ?? null, isLoading, error };
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/product/hooks/useProduct.ts
git commit -m "feat(query): migrate useProduct to useQuery"
```

---

## Task 7: Migrate `useSeller`

**Files:**
- Modify: `features/seller/hooks/useSeller.ts`

- [ ] **Step 1: Replace hook contents**

Full file replacement for `features/seller/hooks/useSeller.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { fetchSeller, type PublicSellerProfile } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useSeller(id: string) {
  const { data, isLoading, error } = useQuery<PublicSellerProfile, Error>({
    queryKey: queryKeys.seller(id),
    queryFn: () => fetchSeller(id),
  });

  return { data: data ?? null, isLoading, error };
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/seller/hooks/useSeller.ts
git commit -m "feat(query): migrate useSeller to useQuery"
```

---

## Task 8: Migrate `useProductFeed`

**Files:**
- Modify: `features/home/hooks/useProductFeed.ts`

- [ ] **Step 1: Replace hook contents**

Full file replacement for `features/home/hooks/useProductFeed.ts`:

```ts
import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFeed } from '@/lib/api';
import { normalizeProduct } from '@/lib/normalize';
import { queryKeys } from '@/lib/queryKeys';

export function useProductFeed() {
  const q = useInfiniteQuery({
    queryKey: queryKeys.feed(),
    queryFn: ({ pageParam }) => fetchFeed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.nextCursor ?? undefined,
  });

  const fetchMore = useCallback(() => { q.fetchNextPage(); }, [q.fetchNextPage]);
  const refetch = useCallback(() => { q.refetch(); }, [q.refetch]);

  return {
    data: q.data?.pages.flatMap(p => p.items.map(normalizeProduct)) ?? [],
    isLoading: q.isLoading,
    error: q.error,
    fetchMore,
    hasMore: q.hasNextPage,
    refetch,
  };
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/home/hooks/useProductFeed.ts
git commit -m "feat(query): migrate useProductFeed to useInfiniteQuery"
```

---

## Task 9: Migrate `useSellerProducts`

**Files:**
- Modify: `features/seller/hooks/useSellerProducts.ts`

- [ ] **Step 1: Replace hook contents**

Full file replacement for `features/seller/hooks/useSellerProducts.ts`:

```ts
import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchSellerProducts } from '@/lib/api';
import { normalizeProduct } from '@/lib/normalize';
import { queryKeys } from '@/lib/queryKeys';

export function useSellerProducts(sellerId: string) {
  const q = useInfiniteQuery({
    queryKey: queryKeys.sellerProducts(sellerId),
    queryFn: ({ pageParam }) => fetchSellerProducts(sellerId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.nextCursor ?? undefined,
  });

  const fetchMore = useCallback(() => { q.fetchNextPage(); }, [q.fetchNextPage]);

  return {
    data: q.data?.pages.flatMap(p => p.items.map(normalizeProduct)) ?? [],
    isLoading: q.isLoading,
    error: q.error,
    fetchMore,
    hasMore: q.hasNextPage,
  };
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/seller/hooks/useSellerProducts.ts
git commit -m "feat(query): migrate useSellerProducts to useInfiniteQuery"
```

---

## Task 10: Migrate `useProductSearch`

**Files:**
- Modify: `features/search/hooks/useProductSearch.ts`

- [ ] **Step 1: Replace hook contents**

Full file replacement for `features/search/hooks/useProductSearch.ts`:

```ts
import { useCallback, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchSearch, type SearchParams } from '@/lib/api';
import { normalizeProduct } from '@/lib/normalize';
import { queryKeys } from '@/lib/queryKeys';

export function useProductSearch() {
  const [params, setParams] = useState<SearchParams | null>(null);

  const q = useInfiniteQuery({
    queryKey: queryKeys.search(params ?? {}),
    queryFn: ({ pageParam }) => fetchSearch(params!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.nextCursor ?? undefined,
    enabled: params !== null,
  });

  const search = useCallback((p: SearchParams) => setParams(p), []);
  const fetchMore = useCallback(() => { q.fetchNextPage(); }, [q.fetchNextPage]);

  return {
    data: q.data?.pages.flatMap(p => p.items.map(normalizeProduct)) ?? [],
    isLoading: q.isLoading,
    error: q.error,
    hasMore: q.hasNextPage,
    search,
    fetchMore,
  };
}
```

Note: when `params` changes, the `queryKey` changes automatically — TanStack Query treats it as a fresh query and resets pages. No manual reset needed.

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/search/hooks/useProductSearch.ts
git commit -m "feat(query): migrate useProductSearch to useInfiniteQuery"
```

---

## Task 11: Clean up duplicate normalize functions

**Files:**
- Modify: `features/home/hooks/useProductFeed.ts` *(already done in Task 8)*
- Modify: `features/search/hooks/useProductSearch.ts` *(already done in Task 10)*
- Modify: `features/seller/hooks/useSellerProducts.ts` *(already done in Task 9)*

The old `normalize()` functions were removed as part of Tasks 8–10 since the new implementations import from `lib/normalize.ts`. This task is a verification step only.

- [ ] **Step 1: Verify no local normalize() remains in hooks**

```bash
grep -r "function normalize" features/
```

Expected: no output.

- [ ] **Step 2: Final type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore(query): verify cleanup of duplicate normalize fns"
```
