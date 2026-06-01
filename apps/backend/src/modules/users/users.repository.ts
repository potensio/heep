// src/modules/users/users.repository.ts
import { eq } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { users } from '../../core/db/schema';

export type User = typeof users.$inferSelect;

export interface CreateUserInput {
  email: string;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  gender?: 'male' | 'female';
  profileCompleted?: boolean;
  phone?: string;
}

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, patch: UpdateUserInput): Promise<User>;
}

export function createUsersRepository(db: Database): UsersRepository {
  return {
    async findById(id) {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return row ?? null;
    },

    async findByEmail(email) {
      const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return row ?? null;
    },

    async create(input) {
      const [row] = await db.insert(users).values({ email: input.email }).returning();
      return row;
    },

    async update(id, patch) {
      const [row] = await db
        .update(users)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return row;
    },
  };
}

// Test/dev singleton — lazily instantiated on first use; requires DATABASE_URL to be set.
let _singleton: UsersRepository | undefined;
function getSingleton(): UsersRepository {
  if (!_singleton) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL must be set');
    const { createDb } = require('../../core/db/client') as typeof import('../../core/db/client');
    _singleton = createUsersRepository(createDb(url));
  }
  return _singleton;
}
export const usersRepository: UsersRepository = {
  findById: (...args) => getSingleton().findById(...args),
  findByEmail: (...args) => getSingleton().findByEmail(...args),
  create: (...args) => getSingleton().create(...args),
  update: (...args) => getSingleton().update(...args),
};
