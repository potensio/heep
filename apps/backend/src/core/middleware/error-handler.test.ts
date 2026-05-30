import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { errorHandler } from './error-handler';
import { NotFoundError } from '../errors';

function appThatThrows(err: unknown) {
  const app = new Hono();
  app.get('/boom', () => {
    throw err;
  });
  app.onError(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('maps AppError to its status and code', async () => {
    const res = await appThatThrows(new NotFoundError('No product')).request('/boom');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'No product' } });
  });

  it('maps unknown errors to 500 with a generic message', async () => {
    const res = await appThatThrows(new Error('db exploded')).request('/boom');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: { code: 'INTERNAL', message: 'Internal server error' },
    });
  });
});
