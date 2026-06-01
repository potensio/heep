// src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import { corsMiddleware } from './core/middleware/cors';
import { servicesMiddleware } from './core/middleware/services';
import type { Env } from './types/env';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { productsRoutes } from './modules/products/products.routes';
import { savedProductsRoutes } from './modules/saved-products/saved-products.routes';

export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

  app.use('*', logger());
  app.use('*', corsMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.use('/auth/*', servicesMiddleware);
  app.use('/users/*', servicesMiddleware);
  app.use('/products/*', servicesMiddleware);
  app.use('/saved-products/*', servicesMiddleware);

  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/products', productsRoutes);
  app.route('/saved-products', savedProductsRoutes);

  app.onError(errorHandler);
  return app;
}
