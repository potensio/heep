// src/modules/users/users.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { updateProfileSchema, sellerProductsQuerySchema } from './users.validation';

export const usersRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Protected routes first so `/me` is not captured by `/:id`.
usersRoutes.get('/me', requireAuth, async (c) => {
  const user = await c.get('usersService').getMe(c.get('user').id);
  return c.json(user);
});

usersRoutes.patch('/me', requireAuth, zValidator('json', updateProfileSchema), async (c) => {
  const patch = c.req.valid('json');
  const updated = await c.get('usersService').updateProfile(c.get('user').id, patch);
  return c.json(updated);
});

// /:id/products must come before /:id to avoid the param capturing 'products'
usersRoutes.get('/:id/products', zValidator('query', sellerProductsQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const result = await c.get('productsService').listFeed({ sellerId: c.req.param('id'), cursor, limit });
  return c.json(result);
});

usersRoutes.get('/:id', async (c) => {
  const profile = await c.get('usersService').getById(c.req.param('id'));
  return c.json(profile);
});
