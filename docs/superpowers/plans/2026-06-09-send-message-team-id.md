# Send Message + Team ID Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `team_id` to the auth flow so all team members share one WebSocket DO, and wire `POST /conversations/:id/messages` through Hono → Bubble → real-time push back to mobile.

**Architecture:** `team_id` is extracted from `/hono-me` during login, saved to Supabase, and embedded in the JWT. The ConnectionManager DO is keyed by `team_id` so all team members receive the same real-time push. Sending a message calls `BUBBLE_API_URL/hono-conversations-send` via the admin API key. The mobile client does an optimistic cache update so the message appears instantly, then invalidates on settle for confirmation.

**Tech Stack:** Hono, Cloudflare Workers, Durable Objects, Drizzle ORM, Supabase (PostgreSQL), TanStack Query, Expo / React Native, Vitest

---

## File Map

**Backend — modified:**
- `src/core/db/schema.ts` — add `teamId` column
- `src/modules/users/users.repository.ts` — add `team_id` to `User` + `UpdateUserInput`
- `src/core/jwt.ts` — add `team_id` to `AccessPayload`
- `src/core/middleware/auth.ts` — pass `team_id` from JWT into `user` context
- `src/types/hono.ts` — add `team_id` to `AuthUser`
- `src/core/bubble/client.ts` — add `team_id` to `BubbleProfileResult`, add `sendMessage`
- `src/modules/auth/auth.service.ts` — embed `team_id` in JWT, save on login
- `src/modules/conversations/conversations.service.ts` — add `sendMessage`, add `bubbleClient` dep
- `src/modules/conversations/conversations.validation.ts` — add `sendMessageSchema`
- `src/modules/conversations/conversations.routes.ts` — add `POST /:id/messages`
- `src/core/middleware/services.ts` — pass `bubbleClient` to `createConversationsService`
- `src/app.ts` — key DO by `team_id` in `/ws` route
- `src/modules/internal/webhook.routes.ts` — accept `team_id` instead of `bubble_user_id`

**Backend — modified tests:**
- `src/modules/auth/__tests__/auth.service.test.ts`
- `src/modules/conversations/__tests__/conversations.service.test.ts`
- `src/modules/conversations/__tests__/conversations.routes.test.ts`

**Mobile — modified:**
- `apps/mobile/features/conversations/api/conversations.api.ts` — add `sendMessage`
- `apps/mobile/features/conversations/screens/conversation-detail-screen.tsx` — send button

**Mobile — created:**
- `apps/mobile/features/conversations/hooks/use-send-message.ts`

---

## Task 1: DB migration — add team_id to users

**Files:**
- Modify: `apps/backend/src/core/db/schema.ts`

- [ ] **Step 1: Add teamId to the users table schema**

In `src/core/db/schema.ts`, add `teamId` after `bubbleToken`:

```typescript
import {
  pgTable, pgEnum, uuid, text, boolean, timestamp, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const genderEnum = pgEnum('gender', ['male', 'female']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  bubbleId: text('bubble_id').unique(),
  bubbleToken: text('bubble_token'),
  teamId: text('team_id'),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
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

- [ ] **Step 2: Generate the migration (interactive — run with !)**

```bash
! cd apps/backend && npx drizzle-kit generate
```

When prompted for a migration name, enter: `add_team_id_to_users`

Expected: a new SQL file in `src/core/db/migrations/` containing `ALTER TABLE "users" ADD COLUMN "team_id" text;`

- [ ] **Step 3: Run the migration**

```bash
! cd apps/backend && npx drizzle-kit migrate
```

Expected: `[✓] Migrations applied successfully`

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/core/db/schema.ts apps/backend/src/core/db/migrations/
git commit -m "feat(users): add team_id column to users table"
```

---

## Task 2: User repository — add team_id to types

**Files:**
- Modify: `apps/backend/src/modules/users/users.repository.ts`

- [ ] **Step 1: Add team_id to User interface and UpdateUserInput**

Replace the `User` interface and `UpdateUserInput` interface in `src/modules/users/users.repository.ts`:

```typescript
export interface User {
  id: string;
  bubble_id: string | null;
  bubble_token: string | null;
  team_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  gender: 'male' | 'female' | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  gender?: 'male' | 'female';
  profile_completed?: boolean;
  phone?: string;
  bubble_id?: string;
  bubble_token?: string;
  team_id?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/modules/users/users.repository.ts
git commit -m "feat(users): add team_id to User type and UpdateUserInput"
```

