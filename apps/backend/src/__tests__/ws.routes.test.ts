import { vi, describe, it, expect } from 'vitest';
import { createApp } from '../app';
import { signAccessToken, TEST_ACCESS_SECRET } from '../core/jwt';
import type { Env } from '../types/env';

function makeEnv() {
  const idFromName = vi.fn().mockReturnValue('do-id');
  // The real DO returns a 101 (WebSocket upgrade); the Node test runtime rejects
  // constructing a 101 Response, so the mock returns a sentinel we assert passes through.
  const connectFetch = vi.fn().mockResolvedValue(new Response('upgraded', { status: 200 }));
  const get = vi.fn().mockReturnValue({ fetch: connectFetch });
  const env = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    JWT_ACCESS_SECRET: TEST_ACCESS_SECRET,
    JWT_REFRESH_SECRET: 'refresh-secret',
    ACCESS_TOKEN_TTL: '900',
    REFRESH_TOKEN_TTL: '2592000',
    BUBBLE_API_URL: 'https://bubble.test',
    BUBBLE_DATA_URL: 'https://bubble.test',
    BUBBLE_API_KEY: 'bubble-key',
    WEBHOOK_SECRET: 'wh',
    WEB_ORIGIN: 'http://localhost',
    CONNECTIONS: { idFromName, get },
  } as unknown as Env;
  return { env, idFromName, get, connectFetch };
}

describe('GET /ws', () => {
  it('rejects a request with no token', async () => {
    const { env } = makeEnv();
    const res = await createApp().request('/ws', {}, env);
    expect(res.status).toBe(401);
  });

  it('rejects a token without a team_id (would never receive events)', async () => {
    const { env, get } = makeEnv();
    const token = await signAccessToken('user-1', TEST_ACCESS_SECRET, 'bubble-1', null);
    const res = await createApp().request(`/ws?token=${token}`, {}, env);
    expect(res.status).toBe(401);
    // Must not open a connection to any DO when team_id is absent.
    expect(get).not.toHaveBeenCalled();
  });

  it('keys the connection DO by team_id', async () => {
    const { env, idFromName, get } = makeEnv();
    const token = await signAccessToken('user-1', TEST_ACCESS_SECRET, 'bubble-1', 'team-xyz');
    const res = await createApp().request(`/ws?token=${token}`, {}, env);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('upgraded');
    expect(idFromName).toHaveBeenCalledWith('team-xyz');
    expect(get).toHaveBeenCalledTimes(1);
  });
});
