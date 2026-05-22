import {
  View,
  Text,
  TouchableOpacity,
  Image,
  DimensionValue,
} from "react-native";
import { ArrowRight, User } from "@solar-icons/react-native/Linear";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  seller: string;
  sellerId: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onSellerPress: () => void;
  width?: DimensionValue;
  marginRight?: DimensionValue;
}

export function ProductCard({
  product,
  onPress,
  onSellerPress,
  width = "48%",
  marginRight = 0,
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-4"
      style={{ width, marginRight }}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: product.image }}
        className="w-full h-32 bg-gray-100 rounded-xl"
        resizeMode="cover"
      />
      <View className="mt-2">
        <Text className="font-medium mb-1" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-sm mb-2">{formatPrice(product.price)}</Text>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={onSellerPress}
            hitSlop={{ top: 10, bottom: 10, left: 0, right: 0 }}
          >
            <User size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
              {product.seller}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
