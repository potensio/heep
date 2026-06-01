import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSellerProducts } from '@/lib/api';
import type { Product } from '@/lib/types';

type SellerProductItem = Awaited<ReturnType<typeof fetchSellerProducts>>['items'][number];

function normalize(item: SellerProductItem): Product {
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

export function useSellerProducts(sellerId: string) {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | undefined>(undefined);
  const isFetchingRef = useRef(false);
  const generationRef = useRef(0);

  const load = useCallback(async (reset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const generation = generationRef.current;   // capture current generation
    if (reset) setIsLoading(true);
    try {
      const result = await fetchSellerProducts(sellerId, reset ? undefined : cursorRef.current);
      if (generation !== generationRef.current) return;  // stale, discard
      const items = result.items.map(normalize);
      setData(prev => (reset ? items : [...prev, ...items]));
      cursorRef.current = result.nextCursor ?? undefined;
      setHasMore(result.nextCursor !== null);
      setError(null);
    } catch (e) {
      if (generation !== generationRef.current) return;
      setError(e instanceof Error ? e : new Error('Failed to load'));
    } finally {
      isFetchingRef.current = false;
      if (reset) setIsLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    generationRef.current += 1;   // invalidate in-flight fetches from previous sellerId
    cursorRef.current = undefined;
    setHasMore(true);
    load(true);
  }, [sellerId, load]);

  const fetchMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) load(false);
  }, [hasMore, load]);

  return { data, isLoading, error, fetchMore, hasMore };
}
