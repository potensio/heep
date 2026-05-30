// src/modules/auth/auth.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { authService } from './auth.service';
import { usersService } from '../users/users.service';
import { requestOtpSchema, verifyOtpSchema, refreshSchema } from './auth.validation';

export const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.post('/otp/request', zValidator('json', requestOtpSchema), async (c) => {
  const { email } = c.req.valid('json');
  await authService.requestOtp(email);
  return c.json({ ok: true });
});

authRoutes.post('/otp/verify', zValidator('json', verifyOtpSchema), async (c) => {
  const { email, code } = c.req.valid('json');
  const result = await authService.verifyOtp(email, code);
  return c.json(result);
});

authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  const result = await authService.refresh(refreshToken);
  return c.json(result);
});

authRoutes.post('/logout', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  await authService.logout(refreshToken);
  return c.json({ ok: true });
});

authRoutes.get('/me', requireAuth, async (c) => {
  const user = await usersService.getMe(c.get('user').id);
  return c.json(user);
});
