import type { BubbleDataClient, PaginatedResult, BubbleConversation, BubbleMessage } from '../../core/bubble/data-client';
import type { UsersService } from '../users/users.service';

export interface ConversationsServiceDeps {
  bubbleDataClient: BubbleDataClient;
  usersService: UsersService;
}

export interface GetConversationsQuery {
  cursor?: string;
  limit?: number;
  propertyId?: string;
  q?: string;
}

export function createConversationsService({ bubbleDataClient, usersService }: ConversationsServiceDeps) {
  return {
    async getConversations(
      userId: string,
      query: GetConversationsQuery,
    ): Promise<PaginatedResult<BubbleConversation>> {
      const user = await usersService.getMe(userId);
      if (!user.bubble_id) throw new Error('User has no Bubble account linked');
      return bubbleDataClient.getConversations({
        bubbleUserId: user.bubble_id,
        cursor: query.cursor,
        limit: query.limit ?? 20,
        propertyId: query.propertyId,
        q: query.q,
      });
    },

    async getMessages(
      userId: string,
      conversationId: string,
      query: { cursor?: string; limit?: number },
    ): Promise<PaginatedResult<BubbleMessage>> {
      const user = await usersService.getMe(userId);
      if (!user.bubble_id) throw new Error('User has no Bubble account linked');
      return bubbleDataClient.getMessages(conversationId, {
        cursor: query.cursor,
        limit: query.limit ?? 30,
      });
    },
  };
}

export type ConversationsService = ReturnType<typeof createConversationsService>;
