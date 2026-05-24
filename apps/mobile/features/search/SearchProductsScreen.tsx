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
