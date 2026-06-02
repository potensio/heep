# My Listings Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Produk Saya" screen accessible from Settings that shows the logged-in user's active product listings.

**Architecture:** Reuses the existing `GET /users/:id/products` endpoint (no backend changes). A new `useMyListings` hook reads `user.id` from `AuthContext` and pages through `fetchSellerProducts`. The screen mirrors `SavedProductsScreen` in structure. Settings wires a new nav callback to a new `produk.tsx` route.

**Tech Stack:** React Native, Expo Router, TanStack Query (`useInfiniteQuery`), NativeWind, `@solar-icons/react-native`

---

### Task 1: Add `myListings` query key

**Files:**
- Modify: `apps/mobile/lib/queryKeys.ts`

- [ ] **Step 1: Add the key**

Open `apps/mobile/lib/queryKeys.ts`. The file currently ends with `isSaved`. Add one entry:

```ts
import type { SearchParams } from '@/lib/api';

export const queryKeys = {
  feed: () => ['feed'] as const,
  search: (params: SearchParams) => ['search', params] as const,
  product: (id: string) => ['product', id] as const,
  seller: (id: string) => ['seller', id] as const,
  sellerProducts: (id: string) => ['sellerProducts', id] as const,
  savedProducts: () => ['savedProducts'] as const,
  isSaved: (productId: string) => ['isSaved', productId] as const,
  myListings: () => ['myListings'] as const,
};
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep queryKeys
```

Expected: no output (no errors in this file).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/queryKeys.ts
git commit -m "feat(my-listings): add myListings query key"
```

---

### Task 2: Create `useMyListings` hook

**Files:**
- Create: `apps/mobile/features/my-listings/hooks/useMyListings.ts`

- [ ] **Step 1: Create the file**

```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchSellerProducts } from '@/lib/api';
import { normalizeProduct } from '@/lib/normalize';
import { queryKeys } from '@/lib/queryKeys';

export function useMyListings() {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: queryKeys.myListings(),
    queryFn: ({ pageParam }) => fetchSellerProducts(user!.id, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!user,
    initialPageParam: undefined as string | undefined,
  });

  return {
    data: query.data?.pages.flatMap(p => p.items.map(normalizeProduct)) ?? [],
    isLoading: query.isLoading,
    error: query.error,
    fetchMore: query.fetchNextPage,
    hasMore: query.hasNextPage,
    refetch: query.refetch,
  };
}
```

- [ ] **Step 2: Check `AuthContext` exports `user` with an `id` field**

Open `apps/mobile/context/AuthContext.tsx` and confirm the context value exposes `user: VerifiedUser | null` where `VerifiedUser` has `id: string`. If the field name differs, adjust the hook accordingly.

- [ ] **Step 3: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep "my-listings"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/features/my-listings/hooks/useMyListings.ts
git commit -m "feat(my-listings): add useMyListings hook"
```

---

### Task 3: Create `MyListingsScreen`

**Files:**
- Create: `apps/mobile/features/my-listings/MyListingsScreen.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { TouchableOpacity } from 'react-native';
import { ProductCard } from '@/features/search/components/ProductCard';
import { useMyListings } from './hooks/useMyListings';

export function MyListingsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, fetchMore, hasMore, refetch } = useMyListings();

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center px-4 py-3 bg-background"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 ml-3">Produk Saya</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#155DFC" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 text-center">Gagal memuat produk.</Text>
        </View>
      ) : data.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-500 text-center">Belum ada produk aktif.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperClassName="px-4 justify-between"
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.id}`)}
              onSellerPress={() => {}}
              width="48%"
              marginRight={0}
            />
          )}
          onEndReached={() => hasMore && fetchMore()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={hasMore ? <ActivityIndicator size="small" color="#155DFC" /> : null}
        />
      )}
    </View>
  );
}
```

Note: `onSellerPress` is a no-op (`() => {}`) — tapping the seller chip on your own listing navigating to yourself is pointless.

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep "MyListings\|my-listings"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/my-listings/MyListingsScreen.tsx
git commit -m "feat(my-listings): add MyListingsScreen component"
```

