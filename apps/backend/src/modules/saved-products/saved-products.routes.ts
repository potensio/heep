import { Hono } from 'hono';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { savedProductsService } from './saved-products.service';

export const savedProductsRoutes = new Hono<{ Variables: AppVariables }>();

savedProductsRoutes.use('*', requireAuth);

savedProductsRoutes.post('/:productId', async (c) => {
  const userId = c.get('user').id;
  const productId = c.req.param('productId');
  const result = await savedProductsService.saveProduct(userId, productId);
  return c.json(result, 201);
});

savedProductsRoutes.delete('/:productId', async (c) => {
  const userId = c.get('user').id;
  const productId = c.req.param('productId');
  await savedProductsService.unsaveProduct(userId, productId);
  return c.body(null, 204);
});

savedProductsRoutes.get('/', async (c) => {
  const userId = c.get('user').id;
  const cursor = c.req.query('cursor');
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!, 10) : undefined;
  const result = await savedProductsService.listSavedProducts(userId, cursor, limit);
  return c.json(result);
});
