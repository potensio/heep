// src/types/hono.ts
import type { Database } from '../core/db/client';
import type { AuthService } from '../modules/auth/auth.service';
import type { UsersService } from '../modules/users/users.service';

export interface AuthUser {
  id: string;
}

export interface AppVariables {
  user: AuthUser;
  db: Database;
  authService: AuthService;
  usersService: UsersService;
}
