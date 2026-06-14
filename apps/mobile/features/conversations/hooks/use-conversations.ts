import { useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchConversations, type ConversationQuery } from '../api/conversations.api';

export function useConversations(query: ConversationQuery = {}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  return useInfiniteQuery({
    // query is part of the key so changing filters/search/location refetches.
    queryKey: ['conversations', query],
    queryFn: ({ pageParam }) => fetchConversations(pageParam as number | undefined, query),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.pagination.cursor ?? undefined,
    enabled: ready,
    retry: (failureCount, error) => {
      if ((error as Error)?.message === 'UNAUTHORIZED') return false;
      return failureCount < 2;
    },
  });
}
