import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthService } from './auth.service';
import type { AuthRepository, RefreshToken } from './auth.repository';
import type { User } from '../users/users.repository';
import type { BubbleClient } from '../../core/bubble/client';
import { UnauthorizedError, ConflictError } from '../../core/errors';

function makeFakeAuthRepo() {
  const tokens: RefreshToken[] = [];
  let seq = 0;
  const repo: AuthRepository = {
    async createRefreshToken(i) {
      const row: RefreshToken = {
        id: `rt-${++seq}`, userId: i.userId, tokenHash: i.tokenHash,
        expiresAt: i.expiresAt, revokedAt: null, createdAt: new Date(),
      };
      tokens.push(row); return row;
    },
    async findValidRefreshToken(h) {
      return tokens.find((t) => t.tokenHash === h && !t.revokedAt && t.expiresAt > new Date()) ?? null;
    },
    async revokeRefreshToken(id) {
      const t = tokens.find((x) => x.id === id)!; t.revokedAt = new Date();
    },
  };
  return { repo, tokens };
}

const fakeUser: User = {
  id: 'user-1', bubbleId: 'bubble-1', email: 'u@example.com', name: 'Test User',
  avatarUrl: null, gender: null, phone: null, profileCompleted: false,
  createdAt: new Date(), updatedAt: new Date(),
};

const fakeUsersService = {
  findOrCreateByBubbleId: vi.fn().mockResolvedValue(fakeUser),
  getMe: vi.fn().mockResolvedValue(fakeUser),
} as any;

const baseDeps = {
  jwtAccessSecret: 'test-access-secret-min-16',
  jwtRefreshSecret: 'test-refresh-secret-xx',
  accessTokenTtl: 900,
  refreshTokenTtl: 2592000,
};

beforeEach(() => vi.clearAllMocks());

describe('authService.login', () => {
  it('returns tokens and user on valid credentials', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn().mockResolvedValue({ user_id: 'bubble-1' }),
      signup: vi.fn(),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    const result = await svc.login('u@example.com', 'password');
    expect(result.user.id).toBe('user-1');
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
    expect(bubbleClient.login).toHaveBeenCalledWith('u@example.com', 'password');
  });

  it('propagates UnauthorizedError on bad credentials', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn().mockRejectedValue(new UnauthorizedError('Invalid email or password')),
      signup: vi.fn(),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    await expect(svc.login('u@example.com', 'wrong')).rejects.toMatchObject({ status: 401 });
  });
});

describe('authService.signup', () => {
  it('returns tokens and user on successful signup', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn(),
      signup: vi.fn().mockResolvedValue({ user_id: 'bubble-new' }),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    const result = await svc.signup('John', 'Doe', 'new@example.com', 'password123');
    expect(result.user.id).toBe('user-1');
    expect(fakeUsersService.findOrCreateByBubbleId).toHaveBeenCalledWith('bubble-new', 'new@example.com', 'John Doe');
  });

  it('propagates ConflictError on duplicate email', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn(),
      signup: vi.fn().mockRejectedValue(new ConflictError('Email already registered')),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    await expect(svc.signup('John', 'Doe', 'existing@example.com', 'password')).rejects.toMatchObject({ status: 409 });
  });
});

describe('authService.refresh', () => {
  it('rotates refresh token', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn().mockResolvedValue({ user_id: 'bubble-1' }),
      signup: vi.fn(),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    const { refreshToken } = await svc.login('u@example.com', 'password');
    const refreshed = await svc.refresh(refreshToken);
    expect(refreshed.refreshToken).not.toBe(refreshToken);
    expect(typeof refreshed.accessToken).toBe('string');
  });

  it('throws 401 on invalid refresh token', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = { login: vi.fn(), signup: vi.fn() };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    await expect(svc.refresh('invalid')).rejects.toMatchObject({ status: 401 });
  });
});
