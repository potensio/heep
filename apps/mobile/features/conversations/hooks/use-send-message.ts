import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { sendMessage } from '../api/conversations.api';
import type { ConversationListResponse, Message } from '../types';

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),

    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const snapshot = queryClient.getQueryData<InfiniteData<ConversationListResponse>>(['conversations']);

      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        text: body,
        is_from_agent: false,
        sent_at: new Date().toISOString(),
      };

      queryClient.setQueryData<InfiniteData<ConversationListResponse>>(
        ['conversations'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((conv) =>
                conv.id === conversationId
                  ? { ...conv, messages: [...conv.messages, tempMessage] }
                  : conv,
              ),
            })),
          };
        },
      );

      return { snapshot };
    },

    onError: (_err, _body, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['conversations'], context.snapshot);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
