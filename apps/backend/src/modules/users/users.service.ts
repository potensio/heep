import { NotFoundError } from '../../core/errors';
import {
  type User,
  type UsersRepository,
  type UpdateUserInput,
} from './users.repository';

export interface PublicUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
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

    async findOrCreateByBubbleId(bubbleId: string, email: string, firstName?: string, lastName?: string): Promise<User> {
      const byBubble = await repo.findByBubbleId(bubbleId);
      if (byBubble) {
        if (firstName && !byBubble.first_name) {
          return repo.update(byBubble.id, { first_name: firstName, last_name: lastName ?? undefined });
        }
        return byBubble;
      }

      const byEmail = await repo.findByEmail(email);
      if (byEmail) return repo.update(byEmail.id, { bubble_id: bubbleId, first_name: firstName, last_name: lastName ?? undefined });

      return repo.create({ email, bubble_id: bubbleId, first_name: firstName, last_name: lastName });
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
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        phone: user.phone,
        createdAt: user.created_at,
      };
    },

    async updateProfile(id: string, patch: UpdateUserInput): Promise<User> {
      const exists = await repo.findById(id);
      if (!exists) throw new NotFoundError('User not found');
      const profile_completed = patch.profile_completed ?? (patch.first_name != null ? true : undefined);
      return repo.update(id, { ...patch, profile_completed });
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
