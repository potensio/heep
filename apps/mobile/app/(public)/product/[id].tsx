import { useLocalSearchParams } from "expo-router";
import { ProductDetailScreen } from "@/features/product/ProductDetailScreen";

export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductDetailScreen id={id} />;
}
