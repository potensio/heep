import type { Database } from '../core/db/client';
import type { AuthService } from '../modules/auth/auth.service';
import type { UsersService } from '../modules/users/users.service';
import type { ConversationsService } from '../modules/conversations/conversations.service';

export interface AuthUser {
  id: string;
  bubble_id: string | null;
  team_id: string | null;
}

export interface AppVariables {
  user: AuthUser;
  db: Database;
  authService: AuthService;
  usersService: UsersService;
  conversationsService: ConversationsService;
}
