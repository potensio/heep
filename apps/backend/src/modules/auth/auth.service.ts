import { generateOtpCode, hashOtpCode, verifyOtpCode, generateRefreshToken, hashRefreshToken } from '../../core/crypto';
import { sign } from 'hono/jwt';
import { emailService, type EmailService } from '../../core/email';
import { type UsersService } from '../users/users.service';
import { type AuthRepository } from './auth.repository';
import { UnauthorizedError, TooManyAttemptsError } from '../../core/errors';

export interface AuthDeps {
  authRepo: AuthRepository;
  usersService: UsersService;
  email: EmailService;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: number;
  refreshTokenTtl: number;
  otpTtl: number;
  otpMaxAttempts: number;
}

export function createAuthService(deps: AuthDeps) {
  const { authRepo, usersService, email, jwtAccessSecret, accessTokenTtl, refreshTokenTtl, otpTtl, otpMaxAttempts } = deps;

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
    async requestOtp(emailAddr: string): Promise<void> {
      const code = generateOtpCode();
      const codeHash = await hashOtpCode(code);
      await authRepo.createOtp({
        email: emailAddr,
        codeHash,
        expiresAt: new Date(Date.now() + otpTtl * 1000),
      });
      await email.sendOtp(emailAddr, code);
    },

    async verifyOtp(emailAddr: string, code: string) {
      const otp = await authRepo.findActiveOtp(emailAddr);
      if (!otp) throw new UnauthorizedError('Invalid or expired code');
      if (otp.attempts >= otpMaxAttempts) throw new TooManyAttemptsError();
      const ok = await verifyOtpCode(code, otp.codeHash);
      if (!ok) {
        await authRepo.incrementAttempts(otp.id);
        throw new UnauthorizedError('Invalid or expired code');
      }
      await authRepo.consumeOtp(otp.id);
      const user = await usersService.findOrCreateByEmail(emailAddr);
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