---

## Task 3: JWT types — add team_id to AccessPayload, update AuthUser + requireAuth

**Files:**
- Modify: `apps/backend/src/core/jwt.ts`
- Modify: `apps/backend/src/core/middleware/auth.ts`
- Modify: `apps/backend/src/types/hono.ts`

- [ ] **Step 1: Add team_id to AccessPayload and test helper**

Replace `src/core/jwt.ts` with:

```typescript
import { sign, verify } from 'hono/jwt';
import { UnauthorizedError } from './errors';

export const TEST_ACCESS_SECRET = 'test-access-secret-16chars';

export async function signAccessToken(
  userId: string,
  secret = TEST_ACCESS_SECRET,
  bubbleId?: string | null,
  teamId?: string | null,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 900;
  return sign(
    { sub: userId, bubble_id: bubbleId ?? null, team_id: teamId ?? null, type: 'access', exp },
    secret,
    'HS256',
  );
}

export interface AccessPayload {
  sub: string;
  bubble_id: string | null;
  team_id: string | null;
  type: 'access';
  exp: number;
  [key: string]: unknown;
}

export async function verifyAccessToken(token: string, secret: string): Promise<AccessPayload> {
  try {
    const payload = (await verify(token, secret, 'HS256')) as unknown as AccessPayload;
    if (payload.type !== 'access') throw new Error('wrong token type');
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

- [ ] **Step 2: Add team_id to AuthUser**

Replace `src/types/hono.ts` with:

```typescript
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
```

- [ ] **Step 3: Update requireAuth to set team_id on user**

Replace `src/core/middleware/auth.ts` with:

```typescript
import type { Context, Next } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { verifyAccessToken } from '../jwt';
import { UnauthorizedError } from '../errors';

export async function requireAuth(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Missing bearer token');
  const token = header.slice('Bearer '.length);
  const secret = c.env.JWT_ACCESS_SECRET;
  const payload = await verifyAccessToken(token, secret);
  c.set('user', { id: payload.sub, bubble_id: payload.bubble_id ?? null, team_id: payload.team_id ?? null });
  await next();
}
```

- [ ] **Step 4: Run full test suite to confirm no regressions**

```bash
cd apps/backend && npm test
```

Expected: all pre-existing tests PASS (some route tests set `user` without `team_id` — TypeScript allows extra optional fields at runtime; Vitest will not fail on this)

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/core/jwt.ts apps/backend/src/core/middleware/auth.ts apps/backend/src/types/hono.ts
git commit -m "feat(auth): add team_id to JWT payload, AccessPayload, and AuthUser"
```

---

## Task 4: BubbleClient — team_id on profile + sendMessage method

**Files:**
- Modify: `apps/backend/src/core/bubble/client.ts`

- [ ] **Step 1: Add team_id to BubbleProfileResult, update getProfile, add sendMessage**

Replace `src/core/bubble/client.ts` with:

