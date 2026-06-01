import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchSavedProducts, type SavedProductItem } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Product } from '@/lib/types';

function normalize(item: SavedProductItem): Product {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.photos[0]?.url ?? '',
    seller: item.seller.name ?? '',
    sellerId: item.seller.id,
    category: item.category,
    location: item.location ?? undefined,
  };
}

export function useSavedProducts() {
  const { token } = useAuth();

  const query = useInfiniteQuery({
    queryKey: queryKeys.savedProducts(),
    queryFn: ({ pageParam }) => fetchSavedProducts(token!, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token,
    initialPageParam: undefined as string | undefined,
  });

  const data = query.data?.pages.flatMap(page => page.items.map(normalize)) ?? [];

  return {
    data,
    isLoading: query.isLoading,
    error: query.error,
    fetchMore: query.fetchNextPage,
    hasMore: query.hasNextPage,
    refetch: query.refetch,
  };
}
