// src/modules/users/users.service.test.ts
import { describe, it, expect } from 'vitest';
import { createUsersService } from './users.service';
import type { User, UsersRepository, CreateUserInput, UpdateUserInput } from './users.repository';

const baseUser: User = {
  id: 'u1', bubbleId: 'b1', email: 'a@example.com', name: null,
  avatarUrl: null, gender: null, phone: null, profileCompleted: false,
  createdAt: new Date(), updatedAt: new Date(),
};

function makeBubbleRepo(initial: User[] = []): UsersRepository {
  const store = [...initial];
  return {
    findById: async (id) => store.find((u) => u.id === id) ?? null,
    findByEmail: async (email) => store.find((u) => u.email === email) ?? null,
    findByBubbleId: async (bubbleId) => store.find((u) => u.bubbleId === bubbleId) ?? null,
    create: async (input: CreateUserInput) => {
      const u: User = { ...baseUser, id: `new-${store.length}`, email: input.email, bubbleId: input.bubbleId ?? null, name: input.name ?? null };
      store.push(u); return u;
    },
    update: async (id, patch) => {
      const u = store.find((x) => x.id === id)!;
      Object.assign(u, patch); return u;
    },
  };
}

function makeFakeRepo(): UsersRepository {
  const rows = new Map<string, User>();
  let seq = 0;
  const now = new Date();
  return {
    async findById(id) { return rows.get(id) ?? null; },
    async findByEmail(email) {
      return [...rows.values()].find((u) => u.email === email) ?? null;
    },
    async findByBubbleId(bubbleId) {
      return [...rows.values()].find((u) => u.bubbleId === bubbleId) ?? null;
    },
    async create(input: CreateUserInput) {
      const user: User = {
        id: `id-${++seq}`, email: input.email, name: null, avatarUrl: null, bubbleId: null,
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
    const svc = createUsersService({ repo: makeFakeRepo() });
    const first = await svc.findOrCreateByEmail('x@example.com');
    const second = await svc.findOrCreateByEmail('x@example.com');
    expect(first.id).toBe(second.id);
  });

  it('getById throws NotFound when absent', async () => {
    const svc = createUsersService({ repo: makeFakeRepo() });
    await expect(svc.getById('nope')).rejects.toMatchObject({ status: 404 });
  });

  it('updateProfile sets profileCompleted true when a name is provided', async () => {
    const repo = makeFakeRepo();
    const svc = createUsersService({ repo });
    const u = await svc.findOrCreateByEmail('y@example.com');
    const updated = await svc.updateProfile(u.id, { name: 'Yuni', gender: 'female' });
    expect(updated.name).toBe('Yuni');
    expect(updated.profileCompleted).toBe(true);
  });

  it('getById includes createdAt', async () => {
    const svc = createUsersService({ repo: makeFakeRepo() });
    const u = await svc.findOrCreateByEmail('count@example.com');
    const profile = await svc.getById(u.id);
    expect((profile as any).createdAt).toBeDefined();
  });
});

describe('findOrCreateByBubbleId', () => {
  it('returns existing user by bubbleId', async () => {
    const repo = makeBubbleRepo([baseUser]);
    const svc = createUsersService({ repo });
    const user = await svc.findOrCreateByBubbleId('b1', 'a@example.com');
    expect(user.id).toBe('u1');
  });

  it('links bubbleId to existing user found by email', async () => {
    const existing: User = { ...baseUser, id: 'u2', bubbleId: null, email: 'b@example.com' };
    const repo = makeBubbleRepo([existing]);
    const svc = createUsersService({ repo });
    const user = await svc.findOrCreateByBubbleId('new-bubble', 'b@example.com');
    expect(user.id).toBe('u2');
    expect(user.bubbleId).toBe('new-bubble');
  });

  it('creates a new user when not found by bubbleId or email', async () => {
    const repo = makeBubbleRepo([]);
    const svc = createUsersService({ repo });
    const user = await svc.findOrCreateByBubbleId('brand-new', 'new@example.com', 'Jane Doe');
    expect(user.email).toBe('new@example.com');
    expect(user.bubbleId).toBe('brand-new');
    expect(user.name).toBe('Jane Doe');
  });
});
