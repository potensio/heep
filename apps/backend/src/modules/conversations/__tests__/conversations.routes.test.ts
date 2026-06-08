import { vi, describe, it, expect } from 'vitest';

vi.mock('../../../core/middleware/auth', () => ({
  requireAuth: async (_c: any, next: any) => next(),
}));

import { Hono } from 'hono';
import { conversationsRoutes } from '../conversations.routes';
import type { AppVariables } from '../../../types/hono';
import type { Env } from '../../../types/env';

const mockPaginated = {
  data: [{ id: 'conv-1', contact: { id: 'c-1', name: 'Test', phone: '', avatar_url: null }, channel: 'whatsapp', property_id: 'p-1', property_name: 'Villa', last_message_text: 'Hi', last_message_sent_at: '2025-01-01T00:00:00Z', unread_count: 0, updated_at: '2025-01-01T00:00:00Z' }],
  pagination: { cursor: null, has_more: false },
};

const makeApp = () => {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();
  app.use('*', async (c, next) => {
    c.set('user', { id: 'user-1' });
    c.set('conversationsService', {
      getConversations: vi.fn().mockResolvedValue(mockPaginated),
      getMessages: vi.fn().mockResolvedValue({ data: [], pagination: { cursor: null, has_more: false } }),
    } as any);
    await next();
  });
  app.route('/conversations', conversationsRoutes);
  return app;
};

describe('GET /conversations', () => {
  it('returns 200 with paginated data', async () => {
    const res = await makeApp().request('/conversations');
    expect(res.status).toBe(200);
    const body = await res.json() as typeof mockPaginated;
    expect(body.data).toHaveLength(1);
    expect(body.pagination.has_more).toBe(false);
  });

  it('returns 200 with query params forwarded', async () => {
    const res = await makeApp().request('/conversations?limit=10&property_id=p-1');
    expect(res.status).toBe(200);
  });
});

describe('GET /conversations/:id/messages', () => {
  it('returns 200 with paginated messages', async () => {
    const res = await makeApp().request('/conversations/conv-1/messages');
    expect(res.status).toBe(200);
    const body = await res.json() as { data: unknown[]; pagination: { cursor: string | null; has_more: boolean } };
    expect(body.data).toHaveLength(0);
  });
});
