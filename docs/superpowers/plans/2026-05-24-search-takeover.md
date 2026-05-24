# Search Takeover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home screen's live search bar + filter button with a dummy tap-target that navigates to a dedicated search screen where the keyboard opens immediately.

**Architecture:** `HomeScreen` gets a non-interactive styled button; `SearchProductsScreen` is refactored to accept all data and callbacks as props (removing internal router calls); the route wrapper `app/(public)/search.tsx` reads params and wires up navigation. This matches the project's props-over-routing rule.

**Tech Stack:** React Native (Expo), Expo Router v6, NativeWind v4, `@solar-icons/react-native`

---

## File Map

| Action | File |
|--------|------|
| Modify | `apps/mobile/features/search/components/SearchBar.tsx` |
| Modify | `apps/mobile/features/search/SearchProductsScreen.tsx` |
| Modify | `apps/mobile/app/(public)/search.tsx` |
| Modify | `apps/mobile/features/home/HomeScreen.tsx` |

---

### Task 1: Add `autoFocus` prop to `SearchBar`

**Files:**
- Modify: `apps/mobile/features/search/components/SearchBar.tsx`

- [ ] **Step 1: Update `SearchBar` to accept and forward `autoFocus`**

Replace the entire file with:

```tsx
import { View, TextInput, TouchableOpacity } from "react-native";
import { Magnifer, CloseSquare } from "@solar-icons/react-native/Linear";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const INPUT_HEIGHT = 40;
const INPUT_FONT_SIZE = 16;

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Cari produk yang kamu inginkan...",
  autoFocus = false,
}: SearchBarProps) {
  return (
    <View
      className="flex-row items-center border border-gray-300 rounded-xl bg-white px-4 overflow-hidden"
      style={{ height: INPUT_HEIGHT }}
    >
      <Magnifer size={20} color="#666666" />
      <TextInput
        className="flex-1 ml-3 text-gray-900"
        style={{ fontSize: INPUT_FONT_SIZE, height: INPUT_HEIGHT }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} className="p-1">
          <CloseSquare size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/search/components/SearchBar.tsx
git commit -m "feat(search): add autoFocus prop to SearchBar"
```

---

### Task 2: Refactor `SearchProductsScreen` to use props

**Files:**
- Modify: `apps/mobile/features/search/SearchProductsScreen.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchBar } from "./components/SearchBar";
import { ProductCard } from "./components/ProductCard";
import { EmptyState } from "./components/EmptyState";
import { useFilterSheet } from "./context/FilterSheetContext";
import type { FilterState, SortOption } from "./context/FilterSheetContext";
import { Filter, ArrowLeft } from "@solar-icons/react-native/Linear";
import { mockProducts } from "@/lib/mockData";

const searchSuggestions = ["Sepatu Nike", "Tas Laptop", "Kemeja Polos", "Jam Tangan"];

interface SearchProductsScreenProps {
  initialQuery?: string;
  onBack: () => void;
  onProductPress: (id: string) => void;
  onSellerPress: (id: string) => void;
}

export function SearchProductsScreen({
  initialQuery = "",
  onBack,
  onProductPress,
  onSellerPress,
}: SearchProductsScreenProps) {
  const insets = useSafeAreaInsets();
  const { openFilterSheet } = useFilterSheet();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filteredProducts, setFilteredProducts] = useState(() => {
    if (!initialQuery.trim()) return mockProducts;
    return mockProducts.filter((p) =>
      p.name.toLowerCase().includes(initialQuery.toLowerCase())
    );
  });
  const [sortBy, setSortBy] = useState<SortOption>("relevan");

  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) {
      setFilteredProducts(mockProducts);
      return;
    }
    setFilteredProducts(
      mockProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [searchQuery]);

  const handleFilter = useCallback((filters: FilterState) => {
    let filtered = [...mockProducts];
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) =>
        filters.categories.some((cat) =>
          (p.category ?? "").toLowerCase().includes(cat.toLowerCase())
        )
      );
    }
    if (filters.minPrice !== null) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }
    setSortBy(filters.sortBy);
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "terbaru": return parseInt(b.id) - parseInt(a.id);
        case "termurah": return a.price - b.price;
        case "termahal": return b.price - a.price;
        default: return 0;
      }
    });
    setFilteredProducts(filtered);
  }, []);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    setFilteredProducts(
      mockProducts.filter((p) =>
        p.name.toLowerCase().includes(suggestion.toLowerCase())
      )
    );
  }, []);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View
        className="bg-background px-5 pb-2"
        style={{ paddingTop: (insets.top > 0 ? insets.top : 24) + 16 }}
      >
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={onBack} className="p-1">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSearch}
              autoFocus
            />
          </View>
          <TouchableOpacity
            className="items-center justify-center bg-white rounded-xl border border-gray-200"
            style={{ width: 40, height: 40 }}
            onPress={() => openFilterSheet(handleFilter, { sortBy })}
          >
            <Filter size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-5 mt-6">
          {searchQuery.length > 0 && (
            <Text className="text-sm text-gray-500 mb-4">
              {filteredProducts.length} hasil untuk "{searchQuery}"
            </Text>
          )}
          <View className="flex-row flex-wrap">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => onProductPress(product.id)}
                onSellerPress={() => onSellerPress(product.sellerId ?? "")}
                width="48%"
                marginRight={index % 2 === 0 ? "4%" : 0}
              />
            ))}
          </View>
          {filteredProducts.length === 0 && (
            <EmptyState
              query={searchQuery}
              suggestions={searchSuggestions}
              onSuggestionPress={handleSuggestionPress}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: error on `app/(public)/search.tsx` — missing required props. That's correct; it gets fixed in the next task.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/search/SearchProductsScreen.tsx
git commit -m "feat(search): refactor SearchProductsScreen to use props, add autofocus and back button"
```

