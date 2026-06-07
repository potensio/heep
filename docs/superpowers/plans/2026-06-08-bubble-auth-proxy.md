# Bubble.io Auth Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing OTP auth system with an email+password auth flow that proxies credential validation to Bubble.io, then issues Hono-managed JWTs to the mobile app.

**Architecture:** Mobile sends email+password to Hono. Hono calls Bubble.io's custom workflow to verify credentials, then upserts the user into Supabase (via Drizzle), and issues its own JWT. The mobile app only ever talks to Hono — it has no knowledge of Bubble.io.

**Tech Stack:** Hono (Cloudflare Workers), Drizzle ORM, Supabase (Postgres), React Native (Expo Router), MMKV storage, react-hook-form

---

## Prerequisites

Before starting implementation, create the `wf/hono-signup` workflow in Bubble.io (similar to `wf/hono-login`). It must:
- Accept body: `{ email, firstName, lastName, password }`
- Require `Authorization: Bearer` header
- Return `{ status: "success", response: { user_id: "..." } }` on success
- Return HTTP 409 if the email is already registered

---

## File Map

**Backend — created:**
- `apps/backend/src/core/bubble/client.ts` — Bubble.io HTTP client

**Backend — modified:**
- `apps/backend/src/core/db/schema.ts` — add `bubble_id` to users, remove `otp_codes` table
- `apps/backend/src/core/errors.ts` — add `ConflictError`
- `apps/backend/src/core/env.ts` — add `BUBBLE_API_URL`, `BUBBLE_API_KEY`; remove OTP vars
- `apps/backend/src/core/middleware/services.ts` — wire `bubbleClient` into `authService`
- `apps/backend/src/types/env.ts` — same env changes as above
- `apps/backend/src/modules/auth/auth.repository.ts` — remove OTP methods, keep refresh token methods
- `apps/backend/src/modules/auth/auth.service.ts` — replace OTP logic with Bubble proxy
- `apps/backend/src/modules/auth/auth.service.test.ts` — rewrite tests
- `apps/backend/src/modules/auth/auth.validation.ts` — replace OTP schemas with login/signup
- `apps/backend/src/modules/auth/auth.routes.ts` — replace OTP routes with /login and /signup
- `apps/backend/src/modules/auth/auth.routes.test.ts` — rewrite integration tests
- `apps/backend/src/modules/users/users.repository.ts` — add `findByBubbleId`, update `CreateUserInput`
- `apps/backend/src/modules/users/users.service.ts` — add `findOrCreateByBubbleId`
- `apps/backend/wrangler.toml` — remove OTP vars, add `BUBBLE_API_URL`
- `apps/backend/.env.example` — update to reflect new vars

**Mobile — created:**
- `apps/mobile/features/auth/api/auth.api.ts` — fetch wrappers for `/auth/login` and `/auth/signup`
- `apps/mobile/features/auth/store/auth.store.ts` — MMKV-backed token persistence

**Mobile — modified:**
- `apps/mobile/app/auth/login.tsx` — call `loginApi`, store tokens, navigate to tabs
- `apps/mobile/app/auth/signup.tsx` — call `signupApi`, store tokens, navigate to tabs
- `apps/mobile/app/auth/_layout.tsx` — remove otp screen registration
- `apps/mobile/app/_layout.tsx` — auth guard: redirect to /auth if no tokens

**Mobile — deleted:**
- `apps/mobile/app/auth/otp.tsx`

---

## Task 1: Backend — Schema migration

**Files:**
- Modify: `apps/backend/src/core/db/schema.ts`
- Auto-generated: `apps/backend/src/core/db/migrations/`

- [ ] **Step 1: Update schema.ts**

Replace the file content. Remove `otpCodes` table, `otpCodesRelations`, and the `index` import. Add `bubbleId` to `users`:

```typescript
import {
  pgTable, pgEnum, uuid, text, integer, boolean, timestamp, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const genderEnum = pgEnum('gender', ['male', 'female']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  bubbleId: text('bubble_id').unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  gender: genderEnum('gender'),
  profileCompleted: boolean('profile_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('refresh_tokens_user_id_idx').on(t.userId)]);

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));
```

- [ ] **Step 2: Generate migration**

```bash
cd apps/backend
npx drizzle-kit generate
```

