import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchSellerProducts } from '@/lib/api';
import { normalizeProduct } from '@/lib/normalize';
import { queryKeys } from '@/lib/queryKeys';

export function useSellerProducts(sellerId: string) {
  const q = useInfiniteQuery({
    queryKey: queryKeys.sellerProducts(sellerId),
    queryFn: ({ pageParam }) => fetchSellerProducts(sellerId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.nextCursor ?? undefined,
  });

  const fetchMore = useCallback(() => { q.fetchNextPage(); }, [q.fetchNextPage]);

  return {
    data: q.data?.pages.flatMap(p => p.items.map(normalizeProduct)) ?? [],
    isLoading: q.isLoading,
    error: q.error,
    fetchMore,
    hasMore: q.hasNextPage,
  };
}
