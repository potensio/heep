import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { refreshTokens } from '../../core/db/schema';

export type RefreshToken = typeof refreshTokens.$inferSelect;

export interface CreateRefreshTokenInput { userId: string; tokenHash: string; expiresAt: Date; }

export interface AuthRepository {
  createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findValidRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(id: string): Promise<void>;
}

export function createAuthRepository(db: Database): AuthRepository {
  return {
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
