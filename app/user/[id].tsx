import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChatRound } from '@solar-icons/react-native/Linear';
import { Avatar } from '@/components/ui/Avatar';

// Mock user data - in real app, fetch from API
const mockUsers: Record<string, {
  name: string;
  bio: string;
  joinedDate: string;
  productCount: number;
}> = {
  'seller-1': {
    name: 'Andi',
    bio: 'Menjual sepatu berkualitas dengan harga terjangkau',
    joinedDate: 'Januari 2024',
    productCount: 12,
  },
  'seller-2': {
    name: 'Budi',
    bio: 'Tas dan aksesoris original',
    joinedDate: 'Februari 2024',
    productCount: 8,
  },
  'seller-3': {
    name: 'Citra',
    bio: 'Fashion enthusiast, kemeja dan pakaian casual',
    joinedDate: 'Maret 2024',
    productCount: 15,
  },
  'seller-4': {
    name: 'Dian',
    bio: 'Kolektor jam tangan vintage dan modern',
    joinedDate: 'April 2024',
    productCount: 5,
  },
  'seller-5': {
    name: 'Eka',
    bio: 'Streetwear dan hoodie limited edition',
    joinedDate: 'Mei 2024',
    productCount: 20,
  },
  'seller-6': {
    name: 'Fani',
    bio: 'Aksesoris dan topi impianmu',
    joinedDate: 'Juni 2024',
    productCount: 10,
  },
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Get user data (mock for now)
  const user = mockUsers[id as string] || {
    name: 'Pengguna',
    bio: 'Belum ada bio',
    joinedDate: '-',
    productCount: 0,
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3 bg-background"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-cream items-center justify-center shadow-sm"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-3">Profil Penjual</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View className="px-5 py-6 items-center border-b border-gray-200">
          <Avatar name={user.name} size="xl" />
          <Text className="text-xl font-semibold mt-4">{user.name}</Text>
          <Text className="text-gray-500 text-center mt-2">{user.bio}</Text>

          {/* Stats */}
          <View className="flex-row gap-8 mt-6">
            <View className="items-center">
              <Text className="text-2xl font-bold">{user.productCount}</Text>
              <Text className="text-sm text-gray-500">Produk</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold">4.8</Text>
              <Text className="text-sm text-gray-500">Rating</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold">95%</Text>
              <Text className="text-sm text-gray-500">Respon</Text>
            </View>
          </View>

          <Text className="text-xs text-gray-400 mt-4">Bergabung {user.joinedDate}</Text>
        </View>

        {/* Products Section */}
        <View className="px-5 py-4">
          <Text className="font-semibold text-gray-900 mb-4">Produk ({user.productCount})</Text>

          {/* Empty state for products */}
          <View className="items-center py-8">
            <Text className="text-gray-500">Produk akan muncul di sini</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        className="flex-row gap-3 px-5 py-4 bg-cream border-t border-gray-200"
        style={{ paddingBottom: Math.max(insets.bottom + 12, 20) }}
      >
        <TouchableOpacity
          onPress={() => {
            // Navigate to chat with this user
            router.push(`/chat/new?sellerId=${id}&sellerName=${user.name}`);
          }}
          className="flex-1 bg-black rounded-xl flex-row items-center justify-center py-3 gap-2"
        >
          <ChatRound size={20} color="white" />
          <Text className="font-semibold text-white text-base">
            Mulai chat
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
