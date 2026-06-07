import { generateRefreshToken, hashRefreshToken } from '../../core/crypto';
import { sign } from 'hono/jwt';
import { UnauthorizedError } from '../../core/errors';
import type { UsersService } from '../users/users.service';
import type { AuthRepository } from './auth.repository';
import type { BubbleClient } from '../../core/bubble/client';
import type { User } from '../users/users.repository';

export interface AuthDeps {
  authRepo: AuthRepository;
  usersService: UsersService;
  bubbleClient: BubbleClient;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: number;
  refreshTokenTtl: number;
}

export function createAuthService(deps: AuthDeps) {
  const { authRepo, usersService, bubbleClient, jwtAccessSecret, accessTokenTtl, refreshTokenTtl } = deps;

  function nowSeconds() {
    return Math.floor(Date.now() / 1000);
  }

  async function signAccessToken(userId: string): Promise<string> {
    return sign({ sub: userId, type: 'access', exp: nowSeconds() + accessTokenTtl }, jwtAccessSecret, 'HS256');
  }

  async function issueTokens(user: User) {
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
    async login(email: string, password: string) {
      const { user_id } = await bubbleClient.login(email, password);
      const user = await usersService.findOrCreateByBubbleId(user_id, email);
      return issueTokens(user);
    },

    async signup(firstName: string, lastName: string, email: string, password: string) {
      const { user_id } = await bubbleClient.signup(firstName, lastName, email, password);
      const user = await usersService.findOrCreateByBubbleId(user_id, email, `${firstName} ${lastName}`);
      return issueTokens(user);
    },

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
