// src/types/hono.ts
import type { Database } from '../core/db/client';
import type { AuthService } from '../modules/auth/auth.service';
import type { UsersService } from '../modules/users/users.service';
import type { ProductsService } from '../modules/products/products.service';
import type { SavedProductsService } from '../modules/saved-products/saved-products.service';

export interface AuthUser {
  id: string;
}

export interface AppVariables {
  user: AuthUser;
  db: Database;
  authService: AuthService;
  usersService: UsersService;
  productsService: ProductsService;
  savedProductsService: SavedProductsService;
}
