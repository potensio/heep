import { describe, it, expect } from 'vitest';
import { createApp } from '../app';

const testEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_KEY: 'test-key',
  JWT_ACCESS_SECRET: 'test-access-secret-16chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-16ch',
  ACCESS_TOKEN_TTL: '900',
  REFRESH_TOKEN_TTL: '2592000',
  BUBBLE_API_URL: 'https://app.heep.ai/version-test/api/1.1/wf',
  BUBBLE_API_KEY: 'test-bubble-key',
  WEB_ORIGIN: 'http://localhost:5173',
};

describe('app', () => {
  it('GET /health returns ok', async () => {
    const app = createApp();
    const res = await app.request('/health', {}, testEnv);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('unknown route returns 404 JSON', async () => {
    const app = createApp();
    const res = await app.request('/nope', {}, testEnv);
    expect(res.status).toBe(404);
  });
});
