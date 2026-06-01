// src/modules/auth/auth.repository.ts
import { and, eq, gt, isNull, desc } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { otpCodes, refreshTokens } from '../../core/db/schema';

export type OtpCode = typeof otpCodes.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;

export interface CreateOtpInput { email: string; codeHash: string; expiresAt: Date; }
export interface CreateRefreshTokenInput { userId: string; tokenHash: string; expiresAt: Date; }

export interface AuthRepository {
  createOtp(input: CreateOtpInput): Promise<OtpCode>;
  findActiveOtp(email: string): Promise<OtpCode | null>;
  incrementAttempts(id: string): Promise<void>;
  consumeOtp(id: string): Promise<void>;
  createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findValidRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(id: string): Promise<void>;
}

export function createAuthRepository(db: Database): AuthRepository {
  return {
    async createOtp(input) {
      const [row] = await db.insert(otpCodes).values(input).returning();
      return row;
    },
    async findActiveOtp(email) {
      const [row] = await db
        .select().from(otpCodes)
        .where(and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, new Date())))
        .orderBy(desc(otpCodes.createdAt))
        .limit(1);
      return row ?? null;
    },
    async incrementAttempts(id) {
      const [row] = await db.select({ attempts: otpCodes.attempts }).from(otpCodes).where(eq(otpCodes.id, id)).limit(1);
      await db.update(otpCodes).set({ attempts: (row?.attempts ?? 0) + 1 }).where(eq(otpCodes.id, id));
    },
    async consumeOtp(id) {
      await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, id));
    },
    async createRefreshToken(input) {
      const [row] = await db.insert(refreshTokens).values(input).returning();
      return row;
    },
    async findValidRefreshToken(tokenHash) {
      const [row] = await db
        .select().from(refreshTokens)
        .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, new Date())))
        .limit(1);
      return row ?? null;
    },
    async revokeRefreshToken(id) {
      await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, id));
    },
  };
}
