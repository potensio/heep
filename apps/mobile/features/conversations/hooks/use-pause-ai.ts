import { useCallback } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { pauseAI } from '../api/conversations.api';
import type { Conversation, ConversationListResponse } from '../types';

export function usePauseAI(conversation: Conversation | undefined) {
  const queryClient = useQueryClient();

  const toggle = useCallback(async () => {
    if (!conversation) return;
    const next = !conversation.is_ai_paused;

    // The list cache is keyed with the active filters, so update every
    // `['conversations', ...]` variant, not one fixed key.
    const setPaused = (value: boolean) =>
      queryClient.setQueriesData<InfiniteData<ConversationListResponse>>(
        { queryKey: ['conversations'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((c) =>
                c.id === conversation.id ? { ...c, is_ai_paused: value } : c,
              ),
            })),
          };
        },
      );

    setPaused(next);
    try {
      await pauseAI(conversation.id, next);
    } catch {
      setPaused(conversation.is_ai_paused);
    }
  }, [conversation, queryClient]);

  return { toggle };
}
