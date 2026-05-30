import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken } from './jwt';
import { UnauthorizedError } from './errors';

describe('jwt', () => {
  it('round-trips a user id through an access token', async () => {
    const token = await signAccessToken('user-123');
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe('user-123');
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken('user-123');
    await expect(verifyAccessToken(token + 'x')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a malformed token', async () => {
    await expect(verifyAccessToken('not-a-jwt')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
