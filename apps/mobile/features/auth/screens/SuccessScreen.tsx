import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle } from '@solar-icons/react-native/Linear';

export function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();

  const handleStart = () => {
    // Navigate to returnTo if it exists, otherwise go to beranda
    if (params.returnTo) {
      router.replace(params.returnTo as any);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View 
      className="flex-1 bg-background items-center justify-center"
      style={{ paddingHorizontal: 20, paddingTop: insets.top, paddingBottom: insets.bottom + 40 }}
    >
      {/* Success Icon */}
      <View className="mb-6">
        <CheckCircle size={80} className="text-green-500" />
      </View>

      {/* Title */}
      <Text className="text-2xl font-heading font-medium text-gray-900 mb-3 text-center">
        Selamat Datang!
      </Text>

      {/* Subtitle */}
      <Text className="text-base text-gray-600 text-center mb-10">
        Akun Anda berhasil dibuat. Mulai jelajahi produk menarik atau jual barang Anda sekarang.
      </Text>

      {/* Start Button */}
      <TouchableOpacity
        onPress={handleStart}
        className="bg-black rounded-xl py-4 items-center w-full"
        activeOpacity={0.8}
      >
        <Text className="text-base font-semibold text-white">
          Mulai Jelajahi
        </Text>
      </TouchableOpacity>
    </View>
  );
}
