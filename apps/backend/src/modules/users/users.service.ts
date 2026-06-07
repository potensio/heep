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
  phone: string | null;
  createdAt: string;
}

export interface UsersDeps {
  repo: UsersRepository;
}

export function createUsersService({ repo }: UsersDeps) {
  return {
    async findOrCreateByEmail(email: string): Promise<User> {
      return (await repo.findByEmail(email)) ?? (await repo.create({ email }));
    },

    async findOrCreateByBubbleId(bubbleId: string, email: string, name?: string): Promise<User> {
      const byBubble = await repo.findByBubbleId(bubbleId);
      if (byBubble) return byBubble;

      const byEmail = await repo.findByEmail(email);
      if (byEmail) return repo.update(byEmail.id, { bubbleId });

      return repo.create({ email, bubbleId, name });
    },

    async getMe(id: string): Promise<User> {
      const user = await repo.findById(id);
      if (!user) throw new NotFoundError('User not found');
      return user;
    },

    async getById(id: string): Promise<PublicUser> {
      const user = await repo.findById(id);
      if (!user) throw new NotFoundError('User not found');
      return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        createdAt: user.createdAt.toISOString(),
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
