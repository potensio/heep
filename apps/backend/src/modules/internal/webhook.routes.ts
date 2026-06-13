import { Hono } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';

const MAX_NOTIFY_ATTEMPTS = 3;
const NOTIFY_RETRY_DELAY_MS = 100;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
  const stub = c.env.CONNECTIONS.get(c.env.CONNECTIONS.idFromName(body.team_id));
  const payload = JSON.stringify({
    type: body.event,
    conversation_id: body.conversation_id ?? null,
    message: body.message ?? null,
    is_ai_paused: body.is_ai_paused ?? null,
  });

  // Deliver to the team's connection DO with a few retries for transient failures.
  // On final failure we log and still return 200: a non-2xx would make the upstream
  // sender re-send, and a duplicate event would double-insert the message on clients.
  // Anything missed here is reconciled by the client's refetch-on-reconnect.
  let delivered = false;
  for (let attempt = 1; attempt <= MAX_NOTIFY_ATTEMPTS; attempt++) {
    try {
      const res = await stub.fetch(
        new Request('https://do/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        }),
      );
      if (res.ok) {
        delivered = true;
        break;
      }
      console.warn(`[webhook] notify attempt ${attempt} returned ${res.status}`);
    } catch (err) {
      console.warn(`[webhook] notify attempt ${attempt} threw`, err);
    }
    if (attempt < MAX_NOTIFY_ATTEMPTS) await delay(NOTIFY_RETRY_DELAY_MS * attempt);
  }

  if (!delivered) {
    console.error(
      `[webhook] notify FAILED after ${MAX_NOTIFY_ATTEMPTS} attempts team_id="${body.team_id}" event="${body.event}"`,
    );
  }

  return c.json({ ok: true });
});
