// src/modules/users/users.service.test.ts
import { describe, it, expect } from 'vitest';
import { createUsersService } from './users.service';
import type { User, UsersRepository, CreateUserInput, UpdateUserInput } from './users.repository';

function makeFakeRepo(): UsersRepository {
  const rows = new Map<string, User>();
  let seq = 0;
  const now = new Date();
  return {
    async findById(id) { return rows.get(id) ?? null; },
    async findByEmail(email) {
      return [...rows.values()].find((u) => u.email === email) ?? null;
    },
    async create(input: CreateUserInput) {
      const user: User = {
        id: `id-${++seq}`, email: input.email, name: null, avatarUrl: null,
        gender: null, phone: null, profileCompleted: false, createdAt: now, updatedAt: now,
      };
      rows.set(user.id, user);
      return user;
    },
    async update(id, patch: UpdateUserInput) {
      const cur = rows.get(id)!;
      const next = { ...cur, ...patch, updatedAt: new Date() } as User;
      rows.set(id, next);
      return next;
    },
  };
}

describe('usersService', () => {
  it('findOrCreateByEmail creates a user the first time, reuses it after', async () => {
    const svc = createUsersService({ repo: makeFakeRepo(), countActiveListings: async () => 0 });
    const first = await svc.findOrCreateByEmail('x@example.com');
    const second = await svc.findOrCreateByEmail('x@example.com');
    expect(first.id).toBe(second.id);
  });

  it('getById throws NotFound when absent', async () => {
    const svc = createUsersService({ repo: makeFakeRepo(), countActiveListings: async () => 0 });
    await expect(svc.getById('nope')).rejects.toMatchObject({ status: 404 });
  });

  it('updateProfile sets profileCompleted true when a name is provided', async () => {
    const repo = makeFakeRepo();
    const svc = createUsersService({ repo, countActiveListings: async () => 0 });
    const u = await svc.findOrCreateByEmail('y@example.com');
    const updated = await svc.updateProfile(u.id, { name: 'Yuni', gender: 'female' });
    expect(updated.name).toBe('Yuni');
    expect(updated.profileCompleted).toBe(true);
  });

  it('getById includes createdAt and activeListingCount from countActiveListings', async () => {
    const svc = createUsersService({ repo: makeFakeRepo(), countActiveListings: async () => 7 });
    const u = await svc.findOrCreateByEmail('count@example.com');
    const profile = await svc.getById(u.id);
    expect((profile as any).activeListingCount).toBe(7);
    expect((profile as any).createdAt).toBeDefined();
  });
});
