import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTickets } from '../api/support.api';

export function useTickets() {
  return useInfiniteQuery({
    queryKey: ['support-tickets'],
    queryFn: ({ pageParam }) => fetchTickets(pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.pagination.cursor ?? undefined,
  });
}
