import { useCallback, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchSearch, type SearchParams } from '@/lib/api';
import { normalizeProduct } from '@/lib/normalize';
import { queryKeys } from '@/lib/queryKeys';

export function useProductSearch() {
  const [params, setParams] = useState<SearchParams | null>(null);

  const q = useInfiniteQuery({
    queryKey: queryKeys.search(params ?? {}),
    queryFn: ({ pageParam }) => fetchSearch(params!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.nextCursor ?? undefined,
    enabled: params !== null,
  });

  const search = useCallback((p: SearchParams) => setParams(p), []);
  const fetchMore = useCallback(() => { q.fetchNextPage(); }, [q.fetchNextPage]);

  return {
    data: q.data?.pages.flatMap(p => p.items.map(normalizeProduct)) ?? [],
    isLoading: q.isLoading,
    error: q.error,
    hasMore: q.hasNextPage,
    search,
    fetchMore,
  };
}
