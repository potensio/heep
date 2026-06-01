import { useCallback, useRef, useState } from 'react';
import { fetchSearch, type SearchParams } from '@/lib/api';
import type { Product } from '@/lib/types';

type SearchItem = Awaited<ReturnType<typeof fetchSearch>>['items'][number];

function normalize(item: SearchItem): Product {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.photos[0]?.url ?? '',
    seller: item.seller.name ?? '',
    sellerId: item.seller.id,
    category: item.category,
  };
}

export function useProductSearch() {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const paramsRef = useRef<SearchParams>({});
  const isFetchingRef = useRef(false);

  const load = useCallback(async (params: SearchParams, reset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (reset) {
      setIsLoading(true);
      paramsRef.current = params;
    }
    try {
      const result = await fetchSearch(params, reset ? undefined : cursorRef.current);
      const items = result.items.map(normalize);
      setData(prev => (reset ? items : [...prev, ...items]));
      cursorRef.current = result.nextCursor ?? undefined;
      setHasMore(result.nextCursor !== null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Search failed'));
    } finally {
      isFetchingRef.current = false;
      if (reset) setIsLoading(false);
    }
  }, []);

  const search = useCallback(
    (params: SearchParams) => {
      cursorRef.current = undefined;
      setHasMore(false);
      load(params, true);
    },
    [load],
  );

  const fetchMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) load(paramsRef.current, false);
  }, [hasMore, load]);

  return { data, isLoading, error, hasMore, search, fetchMore };
}
