import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import { corsMiddleware } from './core/middleware/cors';
import { servicesMiddleware } from './core/middleware/services';
import type { Env } from './types/env';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { conversationsRoutes } from './modules/conversations/conversations.routes';
import { webhookRoutes } from './modules/internal/webhook.routes';
import { requireAuth } from './core/middleware/auth';

export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

  app.use('*', logger());
  app.use('*', corsMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.use('*', servicesMiddleware);

  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/conversations', conversationsRoutes);
  app.route('/internal', webhookRoutes);

  app.get('/ws', requireAuth, async (c) => {
    const userId = c.get('user').id;
    const id = c.env.CONNECTIONS.idFromName(userId);
    const stub = c.env.CONNECTIONS.get(id);
    return stub.fetch(new Request('https://do/connect', c.req.raw));
  });

  app.onError(errorHandler);
  return app;
}
