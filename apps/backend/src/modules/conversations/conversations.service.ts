import type { BubbleDataClient, PaginatedResult, BubbleConversation } from '../../core/bubble/data-client';
import type { BubbleClient } from '../../core/bubble/client';
import type { UsersService } from '../users/users.service';

export interface ConversationsServiceDeps {
  bubbleDataClient: BubbleDataClient;
  bubbleClient: BubbleClient;
  usersService: UsersService;
}

export interface GetConversationsQuery {
  cursor?: number;
  limit?: number;
  messagesLimit?: number;
}

export function createConversationsService({ bubbleDataClient, bubbleClient, usersService }: ConversationsServiceDeps) {
  return {
    async getConversations(
      userId: string,
      query: GetConversationsQuery,
    ): Promise<PaginatedResult<BubbleConversation>> {
      const user = await usersService.getMe(userId);
      if (!user.bubble_token) throw new Error('User has no Bubble token — please log in again');
      return bubbleDataClient.getConversations({
        bubbleToken: user.bubble_token,
        cursor: query.cursor,
        limit: query.limit ?? 20,
        messagesLimit: query.messagesLimit ?? 20,
      });
    },

    async sendMessage(conversationId: string, body: string): Promise<void> {
      await bubbleClient.sendMessage(conversationId, body);
    },
  };
}

export type ConversationsService = ReturnType<typeof createConversationsService>;
