import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';

export const chatRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const startConvoSchema = z.object({ productId: z.string().uuid(), sellerId: z.string().uuid() });

chatRoutes.post('/conversations', requireAuth, zValidator('json', startConvoSchema), async (c) => {
  const { productId, sellerId } = c.req.valid('json');
  const buyerId = c.get('user').id;
  const convo = await c.get('chatService').startConversation({ productId, buyerId, sellerId });
  return c.json(convo, 201);
});

chatRoutes.get('/conversations', requireAuth, async (c) => {
  const list = await c.get('chatService').listConversations(c.get('user').id);
  return c.json(list);
});

chatRoutes.get('/conversations/:id', requireAuth, async (c) => {
  const convo = await c.get('chatService').getConversation(c.req.param('id')!, c.get('user').id);
  return c.json(convo);
});

chatRoutes.get('/conversations/:id/messages', requireAuth, async (c) => {
  const msgs = await c.get('chatService').getMessages(c.req.param('id')!, c.get('user').id);
  return c.json(msgs);
});

chatRoutes.get('/conversations/:id/ws', requireAuth, async (c) => {
  const id = c.req.param('id')!;
  const doId = c.env.CHAT_ROOM.idFromName(id);
  const stub = c.env.CHAT_ROOM.get(doId);
  return stub.fetch(c.req.raw);
});
