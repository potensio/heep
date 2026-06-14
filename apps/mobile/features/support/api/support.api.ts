import { getAccessToken, tryRefreshTokens, getBubbleToken } from '@/features/auth/store/auth.store';
import type { SupportTicketListResponse } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BUBBLE_API_URL = process.env.EXPO_PUBLIC_BUBBLE_API_URL;

export async function fetchTickets(cursor?: number): Promise<SupportTicketListResponse> {
  const token = await getAccessToken();
  const params = new URLSearchParams({ limit: '20' });
  if (cursor !== undefined) params.set('cursor', String(cursor));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    let res = await fetch(`${API_URL}/support?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (res.status === 401) {
      const newToken = await tryRefreshTokens();
      if (!newToken) throw new Error('UNAUTHORIZED');
      res = await fetch(`${API_URL}/support?${params}`, {
        headers: { Authorization: `Bearer ${newToken}` },
        signal: controller.signal,
      });
      if (res.status === 401) throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) throw new Error('Failed to load support tickets');

    return res.json() as Promise<SupportTicketListResponse>;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Creates a support ticket via the Bubble workflow. Called directly with the
 * user's Bubble token (like pauseAI / fetchLocations) so the ticket is owned by
 * the logged-in user — which is exactly what scopes it into the list query.
 */
export async function createTicket(restaurantId: string, body: string): Promise<void> {
  const token = await getBubbleToken();
  if (!token) throw new Error('No auth token');

  const res = await fetch(`${BUBBLE_API_URL}/hono-ticket-creation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ restaurant_id: restaurantId, body }),
  });

  if (!res.ok) throw new Error('Failed to create ticket');
}
