import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { listConversationsSchema, listMessagesSchema } from './conversations.validation';
import { getConversationsV2, getConversationMessages } from '../../core/bubble/data-client-v2';

export const conversationsV2Routes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

conversationsV2Routes.get('/', requireAuth, zValidator('query', listConversationsSchema), async (c) => {
  const {
    cursor,
    limit,
    messages_limit,
    restaurant_id,
    platform,
    priority,
    tags,
    is_spam,
    is_archived,
    search,
  } = c.req.valid('query');

  const user = await c.get('usersService').getMe(c.get('user').id);
  if (!user.bubble_token) return c.json({ error: 'User has no Bubble token' }, 400);

  const result = await getConversationsV2({
    bubbleToken: user.bubble_token,
    dataUrl: c.env.BUBBLE_DATA_URL,
    cursor,
    limit: limit ?? 20,
    messagesLimit: messages_limit ?? 20,
    filters: {
      restaurantId: restaurant_id,
      platform,
      priority,
      tags,
      isSpam: is_spam,
      isArchived: is_archived,
      search,
    },
  });

  return c.json(result);
});

conversationsV2Routes.get('/:id/messages', requireAuth, zValidator('query', listMessagesSchema), async (c) => {
  const { id } = c.req.param();
  const { cursor, limit } = c.req.valid('query');

  const user = await c.get('usersService').getMe(c.get('user').id);
  if (!user.bubble_token) return c.json({ error: 'User has no Bubble token' }, 400);

  const result = await getConversationMessages({
    bubbleToken: user.bubble_token,
    dataUrl: c.env.BUBBLE_DATA_URL,
    conversationId: id,
    cursor,
    limit,
  });

  return c.json(result);
});
