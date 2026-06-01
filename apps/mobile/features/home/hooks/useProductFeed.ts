import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFeed } from '@/lib/api';
import type { Product } from '@/lib/types';

type FeedItem = Awaited<ReturnType<typeof fetchFeed>>['items'][number];

function normalize(item: FeedItem): Product {
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

export function useProductFeed() {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);
  const isFetchingRef = useRef(false);

  const load = useCallback(async (reset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (reset) setIsLoading(true);
    try {
      const result = await fetchFeed(reset ? undefined : cursorRef.current);
      const items = result.items.map(normalize);
      setData(prev => (reset ? items : [...prev, ...items]));
      cursorRef.current = result.nextCursor ?? undefined;
      setHasMore(result.nextCursor !== null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load products'));
    } finally {
      isFetchingRef.current = false;
      if (reset) setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  const fetchMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) load(false);
  }, [hasMore, load]);

  const refetch = useCallback(() => {
    cursorRef.current = undefined;
    setHasMore(true);
    load(true);
  }, [load]);

  return { data, isLoading, error, fetchMore, hasMore, refetch };
}
