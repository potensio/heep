import type { Context, Next } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { createDb } from '../db/client';
import { emailService } from '../email';
import { createAuthRepository } from '../../modules/auth/auth.repository';
import { createUsersRepository } from '../../modules/users/users.repository';
import { createProductsRepository } from '../../modules/products/products.repository';
import { createSavedProductsRepository } from '../../modules/saved-products/saved-products.repository';
import { createAuthService } from '../../modules/auth/auth.service';
import { createUsersService } from '../../modules/users/users.service';
import { createProductsService } from '../../modules/products/products.service';
import { createSavedProductsService } from '../../modules/saved-products/saved-products.service';
import { createChatRepository } from '../../modules/chat/chat.repository';
import { createChatService } from '../../modules/chat/chat.service';
import { FakeStorageService } from '../storage';

export async function servicesMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const db = createDb(c.env.DATABASE_URL);
  const authRepo = createAuthRepository(db);
  const usersRepo = createUsersRepository(db);
  const productsRepo = createProductsRepository(db);
  const savedProductsRepo = createSavedProductsRepository(db);

  const usersService = createUsersService({
    repo: usersRepo,
    countActiveListings: (userId) => productsRepo.countForSeller(userId),
  });

  const authService = createAuthService({
    authRepo,
    usersService,
    email: emailService,
    jwtAccessSecret: c.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: c.env.JWT_REFRESH_SECRET,
    accessTokenTtl: Number(c.env.ACCESS_TOKEN_TTL),
    refreshTokenTtl: Number(c.env.REFRESH_TOKEN_TTL),
    otpTtl: Number(c.env.OTP_TTL),
    otpMaxAttempts: Number(c.env.OTP_MAX_ATTEMPTS),
  });

  const storage = new FakeStorageService();

  const productsService = createProductsService({ repo: productsRepo, storage });
  const savedProductsService = createSavedProductsService({ repo: savedProductsRepo });
  const chatRepo = createChatRepository(db);
  const chatService = createChatService({ chatRepo });

  c.set('db', db);
  c.set('authService', authService);
  c.set('usersService', usersService);
  c.set('productsService', productsService);
  c.set('savedProductsService', savedProductsService);
  c.set('chatService', chatService);
  await next();
}
