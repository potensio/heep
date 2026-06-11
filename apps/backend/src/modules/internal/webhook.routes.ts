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
    team_id: string;
    event: string;
    conversation_id?: string;
    message?: { id: string; text: string; sent_by: 'bot' | 'user'; is_manual_response: boolean; sent_at: string };
    is_ai_paused?: boolean;
  };

  if (!body.team_id || !body.event) {
    return c.json({ error: 'Missing team_id or event' }, 400);
  }

  console.log(`[webhook] team_id="${body.team_id}" event="${body.event}"`);
  const doId = c.env.CONNECTIONS.idFromName(body.team_id);
  const stub = c.env.CONNECTIONS.get(doId);

  await stub.fetch(
    new Request('https://do/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: body.event,
        conversation_id: body.conversation_id ?? null,
        message: body.message ?? null,
        is_ai_paused: body.is_ai_paused ?? null,
      }),
    }),
  );

  return c.json({ ok: true });
});
