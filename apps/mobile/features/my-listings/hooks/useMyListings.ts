import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchSellerProducts } from '@/lib/api';
import { normalizeProduct } from '@/lib/normalize';
import { queryKeys } from '@/lib/queryKeys';

export function useMyListings() {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: queryKeys.myListings(),
    queryFn: ({ pageParam }) => fetchSellerProducts(user!.id, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!user,
    initialPageParam: undefined as string | undefined,
  });

  const data = query.data?.pages.flatMap(p => p.items.map(normalizeProduct)) ?? [];

  return {
    data,
    isLoading: query.isLoading,
    error: query.error,
    fetchMore: query.fetchNextPage,
    hasMore: query.hasNextPage,
    refetch: query.refetch,
  };
}
