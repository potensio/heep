import { describe, it, expect, vi } from 'vitest';
import { createChatService } from './chat.service';
import type { ChatRepository } from './chat.repository';

function makeRepo(overrides: Partial<ChatRepository> = {}): ChatRepository {
  return {
    findOrCreateConversation: vi.fn().mockResolvedValue({ id: 'c1', productId: 'p1', buyerId: 'u1', sellerId: 'u2', createdAt: new Date(), updatedAt: new Date() }),
    findConversationById: vi.fn().mockResolvedValue(null),
    isParticipant: vi.fn().mockResolvedValue(true),
    createMessage: vi.fn().mockResolvedValue({ id: 'm1', conversationId: 'c1', senderId: 'u1', text: 'hi', imageUrl: null, readAt: null, createdAt: new Date() }),
    listMessages: vi.fn().mockResolvedValue([]),
    listConversations: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('ChatService', () => {
  it('startConversation delegates to repo.findOrCreateConversation', async () => {
    const repo = makeRepo();
    const svc = createChatService({ chatRepo: repo });
    await svc.startConversation({ productId: 'p1', buyerId: 'u1', sellerId: 'u2' });
    expect(repo.findOrCreateConversation).toHaveBeenCalledWith({ productId: 'p1', buyerId: 'u1', sellerId: 'u2' });
  });

  it('getMessages throws if user is not participant', async () => {
    const repo = makeRepo({ isParticipant: vi.fn().mockResolvedValue(false) });
    const svc = createChatService({ chatRepo: repo });
    await expect(svc.getMessages('c1', 'u99')).rejects.toThrow();
  });

  it('getMessages returns messages for participant', async () => {
    const msgs = [{ id: 'm1', conversationId: 'c1', senderId: 'u1', text: 'hi', imageUrl: null, readAt: null, createdAt: new Date() }];
    const repo = makeRepo({ listMessages: vi.fn().mockResolvedValue(msgs) });
    const svc = createChatService({ chatRepo: repo });
    const result = await svc.getMessages('c1', 'u1');
    expect(result).toEqual(msgs);
  });
});
