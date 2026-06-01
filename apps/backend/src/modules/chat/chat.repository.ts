import { and, desc, eq, or } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { conversations, messages, products, users } from '../../core/db/schema';

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export interface FindOrCreateConversationInput {
  productId: string;
  buyerId: string;
  sellerId: string;
}

export interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  text: string | null;
  imageUrl: string | null;
}

export interface ConversationWithContext {
  conversation: Conversation;
  product: { id: string; name: string; price: number };
  otherUser: { id: string; name: string | null; avatarUrl: string | null };
  lastMessage: Message | null;
}

export interface ChatRepository {
  findOrCreateConversation(input: FindOrCreateConversationInput): Promise<Conversation>;
  findConversationById(id: string): Promise<Conversation | null>;
  isParticipant(conversationId: string, userId: string): Promise<boolean>;
  createMessage(input: CreateMessageInput): Promise<Message>;
  listMessages(conversationId: string, limit: number, beforeId?: string): Promise<Message[]>;
  listConversations(userId: string): Promise<ConversationWithContext[]>;
}

export function createChatRepository(db: Database): ChatRepository {
  return {
    async findOrCreateConversation({ productId, buyerId, sellerId }) {
      const [existing] = await db
        .select().from(conversations)
        .where(and(eq(conversations.productId, productId), eq(conversations.buyerId, buyerId)))
        .limit(1);
      if (existing) return existing;
      const [created] = await db.insert(conversations).values({ productId, buyerId, sellerId }).returning();
      return created;
    },

    async findConversationById(id) {
      const [row] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
      return row ?? null;
    },

    async isParticipant(conversationId, userId) {
      const [row] = await db
        .select({ id: conversations.id }).from(conversations)
        .where(and(
          eq(conversations.id, conversationId),
          or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)),
        ))
        .limit(1);
      return !!row;
    },

    async createMessage({ conversationId, senderId, text, imageUrl }) {
      const [row] = await db.insert(messages).values({ conversationId, senderId, text, imageUrl }).returning();
      return row;
    },

    async listMessages(conversationId, limit, _beforeId?) {
      const rows = await db
        .select().from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(limit);
      return rows.reverse();
    },

    async listConversations(userId) {
      const rows = await db
        .select({
          conversation: conversations,
          product: { id: products.id, name: products.name, price: products.price },
          otherUser: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
        })
        .from(conversations)
        .innerJoin(products, eq(conversations.productId, products.id))
        .innerJoin(users, or(
          and(eq(conversations.buyerId, userId), eq(users.id, conversations.sellerId)),
          and(eq(conversations.sellerId, userId), eq(users.id, conversations.buyerId)),
        ))
        .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
        .orderBy(desc(conversations.updatedAt));

      const result: ConversationWithContext[] = [];
      for (const row of rows) {
        const [lastMessage] = await db
          .select().from(messages)
          .where(eq(messages.conversationId, row.conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);
        result.push({ ...row, lastMessage: lastMessage ?? null });
      }
      return result;
    },
  };
}
