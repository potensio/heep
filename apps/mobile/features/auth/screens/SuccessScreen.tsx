import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle } from '@solar-icons/react-native/Linear';

interface SuccessScreenProps {
  onStart: () => void;
}

export function SuccessScreen({ onStart }: SuccessScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background items-center justify-center"
      style={{ paddingHorizontal: 20, paddingTop: insets.top, paddingBottom: insets.bottom + 40 }}
    >
      <View className="mb-6">
        <CheckCircle size={80} className="text-green-500" />
      </View>

      <Text className="text-2xl font-heading font-medium text-gray-900 mb-3 text-center">
        Selamat Datang!
      </Text>

      <Text className="text-base text-gray-600 text-center mb-10">
        Akun Anda berhasil dibuat. Mulai jelajahi produk menarik atau jual barang Anda sekarang.
      </Text>

      <TouchableOpacity
        onPress={onStart}
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
