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
  type FilterState,
  type SortOption,
} from "@/features/search/context/FilterSheetContext";
import { Tuning2 } from "@solar-icons/react-native/Linear";
import { mockProducts } from "@/lib/mockData";

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openFilterSheet } = useFilterSheet();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevan");

  const handleSearch = useCallback(() => {
    const query = searchQuery.trim();
    if (query) {
      router.push(`/search?search=${encodeURIComponent(query)}` as any);
    }
  }, [searchQuery, router]);

  const handleFilter = useCallback(
    (filters: FilterState) => {
      setSortBy(filters.sortBy);
      router.push("/search" as any);
    },
    [router],
  );

  const handleProductPress = useCallback(
    (productId: string) => {
      router.push(`/product/${productId}`);
    },
    [router],
  );

  const handleSellerPress = useCallback(
    (sellerId: string) => {
      router.push(`/user/${sellerId}`);
    },
    [router],
  );

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      <View
        className="bg-background px-5 pb-1"
        style={{ paddingTop: (insets.top > 0 ? insets.top : 24) + 0 }}
      >
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
