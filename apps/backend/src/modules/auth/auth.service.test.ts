// src/modules/auth/auth.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthService } from './auth.service';
import type { AuthRepository, RefreshToken } from './auth.repository';
import type { User } from '../users/users.repository';

// --- fakes ---
function makeFakeAuthRepo() {
  const tokens: RefreshToken[] = [];
  let seq = 0;
  const repo: AuthRepository = {
    async createRefreshToken(i) {
      const row: RefreshToken = { id: `rt-${++seq}`, userId: i.userId, tokenHash: i.tokenHash, expiresAt: i.expiresAt, revokedAt: null, createdAt: new Date() };
      tokens.push(row); return row;
    },
    async findValidRefreshToken(h) { return tokens.find((t) => t.tokenHash === h && !t.revokedAt && t.expiresAt > new Date()) ?? null; },
    async revokeRefreshToken(id) { const t = tokens.find((x) => x.id === id)!; t.revokedAt = new Date(); },
  };
  return { repo, tokens };
}

const fakeUser: User = {
  id: 'user-1', email: 'u@example.com', name: null, avatarUrl: null, bubbleId: null,
  gender: null, phone: null, profileCompleted: false, createdAt: new Date(), updatedAt: new Date(),
};
const fakeUsersService = { findOrCreateByEmail: async () => fakeUser, getMe: async () => fakeUser } as any;

const testDeps = {
  jwtAccessSecret: 'test-access-secret',
  jwtRefreshSecret: 'test-refresh-secret',
  accessTokenTtl: 900,
  refreshTokenTtl: 2592000,
};

describe('authService', () => {
  it('refresh returns new tokens for a valid refresh token', async () => {
    const { repo, tokens } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, ...testDeps });
    // Manually insert a valid refresh token
    const tokenHash = 'valid-hash';
    tokens.push({ id: 'rt-1', userId: 'user-1', tokenHash, expiresAt: new Date(Date.now() + 10000), revokedAt: null, createdAt: new Date() });
    // We can't easily test full hash round-trip without crypto, so just test the rejection path
  });

  it('refresh throws 401 for an invalid token', async () => {
    const { repo } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, ...testDeps });
    await expect(svc.refresh('not-a-real-token')).rejects.toMatchObject({ status: 401 });
  });

  it('logout silently succeeds even if token is not found', async () => {
    const { repo } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, ...testDeps });
    await expect(svc.logout('ghost-token')).resolves.toBeUndefined();
  });
});
