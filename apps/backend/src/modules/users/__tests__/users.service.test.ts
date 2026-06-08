import { describe, it, expect } from 'vitest';
import { createUsersService } from '../users.service';
import type { User, UsersRepository, CreateUserInput, UpdateUserInput } from '../users.repository';

const now = new Date().toISOString();

const baseUser: User = {
  id: 'u1', bubble_id: 'b1', bubble_token: null, email: 'a@example.com', first_name: null, last_name: null,
  avatar_url: null, gender: null, phone: null, profile_completed: false,
  created_at: now, updated_at: now,
};

function makeBubbleRepo(initial: User[] = []): UsersRepository {
  const store = [...initial];
  return {
    findById: async (id) => store.find((u) => u.id === id) ?? null,
    findByEmail: async (email) => store.find((u) => u.email === email) ?? null,
    findByBubbleId: async (bubbleId) => store.find((u) => u.bubble_id === bubbleId) ?? null,
    create: async (input: CreateUserInput) => {
      const u: User = { ...baseUser, id: `new-${store.length}`, email: input.email, bubble_id: input.bubble_id ?? null, bubble_token: null, first_name: input.first_name ?? null, last_name: input.last_name ?? null };
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
  return {
    async findById(id) { return rows.get(id) ?? null; },
    async findByEmail(email) {
      return [...rows.values()].find((u) => u.email === email) ?? null;
    },
    async findByBubbleId(bubbleId) {
      return [...rows.values()].find((u) => u.bubble_id === bubbleId) ?? null;
    },
    async create(input: CreateUserInput) {
      const user: User = {
        id: `id-${++seq}`, email: input.email, first_name: null, last_name: null,
        avatar_url: null, bubble_id: null, bubble_token: null, gender: null, phone: null,
        profile_completed: false, created_at: now, updated_at: now,
      };
      rows.set(user.id, user);
      return user;
    },
    async update(id, patch: UpdateUserInput) {
      const cur = rows.get(id)!;
      const next = { ...cur, ...patch, updated_at: new Date().toISOString() } as User;
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

  it('updateProfile sets profile_completed true when a first_name is provided', async () => {
    const repo = makeFakeRepo();
    const svc = createUsersService({ repo });
    const u = await svc.findOrCreateByEmail('y@example.com');
    const updated = await svc.updateProfile(u.id, { first_name: 'Yuni', gender: 'female' });
    expect(updated.first_name).toBe('Yuni');
    expect(updated.profile_completed).toBe(true);
  });

  it('getById includes createdAt', async () => {
    const svc = createUsersService({ repo: makeFakeRepo() });
    const u = await svc.findOrCreateByEmail('count@example.com');
    const profile = await svc.getById(u.id);
    expect(profile.createdAt).toBeDefined();
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
    const existing: User = { ...baseUser, id: 'u2', bubble_id: null, bubble_token: null, email: 'b@example.com' };
    const repo = makeBubbleRepo([existing]);
    const svc = createUsersService({ repo });
    const user = await svc.findOrCreateByBubbleId('new-bubble', 'b@example.com');
    expect(user.id).toBe('u2');
    expect(user.bubble_id).toBe('new-bubble');
  });

  it('creates a new user when not found by bubbleId or email', async () => {
    const repo = makeBubbleRepo([]);
    const svc = createUsersService({ repo });
    const user = await svc.findOrCreateByBubbleId('brand-new', 'new@example.com', 'Jane', 'Doe');
    expect(user.email).toBe('new@example.com');
    expect(user.bubble_id).toBe('brand-new');
    expect(user.first_name).toBe('Jane');
    expect(user.last_name).toBe('Doe');
  });
});
