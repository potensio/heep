// src/modules/users/users.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { usersService } from './users.service';
import { updateProfileSchema, sellerProductsQuerySchema } from './users.validation';
import { productsService } from '../products/products.service';

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

// /:id/products must come before /:id to avoid the param capturing 'products'
usersRoutes.get('/:id/products', zValidator('query', sellerProductsQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const result = await productsService.listFeed({ sellerId: c.req.param('id'), cursor, limit });
  return c.json(result);
});

usersRoutes.get('/:id', async (c) => {
  const profile = await usersService.getById(c.req.param('id'));
  return c.json(profile);
});
