import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { checkIsSaved } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useIsSaved(productId: string) {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.isSaved(productId),
    queryFn: () => checkIsSaved(token!, productId),
    enabled: !!token && isAuthenticated,
    staleTime: 60_000,
  });
}
