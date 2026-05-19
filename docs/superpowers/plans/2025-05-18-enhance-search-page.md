# Enhance Search/Cari Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the search page with clean & focused design, search history (max 3), sorting dropdown, and improved product grid.

**Architecture:** Refactor monolithic SearchProductsScreen into smaller components (SearchBar, SearchHistory, SortDropdown, ProductCard, EmptyState) for better maintainability. Use React state for search history and sorting.

**Tech Stack:** React Native, Expo, NativeWind (Tailwind), @solar-icons/react-native

---

## File Structure

| File | Purpose |
|------|---------|
| `features/search/SearchProductsScreen.tsx` | Main screen - refactored to use new components |
| `features/search/components/SearchBar.tsx` | Search input with 50px height, clear button |
| `features/search/components/SearchHistory.tsx` | History chips with delete per item (max 3) |
| `features/search/components/SortDropdown.tsx` | Sorting selector (Relevan, Terbaru, Termurah, Termahal) |
| `features/search/components/ProductCard.tsx` | Product card for grid display |
| `features/search/components/EmptyState.tsx` | Empty state with suggested searches |

---

## Task 1: Create SearchBar Component

**Files:**
- Create: `features/search/components/SearchBar.tsx`

- [ ] **Step 1: Create SearchBar component with 50px height**

```tsx
import { View, TextInput, TouchableOpacity } from "react-native";
import { Magnifer, CloseSquare } from "@solar-icons/react-native/Linear";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

const INPUT_HEIGHT = 50;
const INPUT_FONT_SIZE = 16;

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Cari produk yang kamu inginkan...",
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

- [ ] **Step 2: Commit**

```bash
git add features/search/components/SearchBar.tsx
git commit -m "feat(search): add SearchBar component with 50px height"
```


---

## Task 2: Create SearchHistory Component

**Files:**
- Create: `features/search/components/SearchHistory.tsx`

- [ ] **Step 1: Create SearchHistory component with delete per item**

```tsx
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Clock, CloseCircle } from "@solar-icons/react-native/Linear";

interface SearchHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
  onDelete: (query: string) => void;
  onClearAll: () => void;
}

