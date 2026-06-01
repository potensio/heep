// src/modules/auth/auth.repository.test.ts
import { describe, it, expect } from 'vitest';
import { testDb, useTestDb } from '../../core/test/db';
import { createAuthRepository } from './auth.repository';
import { createUsersRepository } from '../users/users.repository';

useTestDb();

const authRepository = createAuthRepository(testDb);
const usersRepository = createUsersRepository(testDb);

const future = () => new Date(Date.now() + 60_000);

describe('authRepository (integration)', () => {
  it('creates and finds the latest active OTP for an email', async () => {
    await authRepository.createOtp({ email: 'o@example.com', codeHash: 'h1', expiresAt: future() });
    const otp = await authRepository.findActiveOtp('o@example.com');
    expect(otp?.codeHash).toBe('h1');
    expect(otp?.consumedAt).toBeNull();
  });

  it('incrementAttempts and consume mutate the row', async () => {
    await authRepository.createOtp({ email: 'p@example.com', codeHash: 'h2', expiresAt: future() });
    const otp = (await authRepository.findActiveOtp('p@example.com'))!;
    await authRepository.incrementAttempts(otp.id);
    await authRepository.consumeOtp(otp.id);
    expect(await authRepository.findActiveOtp('p@example.com')).toBeNull(); // consumed → not active
  });

  it('refresh tokens: create, find valid by hash, revoke', async () => {
    const user = await usersRepository.create({ email: 'r@example.com' });
    await authRepository.createRefreshToken({ userId: user.id, tokenHash: 'rt-hash', expiresAt: future() });
    const found = await authRepository.findValidRefreshToken('rt-hash');
    expect(found?.userId).toBe(user.id);
    await authRepository.revokeRefreshToken(found!.id);
    expect(await authRepository.findValidRefreshToken('rt-hash')).toBeNull();
  });
});
