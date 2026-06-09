import { vi, describe, it, expect } from 'vitest';

vi.mock('../../../core/middleware/auth', () => ({
  requireAuth: async (_c: any, next: any) => next(),
}));

import { Hono } from 'hono';
import { conversationsRoutes } from '../conversations.routes';
import type { AppVariables } from '../../../types/hono';
import type { Env } from '../../../types/env';

const mockPaginated = {
  data: [{ id: 'conv-1', contact: { name: 'Test', avatar_url: null }, channel: 'whatsapp', property: { id: 'p-1', name: 'Villa' }, last_message: { text: 'Hi', sent_at: '2025-01-01T00:00:00Z' } }],
  pagination: { cursor: null, has_more: false },
};

const makeApp = () => {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();
  app.use('*', async (c, next) => {
    c.set('user', { id: 'user-1', bubble_id: null, team_id: null });
    c.set('conversationsService', {
      getConversations: vi.fn().mockResolvedValue(mockPaginated),
      sendMessage: vi.fn().mockResolvedValue(undefined),
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
    const res = await makeApp().request('/conversations?limit=10');
    expect(res.status).toBe(200);
  });
});

describe('POST /conversations/:id/messages', () => {
  it('returns 204 on valid body', async () => {
    const res = await makeApp().request('/conversations/conv-1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Hello!' }),
    });
    expect(res.status).toBe(204);
  });

  it('returns 400 when body is missing', async () => {
    const res = await makeApp().request('/conversations/conv-1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is empty string', async () => {
    const res = await makeApp().request('/conversations/conv-1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: '' }),
    });
    expect(res.status).toBe(400);
  });
});
