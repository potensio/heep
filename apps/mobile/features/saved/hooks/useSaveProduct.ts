import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { saveProduct, unsaveProduct } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useSaveProduct(productId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => saveProduct(token!, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedProducts() });
      queryClient.setQueryData(queryKeys.isSaved(productId), true);
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => unsaveProduct(token!, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedProducts() });
      queryClient.setQueryData(queryKeys.isSaved(productId), false);
    },
  });

  return {
    save: saveMutation.mutateAsync,
    unsave: unsaveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isUnsaving: unsaveMutation.isPending,
  };
}
