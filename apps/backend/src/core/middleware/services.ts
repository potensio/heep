import type { Context, Next } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { createSupabaseClient } from '../supabase/client';
import { createAuthRepository } from '../../modules/auth/auth.repository';
import { createUsersRepository } from '../../modules/users/users.repository';
import { createAuthService } from '../../modules/auth/auth.service';
import { createUsersService } from '../../modules/users/users.service';
import { createBubbleClient } from '../bubble/client';

export async function servicesMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const supabase = createSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const authRepo = createAuthRepository(supabase);
  const usersRepo = createUsersRepository(supabase);

  const usersService = createUsersService({ repo: usersRepo });
  const bubbleClient = createBubbleClient(c.env.BUBBLE_API_URL, c.env.BUBBLE_API_KEY);

  const authService = createAuthService({
    authRepo,
    usersService,
    bubbleClient,
    jwtAccessSecret: c.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: c.env.JWT_REFRESH_SECRET,
    accessTokenTtl: Number(c.env.ACCESS_TOKEN_TTL),
    refreshTokenTtl: Number(c.env.REFRESH_TOKEN_TTL),
  });

  c.set('authService', authService);
  c.set('usersService', usersService);
  await next();
}
