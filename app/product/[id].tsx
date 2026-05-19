// app/product/[id].tsx
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Share, ChatRound } from '@solar-icons/react-native/Linear';

function formatRupiah(value: number): string {
  if (!value || value === 0) return 'Rp 0';
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Mock product data - in real app, fetch from API
const mockProducts: Record<string, {
  name: string;
  price: number;
  description: string;
  photos: string[];
  seller: string;
}> = {
  'default': {
    name: 'Produk Baru',
    price: 0,
    description: 'Deskripsi produk akan muncul di sini',
    photos: ['https://via.placeholder.com/400'],
    seller: 'Penjual',
  }
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // For now, show a simple product detail UI
  // In real app, fetch product data using the id
  
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm absolute top-0 left-0 right-0 z-10"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </TouchableOpacity>
        
        <View className="flex-row gap-2">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm">
            <Share size={20} className="text-gray-800" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm">
            <Heart size={20} className="text-gray-800" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View className="w-full aspect-square bg-gray-200">
          <Image 
            source={{ uri: 'https://via.placeholder.com/400x400/9AE600/ffffff?text=Produk' }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Product Info */}
        <View className="px-5 pt-5 pb-8">
          {/* Price */}
          <Text className="text-2xl font-bold text-primary mb-2">
            {formatRupiah(150000)}
          </Text>

          {/* Product Name */}
          <Text className="text-xl font-semibold text-gray-900 mb-4">
            Nama Produk
          </Text>

          {/* Seller Info */}
          <View className="flex-row items-center py-4 border-t border-b border-gray-200 mb-4">
            <View className="w-12 h-12 rounded-full bg-accent items-center justify-center">
              <Text className="text-lg font-semibold text-gray-900">
                S
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-gray-900">Nama Penjual</Text>
              <Text className="text-sm text-gray-500">Aktif 2 jam lalu</Text>
            </View>
            <TouchableOpacity className="px-4 py-2 rounded-full border border-accent">
              <Text className="text-sm font-medium text-primary">Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">Deskripsi Produk</Text>
            <Text className="text-gray-600 leading-6">
              Deskripsi lengkap tentang produk ini akan ditampilkan di sini. 
              Produk ini baru saja dipublish dan tersedia untuk dibeli.
            </Text>
          </View>

          {/* Product ID */}
          <Text className="text-xs text-gray-400">
            ID: {id}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View 
        className="flex-row gap-3 px-5 py-4 bg-white border-t border-gray-200"
        style={{ paddingBottom: Math.max(insets.bottom + 12, 20) }}
      >
        <TouchableOpacity className="flex-row items-center justify-center px-5 py-3 rounded-xl border border-gray-300">
          <ChatRound size={20} color="#374151" />
        </TouchableOpacity>
        
        <TouchableOpacity className="flex-1 bg-accent rounded-xl items-center justify-center py-3">
          <Text className="font-semibold text-gray-900 text-base">
            Beli Sekarang
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
