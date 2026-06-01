// src/core/middleware/auth.test.ts
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { requireAuth } from './auth';
import { errorHandler } from './error-handler';
import { signAccessToken, TEST_ACCESS_SECRET } from '../jwt';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';

const testEnv: Partial<Env> = { JWT_ACCESS_SECRET: TEST_ACCESS_SECRET };

function protectedApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();
  app.use('/me', requireAuth);
  app.get('/me', (c) => c.json({ id: c.get('user').id }));
  app.onError(errorHandler);
  return app;
}

describe('requireAuth', () => {
  it('rejects when no Authorization header is present', async () => {
    const res = await protectedApp().request('/me', {}, testEnv);
    expect(res.status).toBe(401);
  });

  it('rejects a malformed bearer token', async () => {
    const res = await protectedApp().request('/me', { headers: { Authorization: 'Bearer garbage' } }, testEnv);
    expect(res.status).toBe(401);
  });

  it('passes through and sets c.var.user for a valid token', async () => {
    const token = await signAccessToken('user-42');
    const res = await protectedApp().request('/me', { headers: { Authorization: `Bearer ${token}` } }, testEnv);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'user-42' });
  });
});
