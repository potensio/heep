import { describe, it, expect } from 'vitest';
import { createApp } from './app';

const testEnv = {
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://user:pass@host.test/db',
  JWT_ACCESS_SECRET: 'test-access-secret-16chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-16ch',
  ACCESS_TOKEN_TTL: '900',
  REFRESH_TOKEN_TTL: '2592000',
  OTP_TTL: '300',
  OTP_MAX_ATTEMPTS: '5',
  EMAIL_FROM: 'test@example.com',
  WEB_ORIGIN: 'http://localhost:5173',
  CHAT_ROOM: {} as any,
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
