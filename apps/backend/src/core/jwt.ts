import { sign, verify } from 'hono/jwt';
import { env } from './env';
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

export async function signAccessToken(userId: string): Promise<string> {
  const payload: AccessPayload = {
    sub: userId,
    type: 'access',
    exp: nowSeconds() + env.ACCESS_TOKEN_TTL,
  };
  return sign(payload, env.JWT_ACCESS_SECRET, 'HS256');
}

export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  try {
    const payload = (await verify(token, env.JWT_ACCESS_SECRET, 'HS256')) as unknown as AccessPayload;
    if (payload.type !== 'access') throw new Error('wrong token type');
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
