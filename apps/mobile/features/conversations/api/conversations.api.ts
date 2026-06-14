import { getAccessToken, tryRefreshTokens, getBubbleToken } from '@/features/auth/store/auth.store';
import type { ConversationListResponse } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BUBBLE_API_URL = process.env.EXPO_PUBLIC_BUBBLE_API_URL;

export interface ConversationQuery {
  platform?: string[];
  priority?: string[];
  tags?: string[];
  isSpam?: boolean;
  isArchived?: boolean;
  search?: string;
  restaurantId?: string;
}

export async function fetchConversations(
  cursor?: number,
  query: ConversationQuery = {},
): Promise<ConversationListResponse> {
  const token = await getAccessToken();
  const params = new URLSearchParams({ limit: '20' });
  if (cursor !== undefined) params.set('cursor', String(cursor));
  if (query.platform?.length) params.set('platform', query.platform.join(','));
  if (query.priority?.length) params.set('priority', query.priority.join(','));
  if (query.tags?.length) params.set('tags', query.tags.join(','));
  if (query.isSpam) params.set('is_spam', 'true');
  if (query.isArchived) params.set('is_archived', 'true');
  if (query.search) params.set('search', query.search);
  if (query.restaurantId) params.set('restaurant_id', query.restaurantId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    let res = await fetch(`${API_URL}/conversations-v2?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (res.status === 401) {
      const newToken = await tryRefreshTokens();
      if (!newToken) throw new Error('UNAUTHORIZED');
      res = await fetch(`${API_URL}/conversations-v2?${params}`, {
        headers: { Authorization: `Bearer ${newToken}` },
        signal: controller.signal,
      });
      if (res.status === 401) throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) throw new Error('Failed to load conversations');

    return res.json() as Promise<ConversationListResponse>;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchConversationMessages(
  conversationId: string,
  cursor: number,
): Promise<{ data: import('../types').Message[]; pagination: { cursor: number | null; has_more: boolean } }> {
  let token = await getAccessToken();
  const params = new URLSearchParams({ cursor: String(cursor), limit: '20' });

  let res = await fetch(`${API_URL}/conversations-v2/${conversationId}/messages?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    const newToken = await tryRefreshTokens();
    if (!newToken) throw new Error('UNAUTHORIZED');
    res = await fetch(`${API_URL}/conversations-v2/${conversationId}/messages?${params}`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

export async function pauseAI(conversationId: string, isPaused: boolean): Promise<void> {
  const token = await getBubbleToken();
  if (!token) throw new Error('No auth token');

  const res = await fetch(`${BUBBLE_API_URL}/hono-conversation-pause-ai`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conversation_id: conversationId, is_paused: isPaused }),
  });

  if (!res.ok) throw new Error('Failed to update AI pause state');
}

export async function sendMessage(conversationId: string, body: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('UNAUTHORIZED');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const makeRequest = (t: string) =>
    fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
      signal: controller.signal,
    });

  try {
    let res = await makeRequest(token);

    if (res.status === 401) {
      const newToken = await tryRefreshTokens();
      if (!newToken) throw new Error('UNAUTHORIZED');
      res = await makeRequest(newToken);
      if (res.status === 401) throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) throw new Error('Failed to send message');
  } finally {
    clearTimeout(timeout);
  }
}
