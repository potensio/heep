import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTicket } from '../api/support.api';

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, body }: { restaurantId: string; body: string }) =>
      createTicket(restaurantId, body),
    onSuccess: () => {
      // Pull the freshly-created ticket into the list.
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}
