// src/modules/users/users.service.ts
import { NotFoundError } from '../../core/errors';
import {
  usersRepository, type User, type UsersRepository, type UpdateUserInput,
} from './users.repository';

export interface PublicUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

function toPublic(u: User): PublicUser {
  return { id: u.id, name: u.name, avatarUrl: u.avatarUrl };
}

export function createUsersService(repo: UsersRepository) {
  return {
    async findOrCreateByEmail(email: string): Promise<User> {
      return (await repo.findByEmail(email)) ?? (await repo.create({ email }));
    },

    async getMe(id: string): Promise<User> {
      const user = await repo.findById(id);
      if (!user) throw new NotFoundError('User not found');
      return user;
    },

    async getById(id: string): Promise<PublicUser> {
      const user = await repo.findById(id);
      if (!user) throw new NotFoundError('User not found');
      return toPublic(user);
    },

    async updateProfile(id: string, patch: UpdateUserInput): Promise<User> {
      const exists = await repo.findById(id);
      if (!exists) throw new NotFoundError('User not found');
      const profileCompleted = patch.profileCompleted ?? (patch.name != null ? true : undefined);
      return repo.update(id, { ...patch, profileCompleted });
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
export const usersService = createUsersService(usersRepository);
