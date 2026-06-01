// src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import { corsMiddleware } from './core/middleware/cors';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { productsRoutes } from './modules/products/products.routes';

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', logger());
  app.use('*', corsMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/products', productsRoutes);

  app.onError(errorHandler);
  return app;
}
