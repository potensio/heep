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

  async function signAccessToken(userId: string, bubbleId: string | null): Promise<string> {
    const now = nowSeconds();
    const jti = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
    return sign({ sub: userId, bubble_id: bubbleId, type: 'access', jti, iat: now, exp: now + accessTokenTtl }, jwtAccessSecret, 'HS256');
  }

  async function issueTokens(user: User) {
    const accessToken = await signAccessToken(user.id, user.bubble_id);
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
      const { user_id, token } = await bubbleClient.login(email, password);
      const profile = await bubbleClient.getProfile(token);
      const user = await usersService.findOrCreateByBubbleId(user_id, email, profile.first_name, profile.last_name);
      const updatedUser = await usersService.updateProfile(user.id, { bubble_token: token });
      return issueTokens(updatedUser);
    },

    async signup(firstName: string, lastName: string, email: string, password: string) {
      const { user_id } = await bubbleClient.signup(firstName, lastName, email, password);
      const user = await usersService.findOrCreateByBubbleId(user_id, email, firstName, lastName);
      return issueTokens(user);
    },

    async refresh(refreshToken: string) {
      const existing = await authRepo.findValidRefreshToken(await hashRefreshToken(refreshToken));
      if (!existing) throw new UnauthorizedError('Invalid refresh token');
      await authRepo.revokeRefreshToken(existing.id);
      const user = await usersService.getMe(existing.user_id);
      return issueTokens(user);
    },

    async logout(refreshToken: string): Promise<void> {
      const existing = await authRepo.findValidRefreshToken(await hashRefreshToken(refreshToken));
      if (existing) await authRepo.revokeRefreshToken(existing.id);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
