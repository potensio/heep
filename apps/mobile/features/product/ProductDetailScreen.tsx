import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { ProductDetail } from "./ProductDetail";
import { useProduct } from "./hooks/useProduct";
import { ApiError } from "@/lib/api";

interface ProductDetailScreenProps {
  id: string;
}

export function ProductDetailScreen({ id }: ProductDetailScreenProps) {
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-400">Memuat produk...</Text>
      </View>
    );
  }

  if (error || !product) {
    const is404 = error instanceof ApiError && error.status === 404;
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-gray-500 text-center">
          {is404 ? 'Produk tidak ditemukan.' : 'Gagal memuat produk. Coba lagi.'}
        </Text>
      </View>
    );
  }

  const productData = {
    name: product.name,
    price: product.price,
    description: product.description,
    photos: product.photos.map(p => p.url),
    category: product.category,
    sellerId: product.seller.id,
    sellerName: product.seller.name ?? 'Penjual',
  };

  const footerContent = (
    <Button
      onPress={() => {
        const conversationId = `product-${id}-seller-${productData.sellerId}`;
        router.push({
          pathname: `/chat/${conversationId}` as any,
          params: {
            productId: id,
            productName: productData.name,
            productPrice: productData.price,
            productImage: productData.photos[0],
            sellerId: productData.sellerId,
            sellerName: productData.sellerName,
          },
        });
      }}
      style={{ width: '100%' }}
    >
      Mulai chat
    </Button>
  );

  return (
    <ProductDetail
      product={productData}
      onSellerPress={() => router.push(`/user/${productData.sellerId}`)}
      footerContent={footerContent}
    />
  );
}
