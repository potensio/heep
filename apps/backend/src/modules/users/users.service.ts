// src/modules/users/users.service.ts
import { NotFoundError } from '../../core/errors';
import {
  type User,
  type UsersRepository,
  type UpdateUserInput,
} from './users.repository';

export interface PublicUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  activeListingCount: number;
}

export interface UsersDeps {
  repo: UsersRepository;
  countActiveListings: (userId: string) => Promise<number>;
}

export function createUsersService({ repo, countActiveListings }: UsersDeps) {
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
      const activeListingCount = await countActiveListings(id);
      return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        activeListingCount,
      };
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
