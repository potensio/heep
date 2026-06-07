import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { loginSchema, signupSchema, refreshSchema } from './auth.validation';

export const authRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const result = await c.get('authService').login(email, password);
  return c.json(result);
});

authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { firstName, lastName, email, password } = c.req.valid('json');
  const result = await c.get('authService').signup(firstName, lastName, email, password);
  return c.json(result, 201);
});

authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  const result = await c.get('authService').refresh(refreshToken);
  return c.json(result);
});

authRoutes.post('/logout', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  await c.get('authService').logout(refreshToken);
  return c.json({ ok: true });
});

authRoutes.get('/me', requireAuth, async (c) => {
  const user = await c.get('usersService').getMe(c.get('user').id);
  return c.json(user);
});
