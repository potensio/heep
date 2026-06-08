import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { listConversationsSchema } from './conversations.validation';

export const conversationsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

conversationsRoutes.get('/', requireAuth, zValidator('query', listConversationsSchema), async (c) => {
  const { cursor, limit, messages_limit } = c.req.valid('query');
  const result = await c.get('conversationsService').getConversations(c.get('user').id, {
    cursor,
    limit,
    messagesLimit: messages_limit,
  });
  return c.json(result);
});
