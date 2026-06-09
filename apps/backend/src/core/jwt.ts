import { sign, verify } from 'hono/jwt';
import { UnauthorizedError } from './errors';

export const TEST_ACCESS_SECRET = 'test-access-secret-16chars';

export async function signAccessToken(
  userId: string,
  secret = TEST_ACCESS_SECRET,
  bubbleId?: string | null,
  teamId?: string | null,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 900;
  return sign(
    { sub: userId, bubble_id: bubbleId ?? null, team_id: teamId ?? null, type: 'access', exp },
    secret,
    'HS256',
  );
}

export interface AccessPayload {
  sub: string;
  bubble_id: string | null;
  team_id: string | null;
  type: 'access';
  exp: number;
  [key: string]: unknown;
}

export async function verifyAccessToken(token: string, secret: string): Promise<AccessPayload> {
  try {
    const payload = (await verify(token, secret, 'HS256')) as unknown as AccessPayload;
    if (payload.type !== 'access') throw new Error('wrong token type');
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
