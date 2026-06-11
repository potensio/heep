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
import { conversationsV2Routes } from './modules/conversations/conversations-v2.routes';
import { webhookRoutes } from './modules/internal/webhook.routes';
import { requireAuth } from './core/middleware/auth';
import { verifyAccessToken } from './core/jwt';
import { UnauthorizedError } from './core/errors';

export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

  app.use('*', logger());
  app.use('*', corsMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.use('*', servicesMiddleware);

  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/conversations', conversationsRoutes);
  app.route('/conversations-v2', conversationsV2Routes);
  app.route('/internal', webhookRoutes);

  app.get('/ws', async (c) => {
    const header = c.req.header('Authorization');
    const queryToken = c.req.query('token');
    const raw = header?.startsWith('Bearer ') ? header.slice(7) : queryToken;
    if (!raw) throw new UnauthorizedError('Missing token');
    const payload = await verifyAccessToken(raw, c.env.JWT_ACCESS_SECRET);
    c.set('user', { id: payload.sub, bubble_id: payload.bubble_id ?? null, team_id: payload.team_id ?? null });

    const doName = payload.team_id ?? payload.bubble_id ?? payload.sub;
    const id = c.env.CONNECTIONS.idFromName(doName);
    const stub = c.env.CONNECTIONS.get(id);
    return stub.fetch(new Request('https://do/connect', c.req.raw));
  });

  app.onError(errorHandler);
  return app;
}
