import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSavedProducts } from "./hooks/useSavedProducts";
import { ProductCard } from "@/features/search/components/ProductCard";

export function SavedProductsScreen() {
  const router = useRouter();
  const { data, isLoading, error, fetchMore, hasMore, refetch } = useSavedProducts();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#155DFC" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-gray-500 text-center">Gagal memuat produk disimpan.</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-gray-500 text-center">Belum ada produk disimpan.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="px-4 justify-between"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/product/${item.id}`)}
            onSellerPress={() => router.push(`/user/${item.sellerId}`)}
            width="48%"
            marginRight={0}
          />
        )}
        onEndReached={() => hasMore && fetchMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasMore ? <ActivityIndicator size="small" color="#155DFC" /> : null}
      />
    </View>
  );
}
