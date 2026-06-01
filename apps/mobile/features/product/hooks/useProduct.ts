import { useEffect, useState } from 'react';
import { fetchProduct, type ProductDetailItem } from '@/lib/api';

export function useProduct(id: string) {
  const [data, setData] = useState<ProductDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchProduct(id)
      .then(product => {
        if (!cancelled) { setData(product); setError(null); }
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e : new Error('Failed to load'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  return { data, isLoading, error };
}
