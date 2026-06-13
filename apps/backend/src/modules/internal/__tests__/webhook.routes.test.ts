import { vi, describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { webhookRoutes } from '../webhook.routes';
import type { AppVariables } from '../../../types/hono';
import type { Env } from '../../../types/env';

const SECRET = 'webhook-secret-value';

// crypto.subtle.timingSafeEqual is a Cloudflare Workers extension; the Node
// test runtime doesn't ship it, so polyfill a constant-time comparison.
beforeAll(() => {
  const subtle = crypto.subtle as unknown as { timingSafeEqual?: unknown };
  if (typeof subtle.timingSafeEqual !== 'function') {
    subtle.timingSafeEqual = (a: ArrayBufferView, b: ArrayBufferView) => {
      const av = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
      const bv = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
      if (av.length !== bv.length) return false;
      let diff = 0;
      for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
      return diff === 0;
    };
  }
});

function makeHarness(notifyFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ delivered: 1 })))) {
  const stub = { fetch: notifyFetch };
  const idFromName = vi.fn().mockReturnValue('do-id');
  const get = vi.fn().mockReturnValue(stub);
  const env = {
    WEBHOOK_SECRET: SECRET,
    CONNECTIONS: { idFromName, get },
  } as unknown as Env;

  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();
  app.route('/internal', webhookRoutes);

  const post = (body: unknown, secret?: string) =>
    app.request(
      '/internal/webhook',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret !== undefined ? { 'X-Webhook-Secret': secret } : {}),
        },
        body: JSON.stringify(body),
      },
      env,
    );

  return { post, idFromName, get, notifyFetch };
}

const validBody = {
  team_id: 'team-abc',
  event: 'message.created',
  conversation_id: 'conv-1',
  message: { id: 'm-1', text: 'hi', sent_by: 'user', is_manual_response: false, sent_at: '2025-01-01T00:00:00Z' },
};

describe('POST /internal/webhook', () => {
  it('rejects a missing secret with 401', async () => {
    const { post } = makeHarness();
    const res = await post(validBody);
    expect(res.status).toBe(401);
  });

  it('rejects a wrong secret with 401', async () => {
    const { post, notifyFetch } = makeHarness();
    const res = await post(validBody, 'not-the-secret');
    expect(res.status).toBe(401);
    expect(notifyFetch).not.toHaveBeenCalled();
  });

  it('rejects a body without team_id/event with 400', async () => {
    const { post } = makeHarness();
    const res = await post({ conversation_id: 'conv-1' }, SECRET);
    expect(res.status).toBe(400);
  });

  it('fans out to the team DO and returns ok on a valid event', async () => {
    const { post, idFromName, notifyFetch } = makeHarness();
    const res = await post(validBody, SECRET);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    // Routed to the DO keyed by team_id (must match the /ws connect key).
    expect(idFromName).toHaveBeenCalledWith('team-abc');

    expect(notifyFetch).toHaveBeenCalledTimes(1);
    const notifyReq = notifyFetch.mock.calls[0][0] as Request;
    expect(new URL(notifyReq.url).pathname).toBe('/notify');
    const forwarded = await notifyReq.json();
    expect(forwarded).toMatchObject({
      type: 'message.created',
      conversation_id: 'conv-1',
      is_ai_paused: null,
    });
  });

  it('retries delivery on a transient failure then succeeds', async () => {
    const notifyFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('err', { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ delivered: 1 })));
    const { post } = makeHarness(notifyFetch);

    const res = await post(validBody, SECRET);
    expect(res.status).toBe(200);
    expect(notifyFetch).toHaveBeenCalledTimes(2);
  });

  it('still returns 200 (no upstream re-send) when delivery fails every attempt', async () => {
    const notifyFetch = vi.fn().mockRejectedValue(new Error('DO unreachable'));
    const { post } = makeHarness(notifyFetch);

    const res = await post(validBody, SECRET);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(notifyFetch).toHaveBeenCalledTimes(3);
  });
});
