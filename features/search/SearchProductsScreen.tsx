import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { useState, useCallback, useRef } from "react";
import BottomSheet from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SearchBar } from "./components/SearchBar";
import { ProductCard } from "./components/ProductCard";
import { EmptyState } from "./components/EmptyState";
import { SortBottomSheet, type SortOption } from "./components/SortBottomSheet";
import { FilterBottomSheet } from "./components/FilterBottomSheet";
import type { FilterState } from "./components/FilterBottomSheet";
import { SortFromTopToBottom, Filter } from "@solar-icons/react-native/Linear";


// Mock data produk
const mockProducts = [
  {
    id: "1",
    name: "Sepatu Sneakers Pria",
    price: 250000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Sneakers",
    seller: "Andi",
    sellerId: "seller-1",
    category: "Fashion",
  },
  {
    id: "2",
    name: "Tas Ransel Laptop",
    price: 180000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Tas",
    seller: "Budi",
    sellerId: "seller-2",
    category: "Aksesoris",
  },
  {
    id: "3",
    name: "Kemeja Flannel",
    price: 150000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Kemeja",
    seller: "Citra",
    sellerId: "seller-3",
    category: "Fashion",
  },
  {
    id: "4",
    name: "Jam Tangan Analog",
    price: 350000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Jam",
    seller: "Dian",
    sellerId: "seller-4",
    category: "Aksesoris",
  },
  {
    id: "5",
    name: "Hoodie Oversized",
    price: 200000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Hoodie",
    seller: "Eka",
    sellerId: "seller-5",
    category: "Fashion",
  },
  {
    id: "6",
    name: "Topi Baseball",
    price: 75000,
    image: "https://placehold.co/100x100/e5e7eb/666666/png?text=Topi",
    seller: "Fani",
    sellerId: "seller-6",
    category: "Aksesoris",
  },
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
  
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);
  const [sortBy, setSortBy] = useState<SortOption>("relevan");
  const sortSheetRef = useRef<BottomSheet>(null);
  const filterSheetRef = useRef<BottomSheet>(null);

  // Handle search
  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (!query) {
      setFilteredProducts(mockProducts);
      return;
    }

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

  // Handle filter
  const handleFilter = useCallback(
    (filters: FilterState) => {
      let filtered = [...mockProducts];

      // Filter by category
      if (filters.categories.length > 0) {
        filtered = filtered.filter((product) =>
          filters.categories.some((cat) =>
            product.category.toLowerCase().includes(cat.toLowerCase())
          )
        );
      }

      // Filter by price range
      switch (filters.priceRange) {
        case "under100k":
          filtered = filtered.filter((p) => p.price < 100000);
          break;
        case "100k-500k":
          filtered = filtered.filter((p) => p.price >= 100000 && p.price <= 500000);
          break;
        case "500k-1m":
          filtered = filtered.filter(
            (p) => p.price > 500000 && p.price <= 1000000
          );
          break;
        case "above1m":
          filtered = filtered.filter((p) => p.price > 1000000);
          break;
      }

      setFilteredProducts(filtered);
    },
    []
  );

  // Handle product press
  const handleProductPress = useCallback(
    (productId: string) => {
      router.push(`/product/${productId}`);
    },
    [router]
  );

  // Handle seller press
  const handleSellerPress = useCallback(
    (sellerId: string) => {
      router.push(`/user/${sellerId}`);
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
  }, []);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header with Search */}
      <View
        className="bg-background px-5 pb-2"
        style={{ paddingTop: (insets.top > 0 ? insets.top : 24) + 16 }}
      >
        {/* Search Bar with Sort & Filter Buttons */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSearch}
            />
          </View>
          <TouchableOpacity
            className="items-center justify-center bg-white rounded-xl border border-gray-200"
            style={{ width: 50, height: 50 }}
            onPress={() => sortSheetRef.current?.expand()}
          >
            <SortFromTopToBottom size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center justify-center bg-white rounded-xl border border-gray-200"
            style={{ width: 50, height: 50 }}
            onPress={() => filterSheetRef.current?.expand()}
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
        {/* Product Grid */}
        <View className="px-5 mt-6">
          {searchQuery && (
            <Text className="text-sm text-gray-500 mb-4">
              {filteredProducts.length} hasil untuk "{searchQuery}"
            </Text>
          )}

          <View className="flex-row flex-wrap">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product.id)}
                onSellerPress={() => handleSellerPress(product.sellerId)}
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

      {/* Bottom Sheets */}
      <SortBottomSheet
        bottomSheetRef={sortSheetRef}
        selected={sortBy}
        onSelect={handleSort}
      />
      <FilterBottomSheet bottomSheetRef={filterSheetRef} onApply={handleFilter} />
    </View>
  );
}
