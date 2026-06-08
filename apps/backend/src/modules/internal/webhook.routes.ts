import { Hono } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';

export const webhookRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

webhookRoutes.post('/webhook', async (c) => {
  const secret = c.req.header('X-Webhook-Secret');
  if (!secret || secret !== c.env.WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json() as {
    user_id: string;
    event: string;
    conversation_id?: string;
  };

  if (!body.user_id || !body.event) {
    return c.json({ error: 'Missing user_id or event' }, 400);
  }

  const doId = c.env.CONNECTIONS.idFromName(body.user_id);
  const stub = c.env.CONNECTIONS.get(doId);

  await stub.fetch(
    new Request('https://do/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: body.event, conversation_id: body.conversation_id }),
    }),
  );

  return c.json({ ok: true });
});
