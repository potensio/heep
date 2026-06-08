import { getAccessToken } from '@/features/auth/store/auth.store';
import type { ConversationListResponse } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function fetchConversations(cursor?: number): Promise<ConversationListResponse> {
  const token = await getAccessToken();
  const params = new URLSearchParams({ limit: '20' });
  if (cursor !== undefined) params.set('cursor', String(cursor));

  const res = await fetch(`${API_URL}/conversations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('Failed to load conversations');

  return res.json() as Promise<ConversationListResponse>;
}
