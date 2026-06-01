import { ForbiddenError } from '../../core/errors';
import type { ChatRepository, Conversation, ConversationWithContext, Message } from './chat.repository';

export interface ChatDeps {
  chatRepo: ChatRepository;
}

export function createChatService({ chatRepo }: ChatDeps) {
  return {
    async startConversation(input: { productId: string; buyerId: string; sellerId: string }): Promise<Conversation> {
      return chatRepo.findOrCreateConversation(input);
    },

    async listConversations(userId: string): Promise<ConversationWithContext[]> {
      return chatRepo.listConversations(userId);
    },

    async getConversation(conversationId: string, userId: string): Promise<Conversation> {
      const ok = await chatRepo.isParticipant(conversationId, userId);
      if (!ok) throw new ForbiddenError('Not a participant');
      const convo = await chatRepo.findConversationById(conversationId);
      if (!convo) throw new ForbiddenError('Not a participant');
      return convo;
    },

    async getMessages(conversationId: string, userId: string, limit = 50): Promise<Message[]> {
      const ok = await chatRepo.isParticipant(conversationId, userId);
      if (!ok) throw new ForbiddenError('Not a participant');
      return chatRepo.listMessages(conversationId, limit);
    },
  };
}

export type ChatService = ReturnType<typeof createChatService>;
