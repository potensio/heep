// TODO(Task 6): env singleton removed; JWT secrets and TTL will be injected via deps.
import { sign, verify } from 'hono/jwt';
import { UnauthorizedError } from './errors';

export interface AccessPayload {
  sub: string;
  type: 'access';
  exp: number;
  [key: string]: unknown;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export async function signAccessToken(
  userId: string,
  // TODO(Task 6): accept (secret: string, ttl: number) from injected env
  secret = 'PLACEHOLDER_MUST_INJECT_VIA_ENV', // TODO(Task 6)
  ttl = 900, // TODO(Task 6): use env.ACCESS_TOKEN_TTL
): Promise<string> {
  const payload: AccessPayload = {
    sub: userId,
    type: 'access',
    exp: nowSeconds() + ttl,
  };
  return sign(payload, secret, 'HS256');
}

export async function verifyAccessToken(
  token: string,
  secret = 'PLACEHOLDER_MUST_INJECT_VIA_ENV', // TODO(Task 6)
): Promise<AccessPayload> {
  try {
    const payload = (await verify(token, secret, 'HS256')) as unknown as AccessPayload;
    if (payload.type !== 'access') throw new Error('wrong token type');
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