export function SearchHistory({
  history,
  onSelect,
  onDelete,
  onClearAll,
}: SearchHistoryProps) {
  if (history.length === 0) return null;

  return (
    <View className="px-5 mt-4">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Clock size={16} color="#666666" />
          <Text className="text-sm font-medium text-gray-700 ml-2">
            Pencarian Terakhir
          </Text>
        </View>
        <TouchableOpacity onPress={onClearAll}>
          <Text className="text-xs text-primary">Hapus Semua</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {history.map((item, index) => (
          <TouchableOpacity
            key={`${item}-${index}`}
            onPress={() => onSelect(item)}
            className="flex-row items-center bg-white px-3 py-2 rounded-full border border-gray-200"
          >
            <Text className="text-sm text-gray-700 mr-2" numberOfLines={1}>
              {item}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseCircle size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/search/components/SearchHistory.tsx
git commit -m "feat(search): add SearchHistory component with delete per item"
```


---

## Task 3: Create SortDropdown Component

**Files:**
- Create: `features/search/components/SortDropdown.tsx`

- [ ] **Step 1: Create SortDropdown component**

```tsx
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { AltArrowDown, Check } from "@solar-icons/react-native/Linear";

export type SortOption = "relevan" | "terbaru" | "termurah" | "termahal";

interface SortDropdownProps {
  selected: SortOption;
  onSelect: (option: SortOption) => void;
}

const sortLabels: Record<SortOption, string> = {
  relevan: "Relevan",
  terbaru: "Terbaru",
  termurah: "Termurah",
  termahal: "Termahal",
};

const sortOptions: SortOption[] = ["relevan", "terbaru", "termurah", "termahal"];

export function SortDropdown({ selected, onSelect }: SortDropdownProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="px-5 py-3 flex-row items-center">
      <Text className="text-sm text-gray-500 mr-2">Urutkan:</Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className="flex-row items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200"
      >
        <Text className="text-sm text-gray-800 mr-1">
          {sortLabels[selected]}
        </Text>
        <AltArrowDown size={16} color="#666666" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View className="flex-1 bg-black/30 justify-center items-center px-10">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-2xl w-full py-2">
                <Text className="text-base font-medium text-gray-800 px-4 py-3 border-b border-gray-100">
                  Urutkan Berdasarkan
                </Text>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      onSelect(option);
                      setVisible(false);
                    }}
                    className="flex-row items-center justify-between px-4 py-3"
                  >
                    <Text
                      className={`text-base ${
                        selected === option ? "text-primary font-medium" : "text-gray-800"
                      }`}
                    >
                      {sortLabels[option]}
                    </Text>
                    {selected === option && (
                      <Check size={20} color="#155DFC" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/search/components/SortDropdown.tsx
git commit -m "feat(search): add SortDropdown component"
```


---

## Task 4: Create ProductCard Component

**Files:**
- Create: `features/search/components/ProductCard.tsx`

- [ ] **Step 1: Create ProductCard component**

```tsx
import { View, Text, TouchableOpacity, Image, DimensionValue } from "react-native";
import { ArrowRight2, Shop } from "@solar-icons/react-native/Linear";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  store: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  width?: DimensionValue;
  marginRight?: DimensionValue;
}

export function ProductCard({
  product,
  onPress,
  width = "48%",
  marginRight = 0,
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl overflow-hidden border border-gray-100 mb-4"
      style={{
        width,
        marginRight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: product.image }}
        className="w-full h-32 bg-gray-100"
        resizeMode="cover"
      />
      <View className="p-3">
        <Text
          className="text-sm font-medium text-gray-800 mb-1"
          numberOfLines={2}
        >
          {product.name}
        </Text>
        <Text className="text-sm font-semibold text-primary mb-2">
          {formatPrice(product.price)}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Shop size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
              {product.store}
            </Text>
          </View>
          <TouchableOpacity className="w-6 h-6 bg-gray-100 rounded-full items-center justify-center">
            <ArrowRight2 size={12} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/search/components/ProductCard.tsx
git commit -m "feat(search): add ProductCard component"
```


---

## Task 5: Create EmptyState Component

**Files:**
- Create: `features/search/components/EmptyState.tsx`

- [ ] **Step 1: Create EmptyState component with suggestions**

```tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Magnifer, Search } from "@solar-icons/react-native/Linear";

interface EmptyStateProps {
  query: string;
  suggestions: string[];
  onSuggestionPress: (suggestion: string) => void;
}

export function EmptyState({
  query,
  suggestions,
  onSuggestionPress,
}: EmptyStateProps) {
  return (
    <View className="items-center px-8 py-12">
      <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Magnifer size={32} color="#9CA3AF" />
      </View>
      <Text className="text-base font-medium text-gray-800 mb-1">
        Produk tidak ditemukan
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-6">
        Coba kata kunci lain atau periksa ejaanmu
      </Text>

      {suggestions.length > 0 && (
        <View className="w-full">
          <Text className="text-sm text-gray-600 mb-3">Coba cari:</Text>
          <View className="flex-row flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                onPress={() => onSuggestionPress(suggestion)}
                className="flex-row items-center bg-white px-3 py-2 rounded-full border border-gray-200"
              >
                <Search size={12} color="#666666" />
                <Text className="text-sm text-gray-700 ml-1.5">
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/search/components/EmptyState.tsx
git commit -m "feat(search): add EmptyState component with suggestions"
```


---

## Task 6: Refactor SearchProductsScreen

**Files:**
- Modify: `features/search/SearchProductsScreen.tsx`
- Create directory: `features/search/components/` (if not exists)

- [ ] **Step 1: Create components directory if not exists**

```bash
mkdir -p features/search/components
```

- [ ] **Step 2: Replace entire SearchProductsScreen with refactored version**

```tsx
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SearchBar } from "./components/SearchBar";
import { SearchHistory } from "./components/SearchHistory";
import { SortDropdown, type SortOption } from "./components/SortDropdown";
import { ProductCard } from "./components/ProductCard";
import { EmptyState } from "./components/EmptyState";
import { Fire } from "@solar-icons/react-native/Linear";

// Mock data produk
const mockProducts = [
  {
    id: "1",
    name: "Sepatu Sneakers Pria",
    price: 250000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Sneakers",
    store: "Toko Sepatu Jaya",
    category: "Fashion",
  },
  {
    id: "2",
    name: "Tas Ransel Laptop",
    price: 180000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Tas",
    store: "Bag Corner",
    category: "Aksesoris",
  },
  {
    id: "3",
    name: "Kemeja Flannel",
    price: 150000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Kemeja",
    store: "Fashion Store",
    category: "Fashion",
  },
  {
    id: "4",
    name: "Jam Tangan Analog",
    price: 350000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Jam",
    store: "Timepiece ID",
    category: "Aksesoris",
  },
  {
    id: "5",
    name: "Hoodie Oversized",
    price: 200000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Hoodie",
    store: "Streetwear Hub",
    category: "Fashion",
  },
  {
    id: "6",
    name: "Topi Baseball",
    price: 75000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Topi",
    store: "Cap Store",
    category: "Aksesoris",
  },
];

// Kategori populer
const popularCategories = [
  "Fashion Pria",
  "Fashion Wanita",
  "Elektronik",
  "Aksesoris",
  "Sepatu",
  "Tas",
];

// Saran pencarian (static)
const searchSuggestions = [
  "Sepatu Nike",
  "Tas Laptop",
  "Kemeja Polos",
  "Jam Tangan",
];

export function SearchProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([
    "Sepatu running",
    "Tas kulit",
    "Jam tangan",
  ]);
  const [sortBy, setSortBy] = useState<SortOption>("relevan");
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);

  // Handle search
  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) {
      setFilteredProducts(mockProducts);
      return;
    }

    // Add to history (max 3)
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== query);
      return [query, ...filtered].slice(0, 3);
    });

    // Filter products
    const filtered = mockProducts.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery]);

  // Handle sort
  const handleSort = useCallback(
    (option: SortOption) => {
      setSortBy(option);
      const sorted = [...filteredProducts].sort((a, b) => {
        switch (option) {
          case "terbaru":
            return parseInt(b.id) - parseInt(a.id);
          case "termurah":
            return a.price - b.price;
          case "termahal":
            return b.price - a.price;
          default:
            return 0;
        }
      });
      setFilteredProducts(sorted);
    },
    [filteredProducts]
  );

  // Handle history delete
  const handleDeleteHistory = useCallback((item: string) => {
    setSearchHistory((prev) => prev.filter((h) => h !== item));
  }, []);

  // Handle clear all history
  const handleClearAllHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  // Handle category select
  const handleCategorySelect = useCallback((category: string) => {
    setSearchQuery(category);
    const filtered = mockProducts.filter((product) =>
      product.category.toLowerCase().includes(category.toLowerCase()) ||
      product.name.toLowerCase().includes(category.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, []);

  // Handle product press
  const handleProductPress = useCallback(
    (productId: string) => {
      router.push(`/product/${productId}`);
    },
    [router]
  );

  // Handle suggestion press
  const handleSuggestionPress = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    const filtered = mockProducts.filter((product) =>
      product.name.toLowerCase().includes(suggestion.toLowerCase())
    );
    setFilteredProducts(filtered);
    // Add to history
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== suggestion);
      return [suggestion, ...filtered].slice(0, 3);
    });
  }, []);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header with Search */}
      <View
        className="bg-background px-5 pb-2"
        style={{ paddingTop: (insets.top > 0 ? insets.top : 24) + 16 }}
      >
        <Text className="text-2xl font-heading font-medium mb-4">
          Cari Produk
        </Text>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
        />
      </View>

      {/* Sort Dropdown */}
      <SortDropdown selected={sortBy} onSelect={handleSort} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Search History */}
        {!searchQuery && (
          <SearchHistory
            history={searchHistory}
            onSelect={setSearchQuery}
            onDelete={handleDeleteHistory}
            onClearAll={handleClearAllHistory}
          />
        )}

        {/* Popular Categories */}
        {!searchQuery && (
          <View className="px-5 mt-6">
            <View className="flex-row items-center mb-3">
              <Fire size={16} color="#F97316" />
              <Text className="text-sm font-medium text-gray-700 ml-2">
                Kategori Populer
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {popularCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => handleCategorySelect(category)}
                  className="bg-white px-4 py-2 rounded-full border border-gray-200"
                >
                  <Text className="text-sm text-gray-700">{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Product Grid */}
        <View className="px-5 mt-6">
          {searchQuery && (
            <Text className="text-sm text-gray-500 mb-4">
              {filteredProducts.length} hasil untuk "{searchQuery}"
            </Text>
          )}

          {!searchQuery && (
            <Text className="text-base font-medium text-gray-800 mb-3">
              Rekomendasi Untukmu
            </Text>
          )}

          <View className="flex-row flex-wrap">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product.id)}
                width="48%"
                marginRight={index % 2 === 0 ? "4%" : 0}
              />
            ))}
          </View>

          {/* Empty State */}
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

- [ ] **Step 3: Commit**

```bash
git add features/search/SearchProductsScreen.tsx
git commit -m "feat(search): refactor SearchProductsScreen with new components"
```


---

## Task 7: Run TypeScript Check

**Files:**
- Check all modified files

- [ ] **Step 1: Run TypeScript compiler to check for errors**

```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 2: Commit** (if no errors)

```bash
git add -A
git commit -m "refactor(search): complete search page enhancement with all components"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] SearchBar with 50px height - Task 1
- [x] Search history (max 3) with delete per item - Task 2
- [x] SortDropdown (Relevan, Terbaru, Termurah, Termahal) - Task 3
- [x] ProductCard for 2-column grid - Task 4
- [x] EmptyState with suggestions - Task 5
- [x] Refactored main screen - Task 6

**2. Placeholder scan:**
- [x] No "TBD", "TODO", or "implement later"
- [x] All code is complete and copy-paste ready
- [x] All steps have exact commands with expected output

**3. Type consistency:**
- [x] `SortOption` type exported and used consistently
- [x] Component props interfaces defined
- [x] Mock data structure matches Product interface

All requirements covered. Ready for execution.