---

### Task 3: Update the search route wrapper

**Files:**
- Modify: `apps/mobile/app/(public)/search.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { SearchProductsScreen } from "@/features/search/SearchProductsScreen";

export default function SearchRoute() {
  const { search } = useLocalSearchParams<{ search?: string }>();
  const router = useRouter();

  return (
    <SearchProductsScreen
      initialQuery={search ?? ""}
      onBack={() => router.back()}
      onProductPress={(id) => router.push(`/product/${id}`)}
      onSellerPress={(id) => router.push(`/user/${id}`)}
    />
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(public)/search.tsx
git commit -m "feat(search): wire route wrapper — pass initialQuery and nav callbacks as props"
```

---

### Task 4: Replace home screen search bar with dummy tap target

**Files:**
- Modify: `apps/mobile/features/home/HomeScreen.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback } from "react";
import { useRouter } from "expo-router";
import { ActionGrid } from "./components/ActionGrid";
import { BannerCarousel } from "./components/BannerCarousel";
import { ProductCard } from "@/features/search/components/ProductCard";
import { Magnifer } from "@solar-icons/react-native/Linear";
import { mockProducts } from "@/lib/mockData";

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleProductPress = useCallback(
    (productId: string) => {
      router.push(`/product/${productId}`);
    },
    [router]
  );

  const handleSellerPress = useCallback(
    (sellerId: string) => {
      router.push(`/user/${sellerId}`);
    },
    [router]
  );

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      <View
        className="bg-background px-5 pb-1"
        style={{ paddingTop: (insets.top > 0 ? insets.top : 24) + 0 }}
      >
        <TouchableOpacity
          className="flex-row items-center border border-gray-300 rounded-xl bg-white px-4 overflow-hidden"
          style={{ height: 40 }}
          onPress={() => router.push("/search" as any)}
          activeOpacity={0.8}
        >
          <Magnifer size={20} color="#666666" />
          <Text
            className="flex-1 ml-3 text-gray-400"
            style={{ fontSize: 16 }}
          >
            Cari produk yang kamu inginkan...
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <BannerCarousel />

        <View className="px-5 gap-6">
          <ActionGrid />

          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-heading text-xl">Produk Terbaru</Text>
              <TouchableOpacity onPress={() => router.push("/search" as any)}>
                <Text
                  className="text-sm text-black leading-4 underline"
                  style={{ fontWeight: "500" }}
                >
                  Lihat semua
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap -mx-1">
              {mockProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => handleProductPress(product.id)}
                  onSellerPress={() => handleSellerPress(product.sellerId ?? "")}
                  width="48%"
                  marginRight={index % 2 === 0 ? "4%" : 0}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/home/HomeScreen.tsx
git commit -m "feat(home): replace live search bar with dummy tap-target, remove filter button"
```
