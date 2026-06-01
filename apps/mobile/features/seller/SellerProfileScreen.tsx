import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { ProductCard } from '@/features/search/components/ProductCard';
import { useSeller } from './hooks/useSeller';
import { useSellerProducts } from './hooks/useSellerProducts';

interface SellerProfileScreenProps {
  id: string;
}

export function SellerProfileScreen({ id }: SellerProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { data: seller, isLoading: sellerLoading } = useSeller(id);
  const { data: products, fetchMore, hasMore } = useSellerProducts(id);

  const joinedYear = seller?.createdAt
    ? new Date(seller.createdAt).getFullYear().toString()
    : '—';

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
        <Text className="text-lg font-semibold text-gray-900 ml-3">Profil Penjual</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 300 && hasMore) {
            fetchMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <View className="items-center py-6 px-5">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-2xl font-bold text-white">
              {sellerLoading ? '?' : (seller?.name?.charAt(0).toUpperCase() ?? '?')}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-1">
            {sellerLoading ? '...' : (seller?.name ?? 'Penjual')}
          </Text>
          <Text className="text-sm text-gray-500">Bergabung {joinedYear}</Text>
        </View>

        <View className="flex-row justify-around py-4 mx-5 bg-white rounded-2xl mb-4">
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">
              {seller?.activeListingCount ?? '—'}
            </Text>
            <Text className="text-xs text-gray-500">Produk</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">—</Text>
            <Text className="text-xs text-gray-500">Rating</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">—</Text>
            <Text className="text-xs text-gray-500">Respon</Text>
          </View>
        </View>

        <View className="px-5 py-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Produk</Text>
          <View className="flex-row flex-wrap">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
                onSellerPress={() => router.push(`/user/${product.sellerId}`)}
                width="48%"
                marginRight={index % 2 === 0 ? "4%" : 0}
              />
            ))}
          </View>
          {products.length === 0 && !sellerLoading && (
            <Text className="text-sm text-gray-400 text-center py-4">
              Belum ada produk aktif.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
