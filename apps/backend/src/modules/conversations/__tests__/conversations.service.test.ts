import { describe, it, expect, vi } from 'vitest';
import { createConversationsService } from '../conversations.service';
import type { BubbleDataClient } from '../../../core/bubble/data-client';
import type { BubbleClient } from '../../../core/bubble/client';
import type { UsersService } from '../../users/users.service';

const mockUser = {
  id: 'user-1',
  bubble_id: 'bubble-abc',
  bubble_token: 'tok-xyz',
  team_id: 'team-abc',
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
  contact: { name: 'Mathis Vella', avatar_url: null },
  channel: 'whatsapp' as const,
  property: { id: 'prop-1', name: 'Villa Sunset' },
  last_message: { text: 'Hey there', sent_at: '2025-07-07T10:00:00Z' },
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
    const bubbleClient = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as BubbleClient;
    const usersService = {
      getMe: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UsersService;
    return {
      service: createConversationsService({ bubbleDataClient, bubbleClient, usersService }),
      bubbleDataClient,
      bubbleClient,
      usersService,
    };
  };

  it('getConversations calls Bubble with users bubble_token', async () => {
    const { service, bubbleDataClient } = makeService();
    const result = await service.getConversations('user-1', { limit: 20 });
    expect(bubbleDataClient.getConversations).toHaveBeenCalledWith(
      expect.objectContaining({ bubbleToken: 'tok-xyz', limit: 20 }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('conv-1');
  });

  it('getConversations throws if user has no bubble_token', async () => {
    const { service, usersService } = makeService();
    (usersService.getMe as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ...mockUser, bubble_token: null });
    await expect(service.getConversations('user-1', { limit: 20 })).rejects.toThrow('User has no Bubble token — please log in again');
  });

  it('sendMessage calls bubbleClient.sendMessage with conversationId and body', async () => {
    const { service, bubbleClient } = makeService();
    await service.sendMessage('conv-1', 'Hello!');
    expect(bubbleClient.sendMessage).toHaveBeenCalledWith('conv-1', 'Hello!');
  });
});
