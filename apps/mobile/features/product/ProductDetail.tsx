import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart, Share } from "@solar-icons/react-native/Linear";
import { Avatar } from "@/components/ui/Avatar";

export interface ProductDetailData {
  name: string;
  price: number;
  description: string;
  photos: string[];
  category?: string;
  condition?: string;
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
}

interface ProductDetailProps {
  product: ProductDetailData;
  showActions?: boolean;
  showSeller?: boolean;
  onShare?: () => void;
  onLike?: () => void;
  onSellerPress?: () => void;
  footerContent?: React.ReactNode;
}

function formatRupiah(value: number): string {
  if (!value || value === 0) return "Rp 0";
  return "Rp " + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function ProductDetail({
  product,
  showActions = true,
  showSeller = true,
  onShare,
  onLike,
  onSellerPress,
  footerContent,
}: ProductDetailProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      {showActions && (
        <View
          className="flex-row items-center justify-between px-4 py-3 absolute top-0 left-0 right-0 z-10"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="w-10 h-10" />

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onShare}
              className="w-10 h-10 rounded-full bg-cream items-center justify-center shadow-sm"
            >
              <Share size={20} className="text-gray-800" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onLike}
              className="w-10 h-10 rounded-full bg-cream items-center justify-center shadow-sm"
            >
              <Heart size={20} className="text-gray-800" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="w-full aspect-square bg-gray-200">
          {product.photos[0] ? (
            <Image
              source={{ uri: product.photos[0] }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-gray-100">
              <Text className="text-gray-400">Tidak ada foto</Text>
            </View>
          )}
        </View>

        {product.photos.length > 1 && (
          <View className="flex-row gap-2 px-4 py-3">
            {product.photos.slice(0, 5).map((photo, index) => (
              <View
                key={index}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  index === 0 ? "border-primary" : "border-transparent"
                }`}
              >
                <Image
                  source={{ uri: photo }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            ))}
          </View>
        )}

        <View className="px-5 pt-5 pb-8">
          {(product.category || product.condition) && (
            <View className="flex-row gap-2 mb-3">
              {product.category && (
                <View className="bg-primary/20 px-3 py-1 rounded-full">
                  <Text className="text-xs font-medium text-gray-800">
                    {product.category}
                  </Text>
                </View>
              )}
              {product.condition && (
                <View className="bg-gray-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-medium text-gray-600">
                    {product.condition}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text className="text-2xl font-bold text-black mb-2">
            {formatRupiah(product.price)}
          </Text>

          <Text className="text-xl font-semibold text-gray-900 mb-4">
            {product.name || "Nama produk belum diisi"}
          </Text>

          {showSeller && product.sellerName && (
            <TouchableOpacity
              className="flex-row items-center py-4 border-t border-b border-gray-200 mb-4"
              onPress={onSellerPress}
            >
              <Avatar name={product.sellerName} size="md" />
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-gray-900">
                  {product.sellerName}
                </Text>
                <Text className="text-sm text-gray-500">Penjual</Text>
              </View>
              {onSellerPress && (
                <View className="px-4 py-2 rounded-full bg-black">
                  <Text className="text-sm font-medium text-white">
                    Lihat Profil
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">
              Deskripsi Produk
            </Text>
            {product.description ? (
              <Text className="text-gray-600 leading-6">
                {product.description}
              </Text>
            ) : (
              <Text className="text-gray-400 italic">
                Tidak ada deskripsi
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {footerContent && (
        <View
          className="px-5 py-4 bg-cream border-t border-gray-200"
          style={{ paddingBottom: Math.max(insets.bottom + 12, 20) }}
        >
          {footerContent}
        </View>
      )}
    </View>
  );
}
