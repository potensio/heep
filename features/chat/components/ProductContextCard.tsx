import { View, Text, Image, TouchableOpacity } from 'react-native';
import type { Product } from '../types';

interface ProductContextCardProps {
  product: Product;
  onPress?: () => void;
}

export function ProductContextCard({ product, onPress }: ProductContextCardProps) {
  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="bg-white mx-4 mb-3 rounded-xl p-3 flex-row items-center border border-neutral-200"
    >
      <Image
        source={{ uri: product.image }}
        className="w-14 h-14 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3">
        <Text className="text-xs text-neutral-500 mb-0.5">
          Sedang membahas produk ini
        </Text>
        <Text className="text-sm font-medium text-neutral-900" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-sm font-semibold text-primary-500 mt-0.5">
          {formatPrice(product.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
