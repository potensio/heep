// src/modules/users/users.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { usersService } from './users.service';
import { updateProfileSchema } from './users.validation';

export const usersRoutes = new Hono<{ Variables: AppVariables }>();

// Protected routes first so `/me` is not captured by `/:id`.
usersRoutes.get('/me', requireAuth, async (c) => {
  const user = await usersService.getMe(c.get('user').id);
  return c.json(user);
});

usersRoutes.patch('/me', requireAuth, zValidator('json', updateProfileSchema), async (c) => {
  const patch = c.req.valid('json');
  const updated = await usersService.updateProfile(c.get('user').id, patch);
  return c.json(updated);
});

usersRoutes.get('/:id', async (c) => {
  const profile = await usersService.getById(c.req.param('id'));
  return c.json(profile);
});
