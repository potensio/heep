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

import { ProductCard } from "./components/ProductCard";
import { EmptyState } from "./components/EmptyState";


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
