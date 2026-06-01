// src/modules/auth/auth.service.ts
// TODO(Task 6): env singleton removed; env values will be injected via deps (see Task 6).
import { randomInt, createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { UnauthorizedError, TooManyAttemptsError } from '../../core/errors';
import { signAccessToken } from '../../core/jwt';
import { emailService, type EmailService } from '../../core/email';
import { usersService as defaultUsersService, type UsersService } from '../users/users.service';
import { authRepository, type AuthRepository } from './auth.repository';
import type { User } from '../users/users.repository';

export interface AuthDeps {
  authRepo: AuthRepository;
  usersService: UsersService;
  email: EmailService;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createAuthService(deps: AuthDeps) {
  const { authRepo, usersService, email } = deps;

  async function issueTokens(user: User): Promise<AuthResult> {
    const accessToken = await signAccessToken(user.id);
    const refreshToken = randomBytes(32).toString('hex');
    await authRepo.createRefreshToken({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000),
    });
    return { accessToken, refreshToken, user };
  }

  return {
    async requestOtp(emailAddr: string): Promise<void> {
      const code = generateOtpCode();
      const codeHash = await bcrypt.hash(code, 10);
      await authRepo.createOtp({
        email: emailAddr,
        codeHash,
        expiresAt: new Date(Date.now() + env.OTP_TTL * 1000),
      });
      await email.sendOtp(emailAddr, code);
      // Always resolves — no account enumeration at the route layer.
    },

    async verifyOtp(emailAddr: string, code: string): Promise<AuthResult> {
      const otp = await authRepo.findActiveOtp(emailAddr);
      if (!otp) throw new UnauthorizedError('Invalid or expired code');
      if (otp.attempts >= env.OTP_MAX_ATTEMPTS) throw new TooManyAttemptsError();

      const ok = await bcrypt.compare(code, otp.codeHash);
      if (!ok) {
        await authRepo.incrementAttempts(otp.id);
        throw new UnauthorizedError('Invalid or expired code');
      }

      await authRepo.consumeOtp(otp.id);
      const user = await usersService.findOrCreateByEmail(emailAddr);
      return issueTokens(user);
    },

    async refresh(refreshToken: string): Promise<AuthResult> {
      const existing = await authRepo.findValidRefreshToken(hashRefreshToken(refreshToken));
      if (!existing) throw new UnauthorizedError('Invalid refresh token');
      await authRepo.revokeRefreshToken(existing.id); // rotation
      const user = await usersService.getMe(existing.userId);
      return issueTokens(user);
    },

    async logout(refreshToken: string): Promise<void> {
      const existing = await authRepo.findValidRefreshToken(hashRefreshToken(refreshToken));
      if (existing) await authRepo.revokeRefreshToken(existing.id);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
export const authService = createAuthService({
  authRepo: authRepository,
  usersService: defaultUsersService,
  email: emailService,
});
