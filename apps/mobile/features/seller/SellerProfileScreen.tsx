import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from '@solar-icons/react-native/Linear';
import { ProductCard } from '@/features/search/components/ProductCard';

// Mock seller data - in real app, fetch from API
const mockSellers: Record<string, {
  name: string;
  avatar?: string;
  joinedDate: string;
  productCount: number;
  rating: number;
  responseTime: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    seller: string;
    sellerId: string;
    category: string;
  }>;
}> = {
  'seller-1': {
    name: 'Toko Elektronik',
    joinedDate: 'Januari 2024',
    productCount: 24,
    rating: 4.8,
    responseTime: '± 1 jam',
    products: [
      { id: '1', name: 'Sepatu Sneakers Pria', price: 250000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', seller: 'Toko Elektronik', sellerId: 'seller-1', category: 'Fashion' },
      { id: '2', name: 'Tas Ransel Laptop', price: 180000, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', seller: 'Toko Elektronik', sellerId: 'seller-1', category: 'Aksesoris' },
      { id: '3', name: 'Kemeja Flannel', price: 150000, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop', seller: 'Toko Elektronik', sellerId: 'seller-1', category: 'Fashion' },
      { id: '4', name: 'Jam Tangan Analog', price: 350000, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop', seller: 'Toko Elektronik', sellerId: 'seller-1', category: 'Aksesoris' },
    ],
  },
  'seller-2': {
    name: 'Fashion Store',
    joinedDate: 'Maret 2024',
    productCount: 56,
    rating: 4.9,
    responseTime: '± 30 menit',
    products: [
      { id: '5', name: 'Hoodie Oversized', price: 200000, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', seller: 'Fashion Store', sellerId: 'seller-2', category: 'Fashion' },
      { id: '6', name: 'Topi Baseball', price: 75000, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop', seller: 'Fashion Store', sellerId: 'seller-2', category: 'Aksesoris' },
    ],
  },
};

const defaultSeller = {
  name: 'Penjual',
  joinedDate: '2024',
  productCount: 0,
  rating: 0,
  responseTime: '-',
  products: [],
};

interface SellerProfileScreenProps {
  id: string;
}

export function SellerProfileScreen({ id }: SellerProfileScreenProps) {
  const insets = useSafeAreaInsets();

  const seller = mockSellers[id] || defaultSeller;

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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center py-6 px-5">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-2xl font-bold text-white">
              {seller.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-1">{seller.name}</Text>
          <Text className="text-sm text-gray-500">Bergabung {seller.joinedDate}</Text>
        </View>

        <View className="flex-row justify-around py-4 mx-5 bg-white rounded-2xl mb-4">
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">{seller.productCount}</Text>
            <Text className="text-xs text-gray-500">Produk</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">{seller.rating}</Text>
            <Text className="text-xs text-gray-500">Rating</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-xl font-bold text-gray-900">{seller.responseTime}</Text>
            <Text className="text-xs text-gray-500">Respon</Text>
          </View>
        </View>

        <View className="px-5 py-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Produk</Text>
          <View className="flex-row flex-wrap">
            {seller.products.map((product, index) => (
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
        </View>
      </ScrollView>
    </View>
  );
}
