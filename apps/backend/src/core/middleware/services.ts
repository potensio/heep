import type { Context, Next } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { createDb } from '../db/client';
import { createAuthRepository } from '../../modules/auth/auth.repository';
import { createUsersRepository } from '../../modules/users/users.repository';
import { createAuthService } from '../../modules/auth/auth.service';
import { createUsersService } from '../../modules/users/users.service';
import { R2StorageService, FakeStorageService } from '../storage';

export async function servicesMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const db = createDb(c.env.DATABASE_URL);
  const authRepo = createAuthRepository(db);
  const usersRepo = createUsersRepository(db);

  const usersService = createUsersService({
    repo: usersRepo,
  });

  const authService = createAuthService({
    authRepo,
    usersService,
    jwtAccessSecret: c.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: c.env.JWT_REFRESH_SECRET,
    accessTokenTtl: Number(c.env.ACCESS_TOKEN_TTL),
    refreshTokenTtl: Number(c.env.REFRESH_TOKEN_TTL),
  });

  // Use R2StorageService if all R2 env vars are present, otherwise fallback to FakeStorageService
  const hasR2Config =
    c.env.R2_ACCOUNT_ID &&
    c.env.R2_ACCESS_KEY_ID &&
    c.env.R2_SECRET_ACCESS_KEY &&
    c.env.R2_BUCKET_NAME &&
    c.env.R2_PUBLIC_URL;

  const storage = hasR2Config
    ? new R2StorageService({
        R2_ACCOUNT_ID: c.env.R2_ACCOUNT_ID!,
        R2_ACCESS_KEY_ID: c.env.R2_ACCESS_KEY_ID!,
        R2_SECRET_ACCESS_KEY: c.env.R2_SECRET_ACCESS_KEY!,
        R2_BUCKET_NAME: c.env.R2_BUCKET_NAME!,
        R2_PUBLIC_URL: c.env.R2_PUBLIC_URL!,
      })
    : new FakeStorageService();

  c.set('db', db);
  c.set('authService', authService);
  c.set('usersService', usersService);
  await next();
}
