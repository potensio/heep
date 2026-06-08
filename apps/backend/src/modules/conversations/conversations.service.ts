import type { BubbleDataClient, PaginatedResult, BubbleConversation, BubbleMessage } from '../../core/bubble/data-client';
import type { UsersService } from '../users/users.service';

export interface ConversationsServiceDeps {
  bubbleDataClient: BubbleDataClient;
  usersService: UsersService;
}

export interface GetConversationsQuery {
  cursor?: number;
  limit?: number;
}

export function createConversationsService({ bubbleDataClient, usersService }: ConversationsServiceDeps) {
  return {
    async getConversations(
      userId: string,
      query: GetConversationsQuery,
    ): Promise<PaginatedResult<BubbleConversation>> {
      const user = await usersService.getMe(userId);
      if (!user.bubble_token) throw new Error('User has no Bubble token — please log in again');
      return bubbleDataClient.getConversations({
        bubbleToken: user.bubble_token,
        cursor: query.cursor ? Number(query.cursor) : undefined,
        limit: query.limit ?? 20,
      });
    },

    async getMessages(
      userId: string,
      conversationId: string,
      query: { cursor?: number; limit?: number },
    ): Promise<PaginatedResult<BubbleMessage>> {
      const user = await usersService.getMe(userId);
      if (!user.bubble_token) throw new Error('User has no Bubble token — please log in again');
      return bubbleDataClient.getMessages(conversationId, {
        bubbleToken: user.bubble_token,
        cursor: query.cursor,
        limit: query.limit ?? 30,
      });
    },
  };
}

export type ConversationsService = ReturnType<typeof createConversationsService>;
