import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { ProductDetail } from "./ProductDetail";
import { mockProducts } from "@/lib/mockData";

interface ProductDetailScreenProps {
  id: string;
}

export function ProductDetailScreen({ id }: ProductDetailScreenProps) {
  const router = useRouter();

  const product = mockProducts.find((p) => p.id === (id as string));

  const productData = {
    name: product?.name ?? "Produk",
    price: product?.price ?? 0,
    description: "Deskripsi lengkap tentang produk ini akan ditampilkan di sini.",
    photos: [product?.image ?? "https://via.placeholder.com/400"],
    category: product?.category,
    sellerId: product?.sellerId ?? "seller-1",
    sellerName: product?.seller ?? "Penjual",
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
      style={{ flex: 1 }}
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
