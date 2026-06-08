import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import { verifyAccessToken } from '../jwt';
import { UnauthorizedError } from '../errors';

const SECRET = 'test-secret';

async function makeAccessToken(userId: string, secret = SECRET): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 900;
  return sign({ sub: userId, type: 'access', exp }, secret, 'HS256');
}

describe('jwt', () => {
  it('round-trips a user id through an access token', async () => {
    const token = await makeAccessToken('user-123');
    const payload = await verifyAccessToken(token, SECRET);
    expect(payload.sub).toBe('user-123');
  });

  it('rejects a tampered token', async () => {
    const token = await makeAccessToken('user-123');
    await expect(verifyAccessToken(token + 'x', SECRET)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a malformed token', async () => {
    await expect(verifyAccessToken('not-a-jwt', SECRET)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
