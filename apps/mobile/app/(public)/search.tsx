import { useLocalSearchParams, useRouter } from "expo-router";
import { SearchProductsScreen } from "@/features/search/SearchProductsScreen";

export default function SearchRoute() {
  const { search } = useLocalSearchParams<{ search?: string }>();
  const router = useRouter();

  return (
    <SearchProductsScreen
      initialQuery={search ?? ""}
      onBack={() => router.back()}
      onProductPress={(id) => router.push(`/product/${id}`)}
      onSellerPress={(id) => router.push(`/user/${id}`)}
    />
  );
}