Verify the generated SQL in `src/core/db/migrations/` includes:
- `ALTER TABLE users ADD COLUMN bubble_id text UNIQUE;`
- `DROP TABLE otp_codes;` (or equivalent)

- [ ] **Step 3: Apply migration (make sure DATABASE_URL points to Supabase)**

```bash
cd apps/backend
npx drizzle-kit migrate
```

Expected: "migrations applied successfully" with no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/core/db/schema.ts apps/backend/src/core/db/migrations/
git commit -m "feat: add bubble_id to users, remove otp_codes table"
```

---

## Task 2: Backend — Add ConflictError + Bubble.io client

**Files:**
- Modify: `apps/backend/src/core/errors.ts`
- Create: `apps/backend/src/core/bubble/client.ts`

- [ ] **Step 1: Add ConflictError to errors.ts**

Append to the end of `apps/backend/src/core/errors.ts`:

```typescript
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, 'CONFLICT', message);
  }
}
```

- [ ] **Step 2: Create Bubble.io client**

Create `apps/backend/src/core/bubble/client.ts`:

```typescript
import { UnauthorizedError, ConflictError } from '../errors';

export interface BubbleLoginResult {
  user_id: string;
}

export interface BubbleSignupResult {
  user_id: string;
}

export interface BubbleClient {
  login(email: string, password: string): Promise<BubbleLoginResult>;
  signup(firstName: string, lastName: string, email: string, password: string): Promise<BubbleSignupResult>;
}