---

### Task 4: Add the Expo Router route

**Files:**
- Create: `apps/mobile/app/(protected)/settings/produk.tsx`

- [ ] **Step 1: Create the thin route wrapper**

```tsx
import { MyListingsScreen } from '@/features/my-listings/MyListingsScreen';

export default function MyListingsRoute() {
  return <MyListingsScreen />;
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep "produk\|MyListings"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/app/(protected)/settings/produk.tsx"
git commit -m "feat(my-listings): add settings/produk route"
```

---

### Task 5: Wire settings menu

**Files:**
- Modify: `apps/mobile/features/settings/SettingsScreen.tsx`
- Modify: `apps/mobile/app/(protected)/settings/index.tsx`

- [ ] **Step 1: Add prop and menu item to `SettingsScreen.tsx`**

Add `onNavigateToListings: () => void` to the props interface and a new `SettingsItem` between "Nomor Handphone" and "Produk Disimpan". Use the `Tag` icon from `@solar-icons/react-native/Linear`.

```tsx
import { View, ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsItem } from "./components/SettingsItem";
import { User, Phone, Tag, Bookmark, Bell, Logout } from "@solar-icons/react-native/Linear";

interface SettingsScreenProps {
  onNavigateToProfile: () => void;
  onNavigateToPhone: () => void;
  onNavigateToListings: () => void;
  onNavigateToSaved: () => void;
  onNavigateToNotifications: () => void;
  onLogout: () => void;
}

export function SettingsScreen({
  onNavigateToProfile,
  onNavigateToPhone,
  onNavigateToListings,
  onNavigateToSaved,
  onNavigateToNotifications,
  onLogout,
}: SettingsScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top > 0 ? insets.top : 24 }}
      >
        <View className="px-5 gap-6">
          <Text className="text-2xl font-heading font-medium">Pengaturan</Text>

          <View>
            <Text className="text-sm text-gray-500 px-4 mb-2">Akun & Profil</Text>
            <View>
              <SettingsItem
                icon={<User size={20} className="text-gray-700" />}
                label="Profil"
                onPress={onNavigateToProfile}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Phone size={20} className="text-gray-700" />}
                label="Nomor Handphone"
                onPress={onNavigateToPhone}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Tag size={20} className="text-gray-700" />}
                label="Produk Saya"
                onPress={onNavigateToListings}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Bookmark size={20} className="text-gray-700" />}
                label="Produk Disimpan"
                onPress={onNavigateToSaved}
              />
            </View>
          </View>

          <View>
            <Text className="text-sm text-gray-500 px-4 mb-2">Aplikasi</Text>
            <View>
              <SettingsItem
                icon={<Bell size={20} className="text-gray-700" />}
                label="Notifikasi"
                onPress={onNavigateToNotifications}
              />
              <View className="h-px bg-gray-200 ml-16" />
              <SettingsItem
                icon={<Logout size={20} className="text-accent-red" />}
                label="Keluar"
                onPress={onLogout}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Wire the callback in `settings/index.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

export default function SettingsIndex() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SettingsScreen
      onNavigateToProfile={() => router.push('/(protected)/settings/profil')}
      onNavigateToPhone={() => router.push('/(protected)/settings/handphone')}
      onNavigateToListings={() => router.push('/(protected)/settings/produk')}
      onNavigateToSaved={() => router.push('/(protected)/settings/saved')}
      onNavigateToNotifications={() => router.push('/(protected)/settings/notifikasi')}
      onLogout={() => {
        logout();
        router.replace('/(tabs)');
      }}
    />
  );
}
```

- [ ] **Step 3: Type-check the whole app**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep -v "ProductDetailScreen"
```

Expected: no new errors (the pre-existing `ProductDetailScreen` error is excluded by the grep).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/features/settings/SettingsScreen.tsx "apps/mobile/app/(protected)/settings/index.tsx"
git commit -m "feat(my-listings): wire Produk Saya into settings menu"
```
