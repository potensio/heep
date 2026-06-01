import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFeed } from '@/lib/api';
import { normalizeProduct } from '@/lib/normalize';
import { queryKeys } from '@/lib/queryKeys';

export function useProductFeed() {
  const q = useInfiniteQuery({
    queryKey: queryKeys.feed(),
    queryFn: ({ pageParam }) => fetchFeed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.nextCursor ?? undefined,
  });

  const fetchMore = useCallback(() => { q.fetchNextPage(); }, [q.fetchNextPage]);
  const refetch = useCallback(() => { q.refetch(); }, [q.refetch]);

  return {
    data: q.data?.pages.flatMap(p => p.items.map(normalizeProduct)) ?? [],
    isLoading: q.isLoading,
    error: q.error,
    fetchMore,
    hasMore: q.hasNextPage,
    refetch,
  };
}
