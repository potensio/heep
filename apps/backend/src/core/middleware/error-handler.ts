import type { Context } from 'hono';
import { AppError } from '../errors';

export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status as never);
  }
  console.error('[unhandled]', err);
  return c.json({ error: { code: 'INTERNAL', message: 'Internal server error' } }, 500);
}
