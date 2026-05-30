import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.onError(errorHandler);
  return app;
}
