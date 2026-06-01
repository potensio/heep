import { sign, verify } from 'hono/jwt';
import { UnauthorizedError } from './errors';

export interface AccessPayload {
  sub: string;
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
