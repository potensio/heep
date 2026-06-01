import { useQuery } from '@tanstack/react-query';
import { fetchSeller, type PublicSellerProfile } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useSeller(id: string) {
  const { data, isLoading, error } = useQuery<PublicSellerProfile, Error>({
    queryKey: queryKeys.seller(id),
    queryFn: () => fetchSeller(id),
  });

  return { data: data ?? null, isLoading, error };
}
