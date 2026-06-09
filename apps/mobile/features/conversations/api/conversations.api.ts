import { getAccessToken, tryRefreshTokens, getBubbleToken } from '@/features/auth/store/auth.store';
import type { ConversationListResponse } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BUBBLE_API_URL = process.env.EXPO_PUBLIC_BUBBLE_API_URL;

export async function fetchConversations(cursor?: number): Promise<ConversationListResponse> {
  const token = await getAccessToken();
  const params = new URLSearchParams({ limit: '20' });
  if (cursor !== undefined) params.set('cursor', String(cursor));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    let res = await fetch(`${API_URL}/conversations?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (res.status === 401) {
      const newToken = await tryRefreshTokens();
      if (!newToken) throw new Error('UNAUTHORIZED');
      res = await fetch(`${API_URL}/conversations?${params}`, {
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
