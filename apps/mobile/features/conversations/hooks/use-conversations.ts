import { useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchConversations } from '../api/conversations.api';

export function useConversations() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam }) => fetchConversations(pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.pagination.cursor ?? undefined,
    enabled: ready,
  });
}
