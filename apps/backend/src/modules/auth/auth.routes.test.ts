// src/modules/auth/auth.routes.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { sentOtps } from '../../core/email';

useTestDb();

const testEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
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

async function json(res: Response) { return res.json() as Promise<any>; }

describe('auth routes (integration, full login flow)', () => {
  beforeEach(() => { sentOtps.length = 0; });

  it('request OTP → verify → use access token on /users/me → refresh', async () => {
    const app = createApp();

    // 1. Request OTP
    const reqRes = await app.request('/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'flow@example.com' }),
    }, testEnv);
    expect(reqRes.status).toBe(200);
    expect(await json(reqRes)).toEqual({ ok: true });
    expect(sentOtps).toHaveLength(1);
    const code = sentOtps[0].code;

    // 2. Verify OTP → tokens + user (new user auto-created)
    const verRes = await app.request('/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'flow@example.com', code }),
    }, testEnv);
    expect(verRes.status).toBe(200);
    const { accessToken, refreshToken, user } = await json(verRes);
    expect(user.email).toBe('flow@example.com');
    expect(user.profileCompleted).toBe(false);

    // 3. Use the access token
    const meRes = await app.request('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } }, testEnv);
    expect(meRes.status).toBe(200);
    expect((await json(meRes)).id).toBe(user.id);

    // 4. Refresh rotates the token
    const refRes = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, testEnv);
    expect(refRes.status).toBe(200);
    const refreshed = await json(refRes);
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.refreshToken).not.toBe(refreshToken); // rotated

    // 5. Old refresh token is now revoked
    const reuseRes = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, testEnv);
    expect(reuseRes.status).toBe(401);
  });

  it('verify with a wrong code returns 401', async () => {
    const app = createApp();
    await app.request('/auth/otp/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@example.com' }),
    }, testEnv);
    const res = await app.request('/auth/otp/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@example.com', code: '000000' }),
    }, testEnv);
    expect(res.status).toBe(401);
  });

  it('rejects an invalid email shape with 400', async () => {
    const res = await createApp().request('/auth/otp/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    }, testEnv);
    expect(res.status).toBe(400);
  });
});
