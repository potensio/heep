import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { ActionGrid } from "./components/ActionGrid";
import { BannerCarousel } from "./components/BannerCarousel";
import { SearchBar } from "@/features/search/components/SearchBar";
import { ProductCard } from "@/features/search/components/ProductCard";
import {
  useFilterSheet,
  FilterSheetProvider,
  type FilterState,
  type SortOption,
} from "@/features/search/context/FilterSheetContext";
import { Tuning2 } from "@solar-icons/react-native/Linear";

// Mock data produk
const mockProducts = [
  {
    id: "1",
    name: "Sepatu Sneakers Pria",
    price: 250000,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    seller: "Andi",
    sellerId: "seller-1",
    category: "Fashion",
  },
  {
    id: "2",
    name: "Tas Ransel Laptop",
    price: 180000,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    seller: "Budi",
    sellerId: "seller-2",
    category: "Aksesoris",
  },
  {
    id: "3",
    name: "Kemeja Flannel",
    price: 150000,
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop",
    seller: "Citra",
    sellerId: "seller-3",
    category: "Fashion",
  },
  {
    id: "4",
    name: "Jam Tangan Analog",
    price: 350000,
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop",
    seller: "Dian",
    sellerId: "seller-4",
    category: "Aksesoris",
  },
  {
    id: "5",
    name: "Hoodie Oversized",
    price: 200000,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
    seller: "Eka",
    sellerId: "seller-5",
    category: "Fashion",
  },
  {
    id: "6",
    name: "Topi Baseball",
    price: 75000,
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop",
    seller: "Fani",
    sellerId: "seller-6",
    category: "Aksesoris",
  },
  {
    id: "7",
    name: "Kaos Polos Premium",
    price: 85000,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    seller: "Gina",
    sellerId: "seller-7",
    category: "Fashion",
  },
  {
    id: "8",
    name: "Dompet Kulit Pria",
    price: 120000,
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop",
    seller: "Hadi",
    sellerId: "seller-8",
    category: "Aksesoris",
  },
  {
    id: "9",
    name: "Celana Jeans Slim",
    price: 175000,
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
    seller: "Irma",
    sellerId: "seller-9",
    category: "Fashion",
  },
  {
    id: "10",
    name: "Kacamata Fashion",
    price: 95000,
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
    seller: "Joko",
    sellerId: "seller-10",
    category: "Aksesoris",
  },
  {
    id: "11",
    name: "Jaket Denim Classic",
    price: 280000,
    image:
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop",
    seller: "Kirana",
    sellerId: "seller-11",
    category: "Fashion",
  },
  {
    id: "12",
    name: "Ikat Pinggang Kulit",
    price: 65000,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    seller: "Leo",
    sellerId: "seller-12",
    category: "Aksesoris",
  },
];

function HomeScreenContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openFilterSheet } = useFilterSheet();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevan");

  // Handle search
  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (query) {
      // Navigate to search screen with query
      router.push(`/(tabs)/cari?search=${encodeURIComponent(query)}`);
    }
  }, [searchQuery, router]);

  // Handle filter
  const handleFilter = useCallback(
    (filters: FilterState) => {
      setSortBy(filters.sortBy);
      // Navigate to search screen with filters
      router.push("/(tabs)/cari");
    },
    [router],
  );

  // Handle product press
  const handleProductPress = useCallback(
    (productId: string) => {
      router.push(`/product/${productId}`);
    },
    [router],
  );

  // Handle seller press
  const handleSellerPress = useCallback(
    (sellerId: string) => {
      router.push(`/user/${sellerId}`);
    },
    [router],
  );

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header with Search */}
      <View
        className="bg-background px-5 pb-1"
        style={{ paddingTop: (insets.top > 0 ? insets.top : 24) + 0 }}
      >
        {/* Search Bar with Filter Button */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmit={handleSearch}
            />
          </View>
          <TouchableOpacity
            className="items-center justify-center bg-white rounded-2xl border border-gray-300"
            style={{ width: 40, height: 40 }}
            onPress={() => openFilterSheet(handleFilter, { sortBy })}
          >
            <Tuning2 size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Banner/Carousel Section */}
        <BannerCarousel />

        <View className="px-5 gap-6">
          {/* Action Buttons */}
          <ActionGrid />

          {/* Product Grid Section */}
          <View>
            {/* Section Header */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-heading text-xl">Produk Terbaru</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/cari")}>
                <Text
                  className="text-sm text-black leading-4 underline"
                  style={{ fontWeight: "500" }}
                >
                  Lihat semua
                </Text>
              </TouchableOpacity>
            </View>

            {/* Product Grid */}
            <View className="flex-row flex-wrap -mx-1">
              {mockProducts.map((product, index) => (
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
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function HomeScreen() {
  return (
    <FilterSheetProvider>
      <HomeScreenContent />
    </FilterSheetProvider>
  );
}
