import type { Context, Next } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { verifyAccessToken } from '../jwt';
import { UnauthorizedError } from '../errors';

export async function requireAuth(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Missing bearer token');
  const token = header.slice('Bearer '.length);
  const secret = c.env.JWT_ACCESS_SECRET;
  const payload = await verifyAccessToken(token, secret);
  c.set('user', { id: payload.sub, bubble_id: payload.bubble_id ?? null, team_id: payload.team_id ?? null });
  await next();
}