export function createBubbleClient(apiUrl: string, apiKey: string): BubbleClient {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    async login(email, password) {
      const res = await fetch(`${apiUrl}/api/1.1/wf/hono-login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new UnauthorizedError('Invalid email or password');
      const data = await res.json() as { status: string; response: { user_id: string } };
      if (data.status !== 'success') throw new UnauthorizedError('Invalid email or password');
      return { user_id: data.response.user_id };
    },

    async signup(firstName, lastName, email, password) {
      const res = await fetch(`${apiUrl}/api/1.1/wf/hono-signup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      if (res.status === 409) throw new ConflictError('Email already registered');
      if (!res.ok) throw new Error(`Bubble signup failed: ${res.status}`);
      const data = await res.json() as { status: string; response: { user_id: string } };
      if (data.status !== 'success') throw new Error('Signup failed');
      return { user_id: data.response.user_id };
    },
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/core/errors.ts apps/backend/src/core/bubble/
git commit -m "feat: add ConflictError and Bubble.io HTTP client"
```

---

## Task 3: Backend — Update users repository and service

**Files:**
- Modify: `apps/backend/src/modules/users/users.repository.ts`
- Modify: `apps/backend/src/modules/users/users.service.ts`

- [ ] **Step 1: Write failing test for findOrCreateByBubbleId**

Add to `apps/backend/src/modules/users/users.service.test.ts` (create the file if it doesn't exist):

```typescript
import { describe, it, expect } from 'vitest';
import { createUsersService } from './users.service';
import type { UsersRepository, User } from './users.repository';

const base: User = {
  id: 'u1', bubbleId: 'b1', email: 'a@example.com', name: null,
  avatarUrl: null, gender: null, phone: null, profileCompleted: false,
  createdAt: new Date(), updatedAt: new Date(),
};

function makeFakeRepo(initial: User[] = []): UsersRepository {
  const store = [...initial];
  return {
    findById: async (id) => store.find((u) => u.id === id) ?? null,
    findByEmail: async (email) => store.find((u) => u.email === email) ?? null,
    findByBubbleId: async (bubbleId) => store.find((u) => u.bubbleId === bubbleId) ?? null,
    create: async (input) => {
      const u: User = { ...base, id: `new-${store.length}`, email: input.email, bubbleId: input.bubbleId ?? null, name: input.name ?? null };
      store.push(u); return u;
    },
    update: async (id, patch) => {
      const u = store.find((x) => x.id === id)!;
      Object.assign(u, patch); return u;
    },
  };
}

describe('findOrCreateByBubbleId', () => {
  it('returns existing user by bubbleId', async () => {
    const repo = makeFakeRepo([base]);
    const svc = createUsersService({ repo });
    const user = await svc.findOrCreateByBubbleId('b1', 'a@example.com');
    expect(user.id).toBe('u1');
  });

  it('links bubbleId to existing user found by email', async () => {
    const existing: User = { ...base, id: 'u2', bubbleId: null, email: 'b@example.com' };
    const repo = makeFakeRepo([existing]);
    const svc = createUsersService({ repo });
    const user = await svc.findOrCreateByBubbleId('new-bubble', 'b@example.com');
    expect(user.id).toBe('u2');
    expect(user.bubbleId).toBe('new-bubble');
  });

  it('creates a new user when not found by bubbleId or email', async () => {
    const repo = makeFakeRepo([]);
    const svc = createUsersService({ repo });
    const user = await svc.findOrCreateByBubbleId('brand-new', 'new@example.com', 'Jane Doe');
    expect(user.email).toBe('new@example.com');
    expect(user.bubbleId).toBe('brand-new');
    expect(user.name).toBe('Jane Doe');
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd apps/backend
npm test -- users.service
```

Expected: FAIL — `findByBubbleId is not a function` or similar.

- [ ] **Step 3: Update users.repository.ts**

Replace the file:

```typescript
import { eq } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { users } from '../../core/db/schema';

export type User = typeof users.$inferSelect;

export interface CreateUserInput {
  email: string;
  bubbleId?: string;
  name?: string;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  gender?: 'male' | 'female';
  profileCompleted?: boolean;
  phone?: string;
  bubbleId?: string;
}

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByBubbleId(bubbleId: string): Promise<User | null>;
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

    async findByBubbleId(bubbleId) {
      const [row] = await db.select().from(users).where(eq(users.bubbleId, bubbleId)).limit(1);
      return row ?? null;
    },

    async create(input) {
      const [row] = await db.insert(users).values({
        email: input.email,
        bubbleId: input.bubbleId,
        name: input.name,
      }).returning();
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
```

- [ ] **Step 4: Update users.service.ts — add findOrCreateByBubbleId**

Add the new method inside the returned object of `createUsersService`:

```typescript
async findOrCreateByBubbleId(bubbleId: string, email: string, name?: string): Promise<User> {
  const byBubble = await repo.findByBubbleId(bubbleId);
  if (byBubble) return byBubble;

  const byEmail = await repo.findByEmail(email);
  if (byEmail) return repo.update(byEmail.id, { bubbleId });

  return repo.create({ email, bubbleId, name });
},
```

Full updated file:

```typescript
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
```

- [ ] **Step 5: Run tests**

```bash
cd apps/backend
npm test -- users.service
```

Expected: all 3 new tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/users/
git commit -m "feat: add findByBubbleId and findOrCreateByBubbleId to users"
```

---

## Task 4: Backend — Rewrite auth service

**Files:**
- Modify: `apps/backend/src/modules/auth/auth.service.ts`
- Modify: `apps/backend/src/modules/auth/auth.service.test.ts`

- [ ] **Step 1: Write new auth.service.test.ts**

Replace entire file:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthService } from './auth.service';
import type { AuthRepository, RefreshToken } from './auth.repository';
import type { User } from '../users/users.repository';
import type { BubbleClient } from '../../core/bubble/client';
import { UnauthorizedError, ConflictError } from '../../core/errors';

function makeFakeAuthRepo() {
  const tokens: RefreshToken[] = [];
  let seq = 0;
  const repo: AuthRepository = {
    async createRefreshToken(i) {
      const row: RefreshToken = {
        id: `rt-${++seq}`, userId: i.userId, tokenHash: i.tokenHash,
        expiresAt: i.expiresAt, revokedAt: null, createdAt: new Date(),
      };
      tokens.push(row); return row;
    },
    async findValidRefreshToken(h) {
      return tokens.find((t) => t.tokenHash === h && !t.revokedAt && t.expiresAt > new Date()) ?? null;
    },
    async revokeRefreshToken(id) {
      const t = tokens.find((x) => x.id === id)!; t.revokedAt = new Date();
    },
  };
  return { repo, tokens };
}

const fakeUser: User = {
  id: 'user-1', bubbleId: 'bubble-1', email: 'u@example.com', name: 'Test User',
  avatarUrl: null, gender: null, phone: null, profileCompleted: false,
  createdAt: new Date(), updatedAt: new Date(),
};

const fakeUsersService = {
  findOrCreateByBubbleId: vi.fn().mockResolvedValue(fakeUser),
  getMe: vi.fn().mockResolvedValue(fakeUser),
} as any;

const baseDeps = {
  jwtAccessSecret: 'test-access-secret-min-16',
  jwtRefreshSecret: 'test-refresh-secret-xx',
  accessTokenTtl: 900,
  refreshTokenTtl: 2592000,
};

beforeEach(() => vi.clearAllMocks());

describe('authService.login', () => {
  it('returns tokens and user on valid credentials', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn().mockResolvedValue({ user_id: 'bubble-1' }),
      signup: vi.fn(),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    const result = await svc.login('u@example.com', 'password');
    expect(result.user.id).toBe('user-1');
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
    expect(bubbleClient.login).toHaveBeenCalledWith('u@example.com', 'password');
  });

  it('propagates UnauthorizedError on bad credentials', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn().mockRejectedValue(new UnauthorizedError('Invalid email or password')),
      signup: vi.fn(),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    await expect(svc.login('u@example.com', 'wrong')).rejects.toMatchObject({ status: 401 });
  });
});

describe('authService.signup', () => {
  it('returns tokens and user on successful signup', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn(),
      signup: vi.fn().mockResolvedValue({ user_id: 'bubble-new' }),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    const result = await svc.signup('John', 'Doe', 'new@example.com', 'password123');
    expect(result.user.id).toBe('user-1');
    expect(fakeUsersService.findOrCreateByBubbleId).toHaveBeenCalledWith('bubble-new', 'new@example.com', 'John Doe');
  });

  it('propagates ConflictError on duplicate email', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn(),
      signup: vi.fn().mockRejectedValue(new ConflictError('Email already registered')),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    await expect(svc.signup('John', 'Doe', 'existing@example.com', 'password')).rejects.toMatchObject({ status: 409 });
  });
});

describe('authService.refresh', () => {
  it('rotates refresh token', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = {
      login: vi.fn().mockResolvedValue({ user_id: 'bubble-1' }),
      signup: vi.fn(),
    };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    const { refreshToken } = await svc.login('u@example.com', 'password');
    const refreshed = await svc.refresh(refreshToken);
    expect(refreshed.refreshToken).not.toBe(refreshToken);
    expect(typeof refreshed.accessToken).toBe('string');
  });

  it('throws 401 on invalid refresh token', async () => {
    const { repo } = makeFakeAuthRepo();
    const bubbleClient: BubbleClient = { login: vi.fn(), signup: vi.fn() };
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, bubbleClient, ...baseDeps });
    await expect(svc.refresh('invalid')).rejects.toMatchObject({ status: 401 });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd apps/backend
npm test -- auth.service
```

Expected: FAIL — methods like `login` and `signup` don't exist on the service.

- [ ] **Step 3: Rewrite auth.service.ts**

Replace entire file:

```typescript
import { generateRefreshToken, hashRefreshToken } from '../../core/crypto';
import { sign } from 'hono/jwt';
import { UnauthorizedError } from '../../core/errors';
import type { UsersService } from '../users/users.service';
import type { AuthRepository } from './auth.repository';
import type { BubbleClient } from '../../core/bubble/client';
import type { User } from '../users/users.repository';

export interface AuthDeps {
  authRepo: AuthRepository;
  usersService: UsersService;
  bubbleClient: BubbleClient;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: number;
  refreshTokenTtl: number;
}

export function createAuthService(deps: AuthDeps) {
  const { authRepo, usersService, bubbleClient, jwtAccessSecret, accessTokenTtl, refreshTokenTtl } = deps;

  function nowSeconds() {
    return Math.floor(Date.now() / 1000);
  }

  async function signAccessToken(userId: string): Promise<string> {
    return sign({ sub: userId, type: 'access', exp: nowSeconds() + accessTokenTtl }, jwtAccessSecret, 'HS256');
  }

  async function issueTokens(user: User) {
    const accessToken = await signAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    await authRepo.createRefreshToken({
      userId: user.id,
      tokenHash: await hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTokenTtl * 1000),
    });
    return { accessToken, refreshToken, user };
  }

  return {
    async login(email: string, password: string) {
      const { user_id } = await bubbleClient.login(email, password);
      const user = await usersService.findOrCreateByBubbleId(user_id, email);
      return issueTokens(user);
    },

    async signup(firstName: string, lastName: string, email: string, password: string) {
      const { user_id } = await bubbleClient.signup(firstName, lastName, email, password);
      const user = await usersService.findOrCreateByBubbleId(user_id, email, `${firstName} ${lastName}`);
      return issueTokens(user);
    },

    async refresh(refreshToken: string) {
      const existing = await authRepo.findValidRefreshToken(await hashRefreshToken(refreshToken));
      if (!existing) throw new UnauthorizedError('Invalid refresh token');
      await authRepo.revokeRefreshToken(existing.id);
      const user = await usersService.getMe(existing.userId);
      return issueTokens(user);
    },

    async logout(refreshToken: string): Promise<void> {
      const existing = await authRepo.findValidRefreshToken(await hashRefreshToken(refreshToken));
      if (existing) await authRepo.revokeRefreshToken(existing.id);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
```

- [ ] **Step 4: Run tests**

```bash
cd apps/backend
npm test -- auth.service
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/auth/auth.service.ts apps/backend/src/modules/auth/auth.service.test.ts
git commit -m "feat: replace OTP auth service with Bubble.io proxy"
```

---

## Task 5: Backend — Rewrite auth routes and validation

**Files:**
- Modify: `apps/backend/src/modules/auth/auth.validation.ts`
- Modify: `apps/backend/src/modules/auth/auth.routes.ts`
- Modify: `apps/backend/src/modules/auth/auth.routes.test.ts`

- [ ] **Step 1: Write new auth.routes.test.ts**

Replace entire file:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';

useTestDb();

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const testEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: 'test-access-secret-16chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-16ch',
  ACCESS_TOKEN_TTL: '900',
  REFRESH_TOKEN_TTL: '2592000',
  WEB_ORIGIN: 'http://localhost:5173',
  BUBBLE_API_URL: 'https://app.heep.ai/version-test',
  BUBBLE_API_KEY: 'test-bubble-key',
};

function stubBubbleLoginOk(userId = 'bubble-123') {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ status: 'success', response: { token: 'tok', user_id: userId, expires: 31536000 } }),
  });
}

function stubBubbleLoginFail() {
  mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
}

async function json(res: Response) { return res.json() as Promise<any>; }

describe('POST /auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns tokens and user on valid credentials', async () => {
    stubBubbleLoginOk();
    const res = await createApp().request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@example.com', password: 'password123' }),
    }, testEnv);
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    expect(body.user.email).toBe('login@example.com');
  });

  it('returns 401 on bad credentials', async () => {
    stubBubbleLoginFail();
    const res = await createApp().request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'login@example.com', password: 'wrong' }),
    }, testEnv);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid input', async () => {
    const res = await createApp().request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'pass' }),
    }, testEnv);
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login → POST /auth/refresh', () => {
  beforeEach(() => vi.clearAllMocks());

  it('login then refresh rotates token', async () => {
    stubBubbleLoginOk('bubble-refresh-test');
    const app = createApp();
    const loginRes = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'refresh@example.com', password: 'password123' }),
    }, testEnv);
    const { refreshToken, accessToken } = await json(loginRes);

    const refRes = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, testEnv);
    expect(refRes.status).toBe(200);
    const refreshed = await json(refRes);
    expect(refreshed.refreshToken).not.toBe(refreshToken);
    expect(refreshed.accessToken).not.toBe(accessToken);
  });

  it('reusing a rotated refresh token returns 401', async () => {
    stubBubbleLoginOk('bubble-reuse-test');
    const app = createApp();
    const loginRes = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reuse@example.com', password: 'password123' }),
    }, testEnv);
    const { refreshToken } = await json(loginRes);

    await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, testEnv);

    const reuseRes = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, testEnv);
    expect(reuseRes.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd apps/backend
npm test -- auth.routes
```

Expected: FAIL — routes `/auth/login` and `/auth/signup` don't exist yet.

- [ ] **Step 3: Update auth.validation.ts**

Replace entire file:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
```

- [ ] **Step 4: Update auth.routes.ts**

Replace entire file:

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { loginSchema, signupSchema, refreshSchema } from './auth.validation';

export const authRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const result = await c.get('authService').login(email, password);
  return c.json(result);
});

authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  const { firstName, lastName, email, password } = c.req.valid('json');
  const result = await c.get('authService').signup(firstName, lastName, email, password);
  return c.json(result, 201);
});

authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  const result = await c.get('authService').refresh(refreshToken);
  return c.json(result);
});

authRoutes.post('/logout', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  await c.get('authService').logout(refreshToken);
  return c.json({ ok: true });
});

authRoutes.get('/me', requireAuth, async (c) => {
  const user = await c.get('usersService').getMe(c.get('user').id);
  return c.json(user);
});
```

- [ ] **Step 5: Run tests**

```bash
cd apps/backend
npm test -- auth.routes
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/auth/auth.validation.ts apps/backend/src/modules/auth/auth.routes.ts apps/backend/src/modules/auth/auth.routes.test.ts
git commit -m "feat: replace OTP routes with /auth/login and /auth/signup"
```

---

## Task 6: Backend — Clean up env, repository, and services middleware

**Files:**
- Modify: `apps/backend/src/modules/auth/auth.repository.ts`
- Modify: `apps/backend/src/core/env.ts`
- Modify: `apps/backend/src/types/env.ts`
- Modify: `apps/backend/src/core/middleware/services.ts`
- Modify: `apps/backend/wrangler.toml`
- Modify: `apps/backend/.env.example`

- [ ] **Step 1: Simplify auth.repository.ts (remove OTP)**

Replace entire file:

```typescript
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { refreshTokens } from '../../core/db/schema';

export type RefreshToken = typeof refreshTokens.$inferSelect;

export interface CreateRefreshTokenInput { userId: string; tokenHash: string; expiresAt: Date; }

export interface AuthRepository {
  createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findValidRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(id: string): Promise<void>;
}

export function createAuthRepository(db: Database): AuthRepository {
  return {
    async createRefreshToken(input) {
      const [row] = await db.insert(refreshTokens).values(input).returning();
      return row;
    },
    async findValidRefreshToken(tokenHash) {
      const [row] = await db
        .select().from(refreshTokens)
        .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, new Date())))
        .limit(1);
      return row ?? null;
    },
    async revokeRefreshToken(id) {
      await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, id));
    },
  };
}
```

- [ ] **Step 2: Update src/types/env.ts**

Replace entire file:

```typescript
export interface Env {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL: string;
  REFRESH_TOKEN_TTL: string;
  BUBBLE_API_URL: string;
  BUBBLE_API_KEY: string;
  WEB_ORIGIN: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  R2_PUBLIC_URL?: string;
}
```

- [ ] **Step 3: Update src/core/env.ts**

Replace entire file:

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(2592000),
  BUBBLE_API_URL: z.string().url(),
  BUBBLE_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Heep <noreply@heep.dev>'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

export type ParsedEnv = z.infer<typeof EnvSchema>;

export function parseEnv(raw: Record<string, unknown>): ParsedEnv {
  return EnvSchema.parse(raw);
}
```

- [ ] **Step 4: Update services.ts**

Replace entire file:

```typescript
import type { Context, Next } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { createDb } from '../db/client';
import { createAuthRepository } from '../../modules/auth/auth.repository';
import { createUsersRepository } from '../../modules/users/users.repository';
import { createAuthService } from '../../modules/auth/auth.service';
import { createUsersService } from '../../modules/users/users.service';
import { createBubbleClient } from '../bubble/client';
import { R2StorageService, FakeStorageService } from '../storage';

export async function servicesMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const db = createDb(c.env.DATABASE_URL);
  const authRepo = createAuthRepository(db);
  const usersRepo = createUsersRepository(db);

  const usersService = createUsersService({ repo: usersRepo });
  const bubbleClient = createBubbleClient(c.env.BUBBLE_API_URL, c.env.BUBBLE_API_KEY);

  const authService = createAuthService({
    authRepo,
    usersService,
    bubbleClient,
    jwtAccessSecret: c.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: c.env.JWT_REFRESH_SECRET,
    accessTokenTtl: Number(c.env.ACCESS_TOKEN_TTL),
    refreshTokenTtl: Number(c.env.REFRESH_TOKEN_TTL),
  });

  const hasR2Config =
    c.env.R2_ACCOUNT_ID &&
    c.env.R2_ACCESS_KEY_ID &&
    c.env.R2_SECRET_ACCESS_KEY &&
    c.env.R2_BUCKET_NAME &&
    c.env.R2_PUBLIC_URL;

  const storage = hasR2Config
    ? new R2StorageService({
        R2_ACCOUNT_ID: c.env.R2_ACCOUNT_ID!,
        R2_ACCESS_KEY_ID: c.env.R2_ACCESS_KEY_ID!,
        R2_SECRET_ACCESS_KEY: c.env.R2_SECRET_ACCESS_KEY!,
        R2_BUCKET_NAME: c.env.R2_BUCKET_NAME!,
        R2_PUBLIC_URL: c.env.R2_PUBLIC_URL!,
      })
    : new FakeStorageService();

  c.set('db', db);
  c.set('authService', authService);
  c.set('usersService', usersService);
  await next();
}
```

- [ ] **Step 5: Update wrangler.toml**

Replace `[vars]` section:

```toml
name = "heep-api"
main = "src/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[dev]
ip = "0.0.0.0"

[vars]
ACCESS_TOKEN_TTL = "900"
REFRESH_TOKEN_TTL = "2592000"
EMAIL_FROM = "Heep <noreply@heep.dev>"
WEB_ORIGIN = "http://localhost:5173"
BUBBLE_API_URL = "https://app.heep.ai/version-13djz"
# Secrets (set via `wrangler secret put`): BUBBLE_API_KEY, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, DATABASE_URL
```

- [ ] **Step 6: Update .env.example**

Replace content:

```
NODE_ENV=development
DATABASE_URL=postgres://user:password@host:5432/heep
JWT_ACCESS_SECRET=change-me-to-a-long-random-string-min-16
JWT_REFRESH_SECRET=change-me-to-another-long-random-string
ACCESS_TOKEN_TTL=900
REFRESH_TOKEN_TTL=2592000
BUBBLE_API_URL=https://app.heep.ai/version-13djz
BUBBLE_API_KEY=your_bubble_api_key_here
WEB_ORIGIN=http://localhost:5173

# Cloudflare R2 (optional in development)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=heep-media
R2_PUBLIC_URL=https://media.heep.ai
```

- [ ] **Step 7: Run full test suite**

```bash
cd apps/backend
npm test
```

Expected: all tests PASS with no TypeScript errors.

- [ ] **Step 8: Typecheck**

```bash
cd apps/backend
npm run typecheck
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add apps/backend/src/modules/auth/auth.repository.ts \
        apps/backend/src/core/env.ts \
        apps/backend/src/types/env.ts \
        apps/backend/src/core/middleware/services.ts \
        apps/backend/wrangler.toml \
        apps/backend/.env.example
git commit -m "chore: remove OTP env vars, wire Bubble client into services middleware"
```

---

## Task 7: Mobile — Auth API client and token store

**Files:**
- Create: `apps/mobile/features/auth/api/auth.api.ts`
- Create: `apps/mobile/features/auth/store/auth.store.ts`

- [ ] **Step 1: Create auth.api.ts**

Create `apps/mobile/features/auth/api/auth.api.ts`:

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  phone: string | null;
  profileCompleted: boolean;
  bubbleId: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err.message ?? 'Login failed');
  }
  return res.json();
}

export async function signupApi(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err.message ?? 'Signup failed');
  }
  return res.json();
}
```

- [ ] **Step 2: Create auth.store.ts**

Create `apps/mobile/features/auth/store/auth.store.ts`:

```typescript
import { storage } from '@/lib/storage';
import type { AuthResponse, AuthUser } from '../api/auth.api';

const TOKENS_KEY = 'auth.tokens';
const USER_KEY = 'auth.user';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export function setAuth(response: AuthResponse): void {
  storage.set(TOKENS_KEY, JSON.stringify({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  }));
  storage.set(USER_KEY, JSON.stringify(response.user));
}

export function getTokens(): StoredTokens | null {
  const raw = storage.getString(TOKENS_KEY);
  return raw ? (JSON.parse(raw) as StoredTokens) : null;
}

export function getUser(): AuthUser | null {
  const raw = storage.getString(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function clearAuth(): void {
  storage.delete(TOKENS_KEY);
  storage.delete(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!storage.getString(TOKENS_KEY);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/features/auth/api/ apps/mobile/features/auth/store/
git commit -m "feat: add auth API client and MMKV token store"
```

---

## Task 8: Mobile — Wire login and signup, remove OTP route

**Files:**
- Modify: `apps/mobile/app/auth/login.tsx`
- Modify: `apps/mobile/app/auth/signup.tsx`
- Modify: `apps/mobile/app/auth/_layout.tsx`
- Delete: `apps/mobile/app/auth/otp.tsx`

- [ ] **Step 1: Update login.tsx**

Replace entire file:

```typescript
import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LoginScreen } from '@/features/auth/screens/login-screen';
import { loginApi } from '@/features/auth/api/auth.api';
import { setAuth } from '@/features/auth/store/auth.store';

export default function LoginRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await loginApi(data.email, data.password);
      setAuth(response);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Login failed', e.message ?? 'Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginScreen
      onSubmit={handleSubmit}
      onNavigateToSignup={() => router.push('/auth/signup')}
      isLoading={isLoading}
    />
  );
}
```

- [ ] **Step 2: Update signup.tsx**

Replace entire file:

```typescript
import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SignupScreen } from '@/features/auth/screens/signup-screen';
import { signupApi } from '@/features/auth/api/auth.api';
import { setAuth } from '@/features/auth/store/auth.store';

export default function SignupRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await signupApi(data.firstName, data.lastName, data.email, data.password);
      setAuth(response);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Signup failed', e.message ?? 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SignupScreen
      onSubmit={handleSubmit}
      onNavigateToLogin={() => router.push('/auth/login')}
      isLoading={isLoading}
    />
  );
}
```

- [ ] **Step 3: Update auth/_layout.tsx — remove otp screen**

Replace entire file:

```typescript
import { ImageBackground, View } from 'react-native';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <ImageBackground
      source={require('../../public/auth-image-bg.webp')}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="absolute inset-0 bg-black/30" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </ImageBackground>
  );
}
```

- [ ] **Step 4: Delete otp.tsx**

```bash
rm apps/mobile/app/auth/otp.tsx
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/auth/
git commit -m "feat: wire login/signup to Hono API, remove OTP route"
```

---

## Task 9: Mobile — Auth guard in root layout

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Update _layout.tsx to redirect unauthenticated users**

Replace the `useEffect` that hides the splash screen:

```typescript
import { Stack, router } from "expo-router";
// ... existing imports ...
import { isAuthenticated } from "@/features/auth/store/auth.store";

// Inside RootLayout, replace the existing useEffect:
useEffect(() => {
  if (fontsLoaded) {
    SplashScreen.hideAsync();
    if (!isAuthenticated()) {
      router.replace('/auth');
    }
  }
}, [fontsLoaded]);
```

Full updated file:

```typescript
import { Stack, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { enableScreens } from "react-native-screens";
import {
  DMSans_200ExtraLight,
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@/context/ThemeContext";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { isAuthenticated } from "@/features/auth/store/auth.store";
import "../global.css";

enableScreens();
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "DM-Sans-ExtraLight": DMSans_200ExtraLight,
    "DM-Sans-Light": DMSans_300Light,
    "DM-Sans": DMSans_400Regular,
    "DM-Sans-Medium": DMSans_500Medium,
    "DM-Sans-SemiBold": DMSans_600SemiBold,
    "DM-Sans-Bold": DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      if (!isAuthenticated()) {
        router.replace('/auth');
      }
    }
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <GluestackUIProvider>
            <BottomSheetModalProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="conversation/[id]" />
              </Stack>
            </BottomSheetModalProvider>
          </GluestackUIProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

- [ ] **Step 2: Add BUBBLE_API_KEY to backend .env**

Open `apps/backend/.env` and add:

```
BUBBLE_API_KEY=<your_bubble_api_key>
BUBBLE_API_URL=https://app.heep.ai/version-13djz
```

Remove `OTP_TTL` and `OTP_MAX_ATTEMPTS` lines.

- [ ] **Step 3: Start the Hono backend and test login end-to-end**

```bash
cd apps/backend
npm run dev
```

In a separate terminal, test login with a real Bubble.io user:

```bash
curl -X POST http://localhost:8787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Expected response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "your@email.com", ... }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat: add auth guard — redirect to /auth when no tokens stored"
```

---

## Done

At this point:
- Backend: Hono accepts email+password, proxies to Bubble.io, issues JWT
- Mobile: login/signup routes call Hono, store tokens in MMKV, redirect to tabs
- Unauthenticated users are redirected to `/auth` on app open
- All backend tests pass
- OTP system fully removed
