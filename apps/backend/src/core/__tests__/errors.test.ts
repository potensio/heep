import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError, UnauthorizedError, ForbiddenError, TooManyAttemptsError } from '../errors';

describe('errors', () => {
  it('AppError carries status and code', () => {
    const e = new AppError(418, 'TEAPOT', 'I am a teapot');
    expect(e).toBeInstanceOf(Error);
    expect(e.status).toBe(418);
    expect(e.code).toBe('TEAPOT');
    expect(e.message).toBe('I am a teapot');
  });

  it('NotFoundError defaults to 404', () => {
    expect(new NotFoundError().status).toBe(404);
    expect(new NotFoundError().code).toBe('NOT_FOUND');
  });

  it('UnauthorizedError is 401, Forbidden 403, TooManyAttempts 429', () => {
    expect(new UnauthorizedError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
    expect(new TooManyAttemptsError().status).toBe(429);
  });
});
