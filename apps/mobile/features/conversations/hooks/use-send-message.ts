import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { sendMessage } from '../api/conversations.api';
import type { Message } from '../types';

type MessagePage = { data: Message[]; pagination: { cursor: number | null; has_more: boolean } };

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const messagesKey = ['conversation-messages', conversationId];

  return useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),

    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: messagesKey });
      const snapshot = queryClient.getQueryData<InfiniteData<MessagePage>>(messagesKey);

      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        text: body,
        sent_by: 'bot',
        is_manual_response: true,
        sent_at: new Date().toISOString(),
      };

      // Prepend to the newest page (messages are sorted newest-first).
      queryClient.setQueryData<InfiniteData<MessagePage>>(messagesKey, (old) => {
        if (!old || old.pages.length === 0) return old;
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0 ? { ...page, data: [tempMessage, ...page.data] } : page,
          ),
        };
      });

      return { snapshot };
    },

    onSuccess: (_data, body) => {
      queryClient.setQueryData<InfiniteData<MessagePage>>(messagesKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((m) =>
              m.id.startsWith('temp-') && m.text === body
                ? { ...m, id: `local-${m.id.slice(5)}` }
                : m,
            ),
          })),
        };
      });
    },

    onError: (_err, _body, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(messagesKey, context.snapshot);
      }
    },
  });
}
