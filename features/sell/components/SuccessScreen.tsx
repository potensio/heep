import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, ArrowRight, Refresh, Home } from '@solar-icons/react-native/Linear';
import type { SuccessScreenProps } from '../types';

interface ExtendedSuccessScreenProps extends SuccessScreenProps {
  onBackToHome?: () => void;
}

export function SuccessScreen({ productId, onViewProduct, onSellAgain, onBackToHome }: ExtendedSuccessScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="flex-1 bg-[#F9F2E6] items-center justify-center px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Success Icon */}
      <View className="w-24 h-24 rounded-full bg-[#9AE600] items-center justify-center mb-6">
        <CheckCircle size={48} color="white" />
      </View>

      {/* Title */}
      <Text className="text-2xl font-heading font-semibold text-gray-900 text-center mb-2">
        Produk Berhasil Dijual!
      </Text>
      <Text className="text-4xl mb-4">🎉</Text>

      {/* Subtext */}
      <Text className="text-gray-500 text-center mb-10 px-4">
        Produk kamu sekarang aktif dan bisa dilihat pembeli
      </Text>

      {/* Action Buttons */}
      <View className="w-full gap-3">
        <TouchableOpacity
          onPress={onViewProduct}
          className="flex-row items-center justify-center py-4 rounded-xl bg-[#9AE600]"
        >
          <Text className="font-semibold text-base mr-2 text-gray-900">
            Lihat Produk
          </Text>
          <ArrowRight size={20} className="text-gray-900" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSellAgain}
          className="flex-row items-center justify-center py-4 rounded-xl border border-gray-300 bg-white"
        >
          <Refresh size={18} className="text-gray-700 mr-2" />
          <Text className="font-semibold text-base text-gray-700">
            Jual Lagi
          </Text>
        </TouchableOpacity>

        {onBackToHome && (
          <TouchableOpacity
            onPress={onBackToHome}
            className="flex-row items-center justify-center py-4 rounded-xl border border-gray-300 bg-white"
          >
            <Home size={18} className="text-gray-700 mr-2" />
            <Text className="font-semibold text-base text-gray-700">
              Kembali ke Beranda
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Product ID hint */}
      <Text className="text-xs text-gray-400 mt-8">
        ID Produk: {productId.slice(0, 8)}...
      </Text>
    </View>
  );
}
