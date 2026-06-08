import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTestDb } from '../../../core/test/db';
import { createApp } from '../../../app';

useTestDb();

// Capture real fetch BEFORE any stubbing so DB calls pass through.
const realFetch = globalThis.fetch;
const bubbleMock = vi.fn();

// Selective mock: Bubble API calls use bubbleMock, all others pass through to real fetch.
const selectiveFetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  if (url.includes('heep.ai')) {
    return bubbleMock(input, init);
  }
  return realFetch(input as any, init);
});

beforeEach(() => {
  vi.stubGlobal('fetch', selectiveFetch);
  bubbleMock.mockReset();
  selectiveFetch.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const testEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: 'test-access-secret-16chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-16ch',
  ACCESS_TOKEN_TTL: '900',
  REFRESH_TOKEN_TTL: '2592000',
  WEB_ORIGIN: 'http://localhost:5173',
  BUBBLE_API_URL: 'https://app.heep.ai/version-test',
  BUBBLE_API_KEY: 'test-bubble-key',
};

function stubBubbleLoginOk(userId = 'bubble-123') {
  bubbleMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: 'success', response: { token: 'tok', user_id: userId, expires: 31536000 } }),
  });
}

function stubBubbleLoginFail() {
  bubbleMock.mockResolvedValueOnce({ ok: false, status: 401 });
}

async function json(res: Response) { return res.json() as Promise<any>; }

describe('POST /auth/login', () => {
  it('returns tokens and user on valid credentials', async () => {
    stubBubbleLoginOk();
    const res = await createApp().request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@example.com', password: 'password123' }),
    }, testEnv);
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.user.email).toBe('login@example.com');
  });

  it('returns 401 on bad credentials', async () => {
    stubBubbleLoginFail();
    const res = await createApp().request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@example.com', password: 'wrong' }),
    }, testEnv);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid input', async () => {
    const res = await createApp().request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'pass' }),
    }, testEnv);
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login → POST /auth/refresh', () => {
  it('login then refresh rotates token', async () => {
    stubBubbleLoginOk('bubble-refresh-test');
    const app = createApp();
    const loginRes = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'refresh@example.com', password: 'password123' }),
    }, testEnv);
    const { refreshToken, accessToken } = await json(loginRes);

    const refRes = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, testEnv);
    expect(refRes.status).toBe(200);
    const refreshed = await json(refRes);
    expect(refreshed.refreshToken).not.toBe(refreshToken);
    expect(refreshed.accessToken).not.toBe(accessToken);
  });

  it('reusing a rotated refresh token returns 401', async () => {
    stubBubbleLoginOk('bubble-reuse-test');
    const app = createApp();
    const loginRes = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reuse@example.com', password: 'password123' }),
    }, testEnv);
    const { refreshToken } = await json(loginRes);

    await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, testEnv);

    const reuseRes = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, testEnv);
    expect(reuseRes.status).toBe(401);
  });
});
