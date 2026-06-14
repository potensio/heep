import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { listTicketsSchema } from './support.validation';
import { getSupportTickets } from '../../core/bubble/support-data-client';

export const supportRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

supportRoutes.get('/', requireAuth, zValidator('query', listTicketsSchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');

  const user = await c.get('usersService').getMe(c.get('user').id);
  if (!user.bubble_token) return c.json({ error: 'User has no Bubble token' }, 400);
  if (!user.bubble_id) return c.json({ error: 'User has no Bubble id' }, 400);

  const result = await getSupportTickets({
    bubbleToken: user.bubble_token,
    dataUrl: c.env.BUBBLE_DATA_URL,
    bubbleUserId: user.bubble_id,
    cursor,
    limit: limit ?? 20,
  });

  return c.json(result);
});
