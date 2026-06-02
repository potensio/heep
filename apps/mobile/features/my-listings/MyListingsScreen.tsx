import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
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
