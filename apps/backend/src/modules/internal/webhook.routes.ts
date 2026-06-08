import { Hono } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';

export const webhookRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

webhookRoutes.post('/webhook', async (c) => {
  const secret = c.req.header('X-Webhook-Secret');
  if (!secret) return c.json({ error: 'Unauthorized' }, 401);
  const encoder = new TextEncoder();
  const a = encoder.encode(secret);
  const b = encoder.encode(c.env.WEBHOOK_SECRET);
  const valid = a.length === b.length && await crypto.subtle.timingSafeEqual(a, b);
  if (!valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json() as {
    bubble_user_id: string;
    event: string;
    conversation_id?: string;
  };

  if (!body.bubble_user_id || !body.event) {
    return c.json({ error: 'Missing bubble_user_id or event' }, 400);
  }

  const doId = c.env.CONNECTIONS.idFromName(body.bubble_user_id);
  const stub = c.env.CONNECTIONS.get(doId);

  await stub.fetch(
    new Request('https://do/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: body.event, conversation_id: body.conversation_id ?? null }),
    }),
  );

  return c.json({ ok: true });
});
