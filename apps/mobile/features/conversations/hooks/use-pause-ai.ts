import { useCallback } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { pauseAI } from '../api/conversations.api';
import type { Conversation, ConversationListResponse } from '../types';

export function usePauseAI(conversation: Conversation | undefined) {
  const queryClient = useQueryClient();

  const toggle = useCallback(async () => {
    if (!conversation) return;
    const next = !conversation.is_ai_paused;

    queryClient.setQueryData<InfiniteData<ConversationListResponse>>(['conversations'], (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map((c) =>
            c.id === conversation.id ? { ...c, is_ai_paused: next } : c,
          ),
        })),
      };
    });

    try {
      await pauseAI(conversation.id, next);
    } catch {
      queryClient.setQueryData<InfiniteData<ConversationListResponse>>(['conversations'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((c) =>
              c.id === conversation.id ? { ...c, is_ai_paused: conversation.is_ai_paused } : c,
            ),
          })),
        };
      });
    }
  }, [conversation, queryClient]);

  return { toggle };
}