```typescript
import { UnauthorizedError, ConflictError } from '../errors';

export interface BubbleLoginResult {
  user_id: string;
  token: string;
}

export interface BubbleSignupResult {
  user_id: string;
}

export interface BubbleProfileResult {
  first_name: string;
  last_name: string;
  email: string;
  team_id: string | null;
}

export interface BubbleClient {
  login(email: string, password: string): Promise<BubbleLoginResult>;
  signup(firstName: string, lastName: string, email: string, password: string): Promise<BubbleSignupResult>;
  getProfile(bubbleToken: string): Promise<BubbleProfileResult>;
  sendMessage(conversationId: string, body: string): Promise<void>;
}

export function createBubbleClient(apiUrl: string, apiKey: string): BubbleClient {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    async login(email, password) {
      const res = await fetch(`${apiUrl}/hono-login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new UnauthorizedError('Invalid email or password');
      const data = await res.json() as { status: string; response: { user_id: string; token: string } };
      if (data.status !== 'success') throw new UnauthorizedError('Invalid email or password');
      return { user_id: data.response.user_id, token: data.response.token };
    },

    async signup(firstName, lastName, email, password) {
      const res = await fetch(`${apiUrl}/hono-signup`, {
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

    async getProfile(bubbleToken) {
      const res = await fetch(`${apiUrl}/hono-me`, {
        method: 'POST',
        headers: { ...headers, Authorization: `Bearer ${bubbleToken}` },
      });
      if (!res.ok) throw new Error(`Bubble getProfile failed: ${res.status}`);
      const data = await res.json() as { status: string; response: BubbleProfileResult };
      if (data.status !== 'success') throw new Error('getProfile failed');
      return {
        first_name: data.response.first_name,
        last_name: data.response.last_name,
        email: data.response.email,
        team_id: data.response.team_id ?? null,
      };
    },

    async sendMessage(conversationId, body) {
      const res = await fetch(`${apiUrl}/hono-conversations-send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversation_id: conversationId, body }),
      });
      if (!res.ok) throw new Error(`Bubble sendMessage failed: ${res.status}`);
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/core/bubble/client.ts
git commit -m "feat(bubble): add team_id to profile and sendMessage to BubbleClient"
```

---

## Task 5: Auth service — propagate team_id through login and token signing

**Files:**
- Modify: `apps/backend/src/modules/auth/auth.service.ts`
- Modify: `apps/backend/src/modules/auth/__tests__/auth.service.test.ts`

- [ ] **Step 1: Write a failing test for team_id propagation**

In `src/modules/auth/__tests__/auth.service.test.ts`, update `fakeUser` to include `team_id`, update the `getProfile` mock in the `login` test, and add a new assertion. Find the `authService.login` describe block and update it:

```typescript
// Update fakeUser (near top of file) to add team_id:
const fakeUser: User = {
  id: 'user-1', bubble_id: 'bubble-1', bubble_token: null, team_id: null, email: 'u@example.com',
  first_name: 'Test', last_name: 'User',
  avatar_url: null, gender: null, phone: null, profile_completed: false,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};
```

Then update the `getProfile` mock in the first login test to return `team_id`:

```typescript
getProfile: vi.fn().mockResolvedValue({ first_name: 'Test', last_name: 'User', email: 'u@example.com', team_id: 'team-abc' }),
```

Add a new test inside `describe('authService.login', ...)`:

```typescript
it('saves team_id from profile and embeds it in the access token', async () => {
  const { repo } = makeFakeAuthRepo();
  const updatedUser: User = { ...fakeUser, team_id: 'team-abc' };
  const usersService = {
    findOrCreateByBubbleId: vi.fn().mockResolvedValue(fakeUser),
    getMe: vi.fn().mockResolvedValue(updatedUser),
    updateProfile: vi.fn().mockResolvedValue(updatedUser),
  } as any;
  const bubbleClient: BubbleClient = {
    login: vi.fn().mockResolvedValue({ user_id: 'bubble-1', token: 'bus|fake-token' }),
    signup: vi.fn(),
    getProfile: vi.fn().mockResolvedValue({ first_name: 'Test', last_name: 'User', email: 'u@example.com', team_id: 'team-abc' }),
    sendMessage: vi.fn(),
  };
  const svc = createAuthService({ authRepo: repo, usersService, bubbleClient, ...baseDeps });
  await svc.login('u@example.com', 'password');
  expect(usersService.updateProfile).toHaveBeenCalledWith(
    'user-1',
    expect.objectContaining({ team_id: 'team-abc' }),
  );
});
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
cd apps/backend && npm test -- --reporter=verbose src/modules/auth/__tests__/auth.service.test.ts
```

Expected: FAIL — `updateProfile` is not called with `team_id`

- [ ] **Step 3: Update auth.service.ts to propagate team_id**

Replace `src/modules/auth/auth.service.ts` with:

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

  async function signAccessToken(userId: string, bubbleId: string | null, teamId: string | null): Promise<string> {
    const now = nowSeconds();
    const jti = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
    return sign(
      { sub: userId, bubble_id: bubbleId, team_id: teamId, type: 'access', jti, iat: now, exp: now + accessTokenTtl },
      jwtAccessSecret,
      'HS256',
    );
  }

  async function issueTokens(user: User) {
    const accessToken = await signAccessToken(user.id, user.bubble_id, user.team_id ?? null);
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
      const { user_id, token } = await bubbleClient.login(email, password);
      const profile = await bubbleClient.getProfile(token);
      const user = await usersService.findOrCreateByBubbleId(user_id, email, profile.first_name, profile.last_name);
      const updatedUser = await usersService.updateProfile(user.id, {
        bubble_token: token,
        team_id: profile.team_id ?? undefined,
      });
      return issueTokens(updatedUser);
    },

    async signup(firstName: string, lastName: string, email: string, password: string) {
      const { user_id } = await bubbleClient.signup(firstName, lastName, email, password);
      const user = await usersService.findOrCreateByBubbleId(user_id, email, firstName, lastName);
      return issueTokens(user);
    },

    async refresh(refreshToken: string) {
      const existing = await authRepo.findValidRefreshToken(await hashRefreshToken(refreshToken));
      if (!existing) throw new UnauthorizedError('Invalid refresh token');
      await authRepo.revokeRefreshToken(existing.id);
      const user = await usersService.getMe(existing.user_id);
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

- [ ] **Step 4: Update existing auth service tests — add sendMessage to BubbleClient mocks**

In the existing test file, every `BubbleClient` object literal needs `sendMessage: vi.fn()` added. Find all occurrences of `BubbleClient` object literals and add the field:

```typescript
// Every BubbleClient mock in the file should look like:
const bubbleClient: BubbleClient = {
  login: vi.fn().mockResolvedValue({ user_id: 'bubble-1', token: 'bus|fake-token' }),
  signup: vi.fn(),
  getProfile: vi.fn().mockResolvedValue({ first_name: 'Test', last_name: 'User', email: 'u@example.com', team_id: null }),
  sendMessage: vi.fn(),
};
```

- [ ] **Step 5: Run the tests — confirm they pass**

```bash
cd apps/backend && npm test -- --reporter=verbose src/modules/auth/__tests__/auth.service.test.ts
```

Expected: all tests PASS including the new `team_id` test

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/auth/auth.service.ts apps/backend/src/modules/auth/__tests__/auth.service.test.ts
git commit -m "feat(auth): embed team_id in JWT and save to user on login"
```

---

## Task 6: ConversationsService — add sendMessage

**Files:**
- Modify: `apps/backend/src/modules/conversations/conversations.service.ts`
- Modify: `apps/backend/src/modules/conversations/__tests__/conversations.service.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/modules/conversations/__tests__/conversations.service.test.ts`, update `mockUser` to include `team_id`, update `makeService` to include a `bubbleClient` mock, and add the `sendMessage` test:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createConversationsService } from '../conversations.service';
import type { BubbleDataClient } from '../../../core/bubble/data-client';
import type { BubbleClient } from '../../../core/bubble/client';
import type { UsersService } from '../../users/users.service';

const mockUser = {
  id: 'user-1',
  bubble_id: 'bubble-abc',
  bubble_token: 'tok-xyz',
  team_id: 'team-abc',
  email: 'test@test.com',
  first_name: 'Test',
  last_name: 'User',
  avatar_url: null,
  phone: null,
  gender: null as null,
  profile_completed: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockConversation = {
  id: 'conv-1',
  contact: { name: 'Mathis Vella', avatar_url: null },
  channel: 'whatsapp' as const,
  property: { id: 'prop-1', name: 'Villa Sunset' },
  last_message: { text: 'Hey there', sent_at: '2025-07-07T10:00:00Z' },
};

const mockPaginatedConversations = {
  data: [mockConversation],
  pagination: { cursor: null, has_more: false },
};

const mockMessage = {
  id: 'msg-1',
  text: 'Hello',
  sender: 'them' as const,
  sent_at: '2025-07-07T10:00:00Z',
};

const mockPaginatedMessages = {
  data: [mockMessage],
  pagination: { cursor: null, has_more: false },
};

describe('conversationsService', () => {
  const makeService = () => {
    const bubbleDataClient: BubbleDataClient = {
      getConversations: vi.fn().mockResolvedValue(mockPaginatedConversations),
      getMessages: vi.fn().mockResolvedValue(mockPaginatedMessages),
    };
    const bubbleClient = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as BubbleClient;
    const usersService = {
      getMe: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UsersService;
    return {
      service: createConversationsService({ bubbleDataClient, bubbleClient, usersService }),
      bubbleDataClient,
      bubbleClient,
      usersService,
    };
  };

  it('getConversations calls Bubble with users bubble_token', async () => {
    const { service, bubbleDataClient } = makeService();
    const result = await service.getConversations('user-1', { limit: 20 });
    expect(bubbleDataClient.getConversations).toHaveBeenCalledWith(
      expect.objectContaining({ bubbleToken: 'tok-xyz', limit: 20 }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('conv-1');
  });

  it('getConversations throws if user has no bubble_token', async () => {
    const { service, usersService } = makeService();
    (usersService.getMe as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ...mockUser, bubble_token: null });
    await expect(service.getConversations('user-1', { limit: 20 })).rejects.toThrow('User has no Bubble token — please log in again');
  });

  it('sendMessage calls bubbleClient.sendMessage with conversationId and body', async () => {
    const { service, bubbleClient } = makeService();
    await service.sendMessage('conv-1', 'Hello!');
    expect(bubbleClient.sendMessage).toHaveBeenCalledWith('conv-1', 'Hello!');
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
cd apps/backend && npm test -- --reporter=verbose src/modules/conversations/__tests__/conversations.service.test.ts
```

Expected: FAIL — `createConversationsService` does not accept `bubbleClient` / `service.sendMessage is not a function`

- [ ] **Step 3: Update conversations.service.ts**

Replace `src/modules/conversations/conversations.service.ts` with:

```typescript
import type { BubbleDataClient, PaginatedResult, BubbleConversation } from '../../core/bubble/data-client';
import type { BubbleClient } from '../../core/bubble/client';
import type { UsersService } from '../users/users.service';

export interface ConversationsServiceDeps {
  bubbleDataClient: BubbleDataClient;
  bubbleClient: BubbleClient;
  usersService: UsersService;
}

export interface GetConversationsQuery {
  cursor?: number;
  limit?: number;
  messagesLimit?: number;
}

export function createConversationsService({ bubbleDataClient, bubbleClient, usersService }: ConversationsServiceDeps) {
  return {
    async getConversations(
      userId: string,
      query: GetConversationsQuery,
    ): Promise<PaginatedResult<BubbleConversation>> {
      const user = await usersService.getMe(userId);
      if (!user.bubble_token) throw new Error('User has no Bubble token — please log in again');
      return bubbleDataClient.getConversations({
        bubbleToken: user.bubble_token,
        cursor: query.cursor,
        limit: query.limit ?? 20,
        messagesLimit: query.messagesLimit ?? 20,
      });
    },

    async sendMessage(conversationId: string, body: string): Promise<void> {
      await bubbleClient.sendMessage(conversationId, body);
    },
  };
}

export type ConversationsService = ReturnType<typeof createConversationsService>;
```

- [ ] **Step 4: Run the test — confirm it passes**

```bash
cd apps/backend && npm test -- --reporter=verbose src/modules/conversations/__tests__/conversations.service.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/conversations/conversations.service.ts apps/backend/src/modules/conversations/__tests__/conversations.service.test.ts
git commit -m "feat(conversations): add sendMessage to ConversationsService"
```

---

## Task 7: Services middleware — wire bubbleClient into ConversationsService

**Files:**
- Modify: `apps/backend/src/core/middleware/services.ts`

- [ ] **Step 1: Pass bubbleClient to createConversationsService**

In `src/core/middleware/services.ts`, find the line:
```typescript
const conversationsService = createConversationsService({ bubbleDataClient, usersService });
```

Replace it with:
```typescript
const conversationsService = createConversationsService({ bubbleDataClient, bubbleClient, usersService });
```

- [ ] **Step 2: Run full test suite**

```bash
cd apps/backend && npm test
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/core/middleware/services.ts
git commit -m "feat(conversations): wire bubbleClient into ConversationsService middleware"
```

---

## Task 8: Conversations route — POST /conversations/:id/messages

**Files:**
- Modify: `apps/backend/src/modules/conversations/conversations.validation.ts`
- Modify: `apps/backend/src/modules/conversations/conversations.routes.ts`
- Modify: `apps/backend/src/modules/conversations/__tests__/conversations.routes.test.ts`

- [ ] **Step 1: Add sendMessageSchema to validation**

Replace `src/modules/conversations/conversations.validation.ts` with:

```typescript
import { z } from 'zod';

export const listConversationsSchema = z.object({
  cursor: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  messages_limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(10000),
});
```

- [ ] **Step 2: Write the failing route test**

In `src/modules/conversations/__tests__/conversations.routes.test.ts`, update the `makeApp` mock to include `sendMessage`, and update the `user` mock to include `team_id`, then add the POST test:

```typescript
import { vi, describe, it, expect } from 'vitest';

vi.mock('../../../core/middleware/auth', () => ({
  requireAuth: async (_c: any, next: any) => next(),
}));

import { Hono } from 'hono';
import { conversationsRoutes } from '../conversations.routes';
import type { AppVariables } from '../../../types/hono';
import type { Env } from '../../../types/env';

const mockPaginated = {
  data: [{ id: 'conv-1', contact: { name: 'Test', avatar_url: null }, channel: 'whatsapp', property: { id: 'p-1', name: 'Villa' }, last_message: { text: 'Hi', sent_at: '2025-01-01T00:00:00Z' } }],
  pagination: { cursor: null, has_more: false },
};

const makeApp = () => {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();
  app.use('*', async (c, next) => {
    c.set('user', { id: 'user-1', bubble_id: null, team_id: null });
    c.set('conversationsService', {
      getConversations: vi.fn().mockResolvedValue(mockPaginated),
      sendMessage: vi.fn().mockResolvedValue(undefined),
    } as any);
    await next();
  });
  app.route('/conversations', conversationsRoutes);
  return app;
};

describe('GET /conversations', () => {
  it('returns 200 with paginated data', async () => {
    const res = await makeApp().request('/conversations');
    expect(res.status).toBe(200);
    const body = await res.json() as typeof mockPaginated;
    expect(body.data).toHaveLength(1);
    expect(body.pagination.has_more).toBe(false);
  });

  it('returns 200 with query params forwarded', async () => {
    const res = await makeApp().request('/conversations?limit=10');
    expect(res.status).toBe(200);
  });
});

describe('POST /conversations/:id/messages', () => {
  it('returns 204 on valid body', async () => {
    const res = await makeApp().request('/conversations/conv-1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'Hello!' }),
    });
    expect(res.status).toBe(204);
  });

  it('returns 400 when body is missing', async () => {
    const res = await makeApp().request('/conversations/conv-1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is empty string', async () => {
    const res = await makeApp().request('/conversations/conv-1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: '' }),
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run the tests — confirm they fail**

```bash
cd apps/backend && npm test -- --reporter=verbose src/modules/conversations/__tests__/conversations.routes.test.ts
```

Expected: FAIL — POST route does not exist

- [ ] **Step 4: Add the POST route**

Replace `src/modules/conversations/conversations.routes.ts` with:

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { listConversationsSchema, sendMessageSchema } from './conversations.validation';

export const conversationsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

conversationsRoutes.get('/', requireAuth, zValidator('query', listConversationsSchema), async (c) => {
  const { cursor, limit, messages_limit } = c.req.valid('query');
  const result = await c.get('conversationsService').getConversations(c.get('user').id, {
    cursor,
    limit,
    messagesLimit: messages_limit,
  });
  return c.json(result);
});

conversationsRoutes.post('/:id/messages', requireAuth, zValidator('json', sendMessageSchema), async (c) => {
  const conversationId = c.req.param('id');
  const { body } = c.req.valid('json');
  await c.get('conversationsService').sendMessage(conversationId, body);
  return c.body(null, 204);
});
```

- [ ] **Step 5: Run the tests — confirm they pass**

```bash
cd apps/backend && npm test -- --reporter=verbose src/modules/conversations/__tests__/conversations.routes.test.ts
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/conversations/
git commit -m "feat(conversations): add POST /conversations/:id/messages endpoint"
```

---

## Task 9: Update /ws route and webhook to use team_id

**Files:**
- Modify: `apps/backend/src/app.ts`
- Modify: `apps/backend/src/modules/internal/webhook.routes.ts`

- [ ] **Step 1: Update /ws to key DO by team_id**

In `src/app.ts`, find the `/ws` handler and replace it:

```typescript
app.get('/ws', async (c) => {
  const header = c.req.header('Authorization');
  const queryToken = c.req.query('token');
  const raw = header?.startsWith('Bearer ') ? header.slice(7) : queryToken;
  if (!raw) throw new UnauthorizedError('Missing token');
  const payload = await verifyAccessToken(raw, c.env.JWT_ACCESS_SECRET);
  c.set('user', { id: payload.sub, bubble_id: payload.bubble_id ?? null, team_id: payload.team_id ?? null });

  const doName = payload.team_id ?? payload.bubble_id ?? payload.sub;
  const id = c.env.CONNECTIONS.idFromName(doName);
  const stub = c.env.CONNECTIONS.get(id);
  return stub.fetch(new Request('https://do/connect', c.req.raw));
});
```

- [ ] **Step 2: Update webhook to accept team_id**

Replace `src/modules/internal/webhook.routes.ts` with:

```typescript
import { Hono } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';

export const webhookRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

webhookRoutes.post('/webhook', async (c) => {
  const secret = c.req.header('X-Webhook-Secret');
  if (!secret) return c.json({ error: 'Unauthorized' }, 401);
  const encoder = new TextEncoder();
  const a = encoder.encode(secret);
  const b = encoder.encode(c.env.WEBHOOK_SECRET);
  const valid = a.length === b.length && await crypto.subtle.timingSafeEqual(a, b);
  if (!valid) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json() as {
    team_id: string;
    event: string;
    conversation_id?: string;
  };

  if (!body.team_id || !body.event) {
    return c.json({ error: 'Missing team_id or event' }, 400);
  }

  const doId = c.env.CONNECTIONS.idFromName(body.team_id);
  const stub = c.env.CONNECTIONS.get(doId);

  await stub.fetch(
    new Request('https://do/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: body.event, conversation_id: body.conversation_id ?? null }),
    }),
  );

  return c.json({ ok: true });
});
```

- [ ] **Step 3: Run full test suite**

```bash
cd apps/backend && npm test
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/app.ts apps/backend/src/modules/internal/webhook.routes.ts
git commit -m "feat(realtime): key WebSocket DO by team_id, update webhook to accept team_id"
```

---

## Task 10: Deploy backend

- [ ] **Step 1: Deploy to Cloudflare**

```bash
cd apps/backend && npx wrangler deploy
```

Expected output includes `Published heep-api` and the worker URL.

- [ ] **Step 2: Smoke test the health endpoint**

```bash
curl https://<your-worker>.workers.dev/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Commit (if any deployment config changed)**

```bash
git add apps/backend/wrangler.toml
git commit -m "chore: deploy send-message + team_id changes" --allow-empty
```

---

## Task 11: Mobile API — add sendMessage

**Files:**
- Modify: `apps/mobile/features/conversations/api/conversations.api.ts`

- [ ] **Step 1: Add sendMessage to conversations.api.ts**

Append to `apps/mobile/features/conversations/api/conversations.api.ts`:

```typescript
export async function sendMessage(conversationId: string, body: string): Promise<void> {
  const token = await getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const makeRequest = (t: string) =>
    fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
      signal: controller.signal,
    });

  try {
    let res = await makeRequest(token!);

    if (res.status === 401) {
      const newToken = await tryRefreshTokens();
      if (!newToken) throw new Error('UNAUTHORIZED');
      res = await makeRequest(newToken);
      if (res.status === 401) throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) throw new Error('Failed to send message');
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/features/conversations/api/conversations.api.ts
git commit -m "feat(conversations): add sendMessage API function"
```

---

## Task 12: Mobile hook — useSendMessage with optimistic update

**Files:**
- Create: `apps/mobile/features/conversations/hooks/use-send-message.ts`

- [ ] **Step 1: Create the hook**

Create `apps/mobile/features/conversations/hooks/use-send-message.ts`:

```typescript
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { sendMessage } from '../api/conversations.api';
import type { ConversationListResponse, Message } from '../types';

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),

    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const snapshot = queryClient.getQueryData<InfiniteData<ConversationListResponse>>(['conversations']);

      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        text: body,
        is_from_agent: false,
        sent_at: new Date().toISOString(),
      };

      queryClient.setQueryData<InfiniteData<ConversationListResponse>>(
        ['conversations'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((conv) =>
                conv.id === conversationId
                  ? { ...conv, messages: [...conv.messages, tempMessage] }
                  : conv,
              ),
            })),
          };
        },
      );

      return { snapshot };
    },

    onError: (_err, _body, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['conversations'], context.snapshot);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/features/conversations/hooks/use-send-message.ts
