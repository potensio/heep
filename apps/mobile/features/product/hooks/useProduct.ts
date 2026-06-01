import { useQuery } from '@tanstack/react-query';
import { fetchProduct, type ProductDetailItem } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useProduct(id: string) {
  const { data, isLoading, error } = useQuery<ProductDetailItem, Error>({
    queryKey: queryKeys.product(id),
    queryFn: () => fetchProduct(id),
  });

  return { data: data ?? null, isLoading, error };
}
