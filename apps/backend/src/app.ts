// src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', logger());

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.route('/users', usersRoutes);

  app.onError(errorHandler);
  return app;
}
