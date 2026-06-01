// src/modules/auth/auth.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthService } from './auth.service';
import type { AuthRepository, OtpCode, RefreshToken } from './auth.repository';
import type { User } from '../users/users.repository';

// --- fakes ---
function makeFakeAuthRepo() {
  const otps: OtpCode[] = [];
  const tokens: RefreshToken[] = [];
  let seq = 0;
  const repo: AuthRepository = {
    async createOtp(i) {
      const row: OtpCode = { id: `otp-${++seq}`, email: i.email, codeHash: i.codeHash, expiresAt: i.expiresAt, consumedAt: null, attempts: 0, createdAt: new Date() };
      otps.push(row); return row;
    },
    async findActiveOtp(email) {
      return [...otps].reverse().find((o) => o.email === email && !o.consumedAt && o.expiresAt > new Date()) ?? null;
    },
    async incrementAttempts(id) { const o = otps.find((x) => x.id === id)!; o.attempts += 1; },
    async consumeOtp(id) { const o = otps.find((x) => x.id === id)!; o.consumedAt = new Date(); },
    async createRefreshToken(i) {
      const row: RefreshToken = { id: `rt-${++seq}`, userId: i.userId, tokenHash: i.tokenHash, expiresAt: i.expiresAt, revokedAt: null, createdAt: new Date() };
      tokens.push(row); return row;
    },
    async findValidRefreshToken(h) { return tokens.find((t) => t.tokenHash === h && !t.revokedAt && t.expiresAt > new Date()) ?? null; },
    async revokeRefreshToken(id) { const t = tokens.find((x) => x.id === id)!; t.revokedAt = new Date(); },
  };
  return { repo, otps, tokens };
}

const fakeUser: User = {
  id: 'user-1', email: 'u@example.com', name: null, avatarUrl: null,
  gender: null, phone: null, profileCompleted: false, createdAt: new Date(), updatedAt: new Date(),
};
const fakeUsersService = { findOrCreateByEmail: async () => fakeUser, getMe: async () => fakeUser } as any;

let captured: { email: string; code: string }[];
const fakeEmail = { sendOtp: async (email: string, code: string) => { captured.push({ email, code }); } };

describe('authService', () => {
  beforeEach(() => { captured = []; });

  const testDeps = {
    jwtAccessSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    accessTokenTtl: 900,
    refreshTokenTtl: 2592000,
    otpTtl: 300,
    otpMaxAttempts: 5,
  };

  it('requestOtp stores a hashed code and emails the plaintext', async () => {
    const { repo, otps } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, email: fakeEmail, ...testDeps });
    await svc.requestOtp('u@example.com');
    expect(captured).toHaveLength(1);
    expect(captured[0].code).toMatch(/^\d{6}$/);
    expect(otps[0].codeHash).not.toBe(captured[0].code); // stored hashed, not plaintext
  });

  it('verifyOtp returns tokens + user for the correct code', async () => {
    const { repo } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, email: fakeEmail, ...testDeps });
    await svc.requestOtp('u@example.com');
    const result = await svc.verifyOtp('u@example.com', captured[0].code);
    expect(result.user.id).toBe('user-1');
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
  });

  it('verifyOtp rejects a wrong code and increments attempts', async () => {
    const { repo, otps } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, email: fakeEmail, ...testDeps });
    await svc.requestOtp('u@example.com');
    await expect(svc.verifyOtp('u@example.com', '000000')).rejects.toMatchObject({ status: 401 });
    expect(otps[0].attempts).toBe(1);
  });

  it('verifyOtp throws 401 when there is no active code', async () => {
    const { repo } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, email: fakeEmail, ...testDeps });
    await expect(svc.verifyOtp('nobody@example.com', '123456')).rejects.toMatchObject({ status: 401 });
  });
});
