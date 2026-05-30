// src/core/middleware/auth.ts
import type { Context, Next } from 'hono';
import { verifyAccessToken } from '../jwt';
import { UnauthorizedError } from '../errors';
import type { AppVariables } from '../../types/hono';

export async function requireAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token');
  }
  const token = header.slice('Bearer '.length);
  const payload = await verifyAccessToken(token);
  c.set('user', { id: payload.sub });
  await next();
}
