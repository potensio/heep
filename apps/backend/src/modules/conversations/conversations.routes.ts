import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { listConversationsSchema, listMessagesSchema } from './conversations.validation';

export const conversationsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

conversationsRoutes.get('/', requireAuth, zValidator('query', listConversationsSchema), async (c) => {
  const { cursor, limit, property_id, q } = c.req.valid('query');
  const result = await c.get('conversationsService').getConversations(c.get('user').id, {
    cursor,
    limit,
    propertyId: property_id,
    q,
  });
  return c.json(result);
});

conversationsRoutes.get('/:id/messages', requireAuth, zValidator('query', listMessagesSchema), async (c) => {
  const conversationId = c.req.param('id');
  const { cursor, limit } = c.req.valid('query');
  const result = await c.get('conversationsService').getMessages(c.get('user').id, conversationId, {
    cursor,
    limit,
  });
  return c.json(result);
});
