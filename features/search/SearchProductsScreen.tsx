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
