import { generateRefreshToken, hashRefreshToken } from '../../core/crypto';
import { sign } from 'hono/jwt';
import { type UsersService } from '../users/users.service';
import { type AuthRepository } from './auth.repository';
import { UnauthorizedError } from '../../core/errors';

export interface AuthDeps {
  authRepo: AuthRepository;
  usersService: UsersService;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: number;
  refreshTokenTtl: number;
}

export function createAuthService(deps: AuthDeps) {
  const { authRepo, usersService, jwtAccessSecret, accessTokenTtl, refreshTokenTtl } = deps;

  function nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  async function signAccessToken(userId: string): Promise<string> {
    return sign({ sub: userId, type: 'access', exp: nowSeconds() + accessTokenTtl }, jwtAccessSecret, 'HS256');
  }

  async function issueTokens(user: import('../users/users.repository').User) {
    const accessToken = await signAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    await authRepo.createRefreshToken({
      userId: user.id,
      tokenHash: await hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTokenTtl * 1000),
    });
    return { accessToken, refreshToken, user };
  }

  return {
    async refresh(refreshToken: string) {
      const existing = await authRepo.findValidRefreshToken(await hashRefreshToken(refreshToken));
      if (!existing) throw new UnauthorizedError('Invalid refresh token');
      await authRepo.revokeRefreshToken(existing.id);
      const user = await usersService.getMe(existing.userId);
      return issueTokens(user);
    },

    async logout(refreshToken: string): Promise<void> {
      const existing = await authRepo.findValidRefreshToken(await hashRefreshToken(refreshToken));
      if (existing) await authRepo.revokeRefreshToken(existing.id);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
