import { useEffect, useState } from 'react';
import { fetchSeller, type PublicSellerProfile } from '@/lib/api';

export function useSeller(id: string) {
  const [data, setData] = useState<PublicSellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchSeller(id)
      .then(seller => {
        if (!cancelled) { setData(seller); setError(null); }
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
