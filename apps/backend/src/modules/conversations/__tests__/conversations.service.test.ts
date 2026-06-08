import { describe, it, expect, vi } from 'vitest';
import { createConversationsService } from '../conversations.service';
import type { BubbleDataClient } from '../../../core/bubble/data-client';
import type { UsersService } from '../../users/users.service';

const mockUser = {
  id: 'user-1',
  bubble_id: 'bubble-abc',
  email: 'test@test.com',
  first_name: 'Test',
  last_name: 'User',
  avatar_url: null,
  phone: null,
  gender: null as null,
  profile_completed: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockConversation = {
  id: 'conv-1',
  contact: { id: 'c-1', name: 'Mathis Vella', phone: '+33778566100', avatar_url: null },
  channel: 'whatsapp' as const,
  property_id: 'prop-1',
  property_name: 'Villa Sunset',
  last_message_text: 'Hey there',
  last_message_sent_at: '2025-07-07T10:00:00Z',
  unread_count: 2,
  updated_at: '2025-07-07T10:00:00Z',
};

const mockPaginatedConversations = {
  data: [mockConversation],
  pagination: { cursor: null, has_more: false },
};

const mockMessage = {
  id: 'msg-1',
  text: 'Hello',
  sender: 'them' as const,
  sent_at: '2025-07-07T10:00:00Z',
};

const mockPaginatedMessages = {
  data: [mockMessage],
  pagination: { cursor: null, has_more: false },
};

describe('conversationsService', () => {
  const makeService = () => {
    const bubbleDataClient: BubbleDataClient = {
      getConversations: vi.fn().mockResolvedValue(mockPaginatedConversations),
      getMessages: vi.fn().mockResolvedValue(mockPaginatedMessages),
    };
    const usersService = {
      getMe: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UsersService;
    return { service: createConversationsService({ bubbleDataClient, usersService }), bubbleDataClient, usersService };
  };

  it('getConversations calls Bubble with users bubble_id', async () => {
    const { service, bubbleDataClient } = makeService();
    const result = await service.getConversations('user-1', { limit: 20 });
    expect(bubbleDataClient.getConversations).toHaveBeenCalledWith(
      expect.objectContaining({ bubbleUserId: 'bubble-abc', limit: 20 }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('conv-1');
  });

  it('getConversations throws if user has no bubble_id', async () => {
    const { service, usersService } = makeService();
    (usersService.getMe as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ...mockUser, bubble_id: null });
    await expect(service.getConversations('user-1', { limit: 20 })).rejects.toThrow('User has no Bubble account linked');
  });

  it('getMessages calls Bubble with conversationId', async () => {
    const { service, bubbleDataClient } = makeService();
    const result = await service.getMessages('user-1', 'conv-1', { limit: 20 });
    expect(bubbleDataClient.getMessages).toHaveBeenCalledWith('conv-1', expect.objectContaining({ limit: 20 }));
    expect(result.data[0].id).toBe('msg-1');
  });
});