git commit -m "feat(conversations): add useSendMessage hook with optimistic update"
```

---

## Task 13: Mobile UI — wire send button in ConversationDetailScreen

**Files:**
- Modify: `apps/mobile/features/conversations/screens/conversation-detail-screen.tsx`

- [ ] **Step 1: Add send button**

Replace `apps/mobile/features/conversations/screens/conversation-detail-screen.tsx` with:

```typescript
import React, { memo, useCallback } from 'react';
import { Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeftIcon, UserIcon, PaperPlaneTiltIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { List } from '@/components/ui/list';
import { ChannelIcon } from '../components/channel-icon';
import { useSendMessage } from '../hooks/use-send-message';
import type { Conversation, ConversationListResponse, Message } from '../types';

type MessageBubbleProps = { message: Message };

const MessageBubble = memo(({ message }: MessageBubbleProps) => {
  const isAgent = message.is_from_agent;
  const time = message.sent_at
    ? new Date(message.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Box className={`px-4 mb-2 ${isAgent ? 'items-end' : 'items-start'}`}>
      <Box
        className={`rounded-[20px] px-4 py-3 max-w-[78%] ${isAgent ? 'bg-[#4A6660]' : 'bg-white'}`}
        style={{
          borderBottomRightRadius: isAgent ? 4 : 20,
          borderBottomLeftRadius: isAgent ? 20 : 4,
        }}
      >
        <Text className={`text-sm leading-5 ${isAgent ? 'text-white' : 'text-foreground'}`}>
          {message.text}
        </Text>
      </Box>
      <Text className="text-muted text-xs mt-1 px-1">{time}</Text>
    </Box>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const { mutate: send, isPending } = useSendMessage(id);

  const cached = queryClient.getQueryData<InfiniteData<ConversationListResponse>>(['conversations']);
  const conversation: Conversation | undefined = cached?.pages
    .flatMap((p) => p.data)
    .find((c) => c.id === id);

  const messages = conversation?.messages ?? [];

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isPending) return;
    send(trimmed, {
      onSuccess: () => setMessage(''),
    });
  }, [message, isPending, send]);

  const canSend = message.trim().length > 0 && !isPending;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background-muted"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <HStack className="items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <HStack className="items-center" style={{ gap: 4 }}>
            <CaretLeftIcon size={20} />
            <Text className="text-base text-foreground">Back</Text>
          </HStack>
        </Pressable>
        <Text className="text-base text-subtle">Details</Text>
      </HStack>

      <Box className="h-px bg-outline-200" />

      {/* Contact Card */}
      <Box className="border-b border-border/10 px-4 py-4">
        <HStack className="items-center justify-between">
          <HStack className="items-center flex-1" style={{ gap: 12 }}>
            <Box className="w-12 h-12 relative">
              <Box className="w-12 h-12 rounded-full bg-[#C8D1CE] items-center justify-center">
                <UserIcon size={24} color="#8A9690" weight="light" />
              </Box>
              <Box className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white items-center justify-center">
                {conversation && <ChannelIcon channel={conversation.channel} size={13} />}
              </Box>
            </Box>
            <VStack style={{ gap: 2 }}>
              <Text className="text-foreground text-lg font-medium tracking-tight">
                {conversation?.contact.name.trim() || '—'}
              </Text>
              {conversation?.contact.phone ? (
                <Text className="text-muted text-sm">{conversation.contact.phone}</Text>
              ) : null}
            </VStack>
          </HStack>
        </HStack>
      </Box>

      {/* Messages */}
      <Box className="flex-1">
        <List
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          estimatedItemSize={72}
          inverted
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        />
      </Box>

      {/* Bottom */}
      <VStack
        className="rounded-t-2xl"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        {conversation?.is_ai_paused !== undefined && (
          <Box className="mx-4">
            <HStack className="items-center justify-between bg-teal-100 rounded-t-2xl px-4 py-2">
              <Text className="text-xs tracking-tighter">Pause AI on this conversation</Text>
              <Text className={`text-xs font-medium ${conversation.is_ai_paused ? 'text-teal-600' : 'text-red-500'}`}>
                {conversation.is_ai_paused ? 'Turn on' : 'Turn off'}
              </Text>
            </HStack>
          </Box>
        )}

        <Box className="bg-white pt-3 border border-border/10 rounded-t-2xl">
          <Box className="mx-4 mb-3">
            <HStack
              className="items-center border border-border/30 bg-background-muted rounded-2xl px-4"
              style={{ gap: 8, minHeight: 44 }}
            >
              <TextInput
                className="flex-1 text-base text-foreground py-3"
                placeholder="Send a message"
                placeholderTextColor="#9BA5A0"
                value={message}
                onChangeText={setMessage}
                multiline
                style={{ fontFamily: 'DM-Sans' }}
              />
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                hitSlop={8}
              >
                <PaperPlaneTiltIcon
                  size={22}
                  color={canSend ? '#4A6660' : '#C8D1CE'}
                  weight={canSend ? 'fill' : 'regular'}
                />
              </Pressable>
            </HStack>
          </Box>
        </Box>
      </VStack>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/features/conversations/screens/conversation-detail-screen.tsx
git commit -m "feat(conversations): wire send button with useSendMessage and optimistic update"
```
