import { View, Text, TouchableOpacity, Image, DimensionValue } from "react-native";
import { ArrowRight, Shop } from "@solar-icons/react-native/Linear";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  store: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  width?: DimensionValue;
  marginRight?: DimensionValue;
}

export function ProductCard({
  product,
  onPress,
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
      className="bg-white rounded-xl overflow-hidden border border-gray-100 mb-4"
      style={{
        width,
        marginRight,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: product.image }}
        className="w-full h-32 bg-gray-100"
        resizeMode="cover"
      />
      <View className="p-3">
        <Text
          className="text-sm font-medium text-gray-800 mb-1"
          numberOfLines={2}
        >
          {product.name}
        </Text>
        <Text className="text-sm font-semibold text-primary mb-2">
          {formatPrice(product.price)}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Shop size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
              {product.store}
            </Text>
          </View>
          <TouchableOpacity className="w-6 h-6 bg-gray-100 rounded-full items-center justify-center">
            <ArrowRight size={12} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
