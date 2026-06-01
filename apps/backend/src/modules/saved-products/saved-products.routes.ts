import { Hono } from 'hono';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';

export const savedProductsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

savedProductsRoutes.use('*', requireAuth);

savedProductsRoutes.post('/:productId', async (c) => {
  const userId = c.get('user').id;
  const productId = c.req.param('productId');
  const result = await c.get('savedProductsService').saveProduct(userId, productId);
  return c.json(result, 201);
});

savedProductsRoutes.delete('/:productId', async (c) => {
  const userId = c.get('user').id;
  const productId = c.req.param('productId');
  await c.get('savedProductsService').unsaveProduct(userId, productId);
  return c.body(null, 204);
});

savedProductsRoutes.get('/:productId', async (c) => {
  const userId = c.get('user').id;
  const productId = c.req.param('productId');
  const saved = await c.get('savedProductsService').isSaved(userId, productId);
  return c.json({ saved });
});

savedProductsRoutes.get('/', async (c) => {
  const userId = c.get('user').id;
  const cursor = c.req.query('cursor');
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : undefined;
  const result = await c.get('savedProductsService').listSavedProducts(userId, cursor, limit);
  return c.json(result);
});
