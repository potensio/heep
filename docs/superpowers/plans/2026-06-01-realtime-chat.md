# Real-Time Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the backend to Cloudflare Workers and add real-time chat using Durable Objects, then wire the mobile app to it via a WebSocket hook.

**Architecture:** The Hono app is exported as a CF Workers handler; a `ChatRoomDO` Durable Object (one per conversation) handles WebSocket connections via the Hibernation API and persists messages to Neon; all repositories become factory functions accepting a `db` handle created per-request from `c.env`; a `useChatRoom` hook on mobile owns the WebSocket lifecycle.

**Tech Stack:** Cloudflare Workers, Durable Objects (WebSocket Hibernation API), Hono v4, Drizzle ORM, `@neondatabase/serverless`, Web Crypto API, Wrangler CLI, React Native (Expo)

**Spec:** `docs/superpowers/specs/2026-06-01-realtime-chat-design.md`

---

## File map

### Backend — modified

| File | Change |
|---|---|
| `package.json` | add wrangler, @neondatabase/serverless, @cloudflare/workers-types; remove @hono/node-server, bcryptjs |
| `src/index.ts` | CF Workers `export default { fetch }` + export `ChatRoomDO` |
| `src/app.ts` | add `Bindings: Env` type, register services middleware + chat routes |
| `src/types/hono.ts` | add db + service fields to `AppVariables` |
| `src/core/env.ts` | remove module-level singleton; export `parseEnv` only |
| `src/core/db/client.ts` | replace postgres singleton with `createDb(url)` factory |
| `src/core/jwt.ts` | accept secret + ttl as params instead of reading global env |
| `src/core/middleware/auth.ts` | pass `c.env.JWT_ACCESS_SECRET` to `verifyAccessToken` |
| `src/core/test/db.ts` | use Neon driver + Drizzle execute for truncation |
| `src/modules/auth/auth.repository.ts` | `createAuthRepository(db)` factory |
| `src/modules/auth/auth.service.ts` | accept jwt secrets + ttls as deps; use `src/core/crypto.ts` |
| `src/modules/users/users.repository.ts` | `createUsersRepository(db)` factory |
| `src/modules/products/products.repository.ts` | `createProductsRepository(db)` factory |
| `src/modules/saved-products/saved-products.repository.ts` | `createSavedProductsRepository(db)` factory |
| `src/modules/*/users.routes.ts` etc. | use `c.get('authService')` / `c.get('usersService')` etc. |

### Backend — new

| File | Purpose |
|---|---|
| `wrangler.toml` | CF Workers config + DO binding |
| `.dev.vars` | local env for `wrangler dev` (gitignored) |
| `src/types/env.ts` | `Env` interface (CF Workers bindings shape) |
| `src/core/crypto.ts` | Web Crypto replacements for bcryptjs + node:crypto |
| `src/core/middleware/services.ts` | creates db + all services from `c.env`, sets in context |
| `src/modules/chat/chat.repository.ts` | Neon queries for conversations + messages |
| `src/modules/chat/chat.service.ts` | business logic (create convo, list, get messages) |
| `src/modules/chat/chat.routes.ts` | REST endpoints |
| `src/modules/chat/ChatRoomDO.ts` | Durable Object with WebSocket Hibernation API |

### Mobile — new / modified

| File | Change |
|---|---|
| `features/chat/hooks/useChatRoom.ts` | NEW: WebSocket lifecycle hook |
| `features/chat/ChatRoomScreen.tsx` | remove `initialMessages` prop; use `useChatRoom` |
| `features/chat/ConversationListScreen.tsx` | replace mock data with REST call |

---

## Task 1: Swap packages + add Wrangler config

**Files:**
- Modify: `apps/backend/package.json`
- Create: `apps/backend/wrangler.toml`
- Create: `apps/backend/.dev.vars` (gitignored)
- Modify: `apps/backend/.gitignore`

- [ ] **Step 1: Update package.json deps**

```bash
cd apps/backend
npm remove @hono/node-server bcryptjs @types/bcryptjs
npm install wrangler @cloudflare/workers-types @neondatabase/serverless
npm install --save-dev @types/node
```

Expected: no errors, package.json updated.

- [ ] **Step 2: Create wrangler.toml**

```toml
name = "bantujual-api"
main = "src/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ACCESS_TOKEN_TTL = "900"
REFRESH_TOKEN_TTL = "2592000"
OTP_TTL = "300"
OTP_MAX_ATTEMPTS = "5"
EMAIL_FROM = "BantuJual <noreply@bantujual.app>"
WEB_ORIGIN = "http://localhost:5173"

[[durable_objects.bindings]]
name = "CHAT_ROOM"
class_name = "ChatRoomDO"

[[migrations]]
tag = "v1"
new_classes = ["ChatRoomDO"]
```

- [ ] **Step 3: Create .dev.vars with local dev secrets**

```
DATABASE_URL=<your-neon-connection-string>
JWT_ACCESS_SECRET=dev-access-secret-minimum-16-chars
JWT_REFRESH_SECRET=dev-refresh-secret-minimum-16-chars
RESEND_API_KEY=re_placeholder
```

- [ ] **Step 4: Add .dev.vars to .gitignore**

Append to `apps/backend/.gitignore`:
```
.dev.vars
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/package.json apps/backend/package-lock.json apps/backend/wrangler.toml apps/backend/.gitignore
git commit -m "chore(backend): add wrangler + neon driver, drop node server + bcryptjs"
```

---

## Task 2: CF Workers Env type + DB client

**Files:**
- Create: `src/types/env.ts`
- Modify: `src/core/env.ts`
- Modify: `src/core/db/client.ts`

- [ ] **Step 1: Create `src/types/env.ts`**

```ts
export interface Env {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL: string;
  REFRESH_TOKEN_TTL: string;
  OTP_TTL: string;
  OTP_MAX_ATTEMPTS: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  WEB_ORIGIN: string;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  R2_PUBLIC_URL?: string;
  CHAT_ROOM: DurableObjectNamespace;
}
```

- [ ] **Step 2: Update `src/core/env.ts`**

Remove `config({ path: ... })` dotenv call and the module-level `export const env` singleton. Keep only `parseEnv` and the `Env` type alias:

```ts
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(2592000),
  OTP_TTL: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('BantuJual <noreply@bantujual.app>'),
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

- [ ] **Step 3: Update `src/core/db/client.ts`**

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;
```

- [ ] **Step 4: Update `tsconfig.json` to include Workers types**

Change the `types` array so both CF Workers globals (`DurableObjectNamespace`, `WebSocketPair`, etc.) and Node.js globals (`process.env` for tests) are available:

```json
"types": ["@cloudflare/workers-types", "node"]
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/types/env.ts apps/backend/src/core/env.ts apps/backend/src/core/db/client.ts apps/backend/tsconfig.json
git commit -m "chore(backend): replace postgres singleton with neon factory + CF Workers env type"
```

---

## Task 3: Update test helper to Neon

**Files:**
- Modify: `src/core/test/db.ts`

The existing helper uses `drizzle-orm/postgres-js/migrator` and `sql.unsafe`. Both need replacing for the Neon HTTP driver.

- [ ] **Step 1: Rewrite `src/core/test/db.ts`**

```ts
import { beforeAll, beforeEach } from 'vitest';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { sql } from 'drizzle-orm';
import { createDb } from '../db/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must be set for tests');

export const testDb = createDb(databaseUrl);

let migrated = false;

export async function migrateTestDb(): Promise<void> {
  if (migrated) return;
  await migrate(testDb, { migrationsFolder: 'src/core/db/migrations' });
  migrated = true;
}

export async function truncateAll(): Promise<void> {
  const rows = await testDb.execute<{ tablename: string }>(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '__drizzle_migrations'
  `);
  if (rows.length === 0) return;
  const list = rows.map((r: any) => `"${r.tablename}"`).join(', ');
  await testDb.execute(sql.raw(`TRUNCATE ${list} RESTART IDENTITY CASCADE`));
}

export function useTestDb(): void {
  beforeAll(async () => { await migrateTestDb(); });
  beforeEach(async () => { await truncateAll(); });
}
```

- [ ] **Step 2: Update `.env.test` to use Neon connection string**

Ensure `apps/backend/.env.test` has:
```
DATABASE_URL=<your-neon-test-connection-string>
```

Use a separate Neon branch or the same DB (tests truncate tables, not drop).

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/core/test/db.ts apps/backend/.env.test
git commit -m "chore(backend): migrate test helper from postgres-js to neon-http"
```

---

## Task 4: Migrate crypto to Web Crypto API

**Files:**
- Create: `src/core/crypto.ts`
- Modify: `src/modules/auth/auth.service.ts`

bcryptjs uses Node.js native bindings — not available on CF Workers. Replacements use `crypto.subtle` (Web Crypto, available on all runtimes).

- [ ] **Step 1: Create `src/core/crypto.ts`**

```ts
// OTP hashing uses PBKDF2 (slow by design — resists brute force).
// Token hashing uses HMAC-SHA256 (refresh tokens are random, not passwords).

async function deriveBits(password: string, salt: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100_000 },
    baseKey, 256,
  );
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Store as "salt:hash" so the hash is self-contained.
export async function hashOtpCode(code: string): Promise<string> {
  const salt = bufToHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const hash = bufToHex(await deriveBits(code, salt));
  return `${salt}:${hash}`;
}

export async function verifyOtpCode(code: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = bufToHex(await deriveBits(code, salt));
  // Constant-time compare via HMAC to prevent timing attacks.
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode('ct-compare'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const [a, b] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode(actual)),
    crypto.subtle.sign('HMAC', key, enc.encode(expected)),
  ]);
  return bufToHex(a) === bufToHex(b);
}

export function generateOtpCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0]! % 1_000_000).padStart(6, '0');
}

export function generateRefreshToken(): string {
  return bufToHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

export async function hashRefreshToken(token: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return bufToHex(buf);
}
```

- [ ] **Step 2: Write failing test for crypto**

Create `src/core/crypto.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { hashOtpCode, verifyOtpCode, generateOtpCode, hashRefreshToken } from './crypto';

describe('crypto', () => {
  it('verifyOtpCode returns true for correct code', async () => {
    const code = '123456';
    const hash = await hashOtpCode(code);
    expect(await verifyOtpCode(code, hash)).toBe(true);
  });

  it('verifyOtpCode returns false for wrong code', async () => {
    const hash = await hashOtpCode('123456');
    expect(await verifyOtpCode('000000', hash)).toBe(false);
  });

  it('generateOtpCode returns a 6-digit string', () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('hashRefreshToken is deterministic', async () => {
    const h1 = await hashRefreshToken('abc');
    const h2 = await hashRefreshToken('abc');
    expect(h1).toBe(h2);
  });

  it('hashRefreshToken differs for different inputs', async () => {
    expect(await hashRefreshToken('a')).not.toBe(await hashRefreshToken('b'));
  });
});
```

- [ ] **Step 3: Run test to verify it fails (crypto.ts not written yet in right order — skip; file already created above)**

```bash
cd apps/backend && npx vitest run src/core/crypto.test.ts
```

Expected: all 5 tests PASS (crypto.ts was written first).

- [ ] **Step 4: Update `src/modules/auth/auth.service.ts`**

Replace `node:crypto` and `bcryptjs` imports with the new crypto module. Also add JWT secrets + TTLs to `AuthDeps`:

```ts
import { generateOtpCode, hashOtpCode, verifyOtpCode, generateRefreshToken, hashRefreshToken } from '../../core/crypto';
import { sign, verify } from 'hono/jwt';
import { emailService, type EmailService } from '../../core/email';
import { type UsersService } from '../users/users.service';
import { type AuthRepository } from './auth.repository';
import { UnauthorizedError, TooManyAttemptsError } from '../../core/errors';

export interface AuthDeps {
  authRepo: AuthRepository;
  usersService: UsersService;
  email: EmailService;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: number;
  refreshTokenTtl: number;
  otpTtl: number;
  otpMaxAttempts: number;
}

export function createAuthService(deps: AuthDeps) {
  const { authRepo, usersService, email, jwtAccessSecret, accessTokenTtl, refreshTokenTtl, otpTtl, otpMaxAttempts } = deps;

  function nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  async function signAccessToken(userId: string): Promise<string> {
    return sign({ sub: userId, type: 'access', exp: nowSeconds() + accessTokenTtl }, jwtAccessSecret, 'HS256');
  }

  async function issueTokens(user: import('../users/users.repository').User) {
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
    async requestOtp(emailAddr: string): Promise<void> {
      const code = generateOtpCode();
      const codeHash = await hashOtpCode(code);
      await authRepo.createOtp({
        email: emailAddr,
        codeHash,
        expiresAt: new Date(Date.now() + otpTtl * 1000),
      });
      await email.sendOtp(emailAddr, code);
    },

    async verifyOtp(emailAddr: string, code: string) {
      const otp = await authRepo.findActiveOtp(emailAddr);
      if (!otp) throw new UnauthorizedError('Invalid or expired code');
      if (otp.attempts >= otpMaxAttempts) throw new TooManyAttemptsError();
      const ok = await verifyOtpCode(code, otp.codeHash);
      if (!ok) {
        await authRepo.incrementAttempts(otp.id);
        throw new UnauthorizedError('Invalid or expired code');
      }
      await authRepo.consumeOtp(otp.id);
      const user = await usersService.findOrCreateByEmail(emailAddr);
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

- [ ] **Step 5: Update `src/core/jwt.ts` to accept secret + ttl as params**

```ts
import { sign, verify } from 'hono/jwt';
import { UnauthorizedError } from './errors';

export interface AccessPayload {
  sub: string;
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

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/core/crypto.ts apps/backend/src/core/crypto.test.ts apps/backend/src/core/jwt.ts apps/backend/src/modules/auth/auth.service.ts
git commit -m "feat(backend): replace bcryptjs + node:crypto with Web Crypto API"
```

---

## Task 5: Repository factory refactor

**Files:**
- Modify: `src/modules/auth/auth.repository.ts`
- Modify: `src/modules/users/users.repository.ts`
- Modify: `src/modules/products/products.repository.ts`
- Modify: `src/modules/saved-products/saved-products.repository.ts`

Each repository changes from a module-level singleton that imports `db` to a factory function `createXxxRepository(db: Database)`.

- [ ] **Step 1: Update `src/modules/auth/auth.repository.ts`**

Replace `import { db } from '../../core/db/client'` with `import type { Database }`. Wrap the object literal in a `createAuthRepository(db: Database)` function. Remove the `export const authRepository` singleton:

```ts
import { and, eq, gt, isNull, desc } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { otpCodes, refreshTokens } from '../../core/db/schema';

export type OtpCode = typeof otpCodes.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;

export interface CreateOtpInput { email: string; codeHash: string; expiresAt: Date; }
export interface CreateRefreshTokenInput { userId: string; tokenHash: string; expiresAt: Date; }

export interface AuthRepository {
  createOtp(input: CreateOtpInput): Promise<OtpCode>;
  findActiveOtp(email: string): Promise<OtpCode | null>;
  incrementAttempts(id: string): Promise<void>;
  consumeOtp(id: string): Promise<void>;
  createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findValidRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(id: string): Promise<void>;
}

export function createAuthRepository(db: Database): AuthRepository {
  return {
    async createOtp(input) {
      const [row] = await db.insert(otpCodes).values(input).returning();
      return row;
    },
    async findActiveOtp(email) {
      const [row] = await db
        .select().from(otpCodes)
        .where(and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, new Date())))
        .orderBy(desc(otpCodes.createdAt))
        .limit(1);
      return row ?? null;
    },
    async incrementAttempts(id) {
      const [row] = await db.select({ attempts: otpCodes.attempts }).from(otpCodes).where(eq(otpCodes.id, id)).limit(1);
      await db.update(otpCodes).set({ attempts: (row?.attempts ?? 0) + 1 }).where(eq(otpCodes.id, id));
    },
    async consumeOtp(id) {
      await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, id));
    },
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

- [ ] **Step 2: Update `src/modules/users/users.repository.ts`**

Same pattern — remove `import { db }`, add `import type { Database }`, wrap in `createUsersRepository(db)`, remove singleton:

```ts
import { eq } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { users } from '../../core/db/schema';

export type User = typeof users.$inferSelect;

export interface CreateUserInput { email: string; }
export interface UpdateUserInput {
  name?: string; avatarUrl?: string; gender?: 'male' | 'female';
  profileCompleted?: boolean; phone?: string;
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
      const [row] = await db.insert(users).values(input).returning();
      return row;
    },
    async update(id, patch) {
      const [row] = await db.update(users).set({ ...patch, updatedAt: new Date() }).where(eq(users.id, id)).returning();
      return row;
    },
  };
}
```

- [ ] **Step 3: Apply the same factory pattern to `products.repository.ts` and `saved-products.repository.ts`**

In both files:
- Replace `import { db } from '../../core/db/client'` with `import type { Database } from '../../core/db/client'`
- Wrap the existing object in `export function createProductsRepository(db: Database)` / `export function createSavedProductsRepository(db: Database)`
- Remove the exported singleton constant

The internal query logic stays identical — only the wrapping changes.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/auth/auth.repository.ts apps/backend/src/modules/users/users.repository.ts apps/backend/src/modules/products/products.repository.ts apps/backend/src/modules/saved-products/saved-products.repository.ts
git commit -m "refactor(backend): repositories become factory functions accepting db"
```

---

## Task 6: Services middleware + app + routes update

**Files:**
- Create: `src/core/middleware/services.ts`
- Modify: `src/types/hono.ts`
- Modify: `src/core/middleware/auth.ts`
- Modify: `src/app.ts`
- Modify: all route files to use `c.get('authService')` etc.
- Modify: `src/modules/users/users.service.ts` (remove singleton export)

- [ ] **Step 1: Update `src/types/hono.ts`**

```ts
import type { Database } from '../core/db/client';
import type { AuthService } from '../modules/auth/auth.service';
import type { UsersService } from '../modules/users/users.service';

export interface AuthUser { id: string; }

export interface AppVariables {
  user: AuthUser;
  db: Database;
  authService: AuthService;
  usersService: UsersService;
}
```

- [ ] **Step 2: Create `src/core/middleware/services.ts`**

```ts
import type { Context, Next } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { createDb } from '../db/client';
import { emailService } from '../email';
import { createAuthRepository } from '../../modules/auth/auth.repository';
import { createUsersRepository } from '../../modules/users/users.repository';
import { createProductsRepository } from '../../modules/products/products.repository';
import { createSavedProductsRepository } from '../../modules/saved-products/saved-products.repository';
import { createAuthService } from '../../modules/auth/auth.service';
import { createUsersService } from '../../modules/users/users.service';

export async function servicesMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const db = createDb(c.env.DATABASE_URL);
  const authRepo = createAuthRepository(db);
  const usersRepo = createUsersRepository(db);
  const productsRepo = createProductsRepository(db);
  const savedProductsRepo = createSavedProductsRepository(db);

  const usersService = createUsersService({
    repo: usersRepo,
    countActiveListings: (userId) => productsRepo.countForSeller(userId),
  });

  const authService = createAuthService({
    authRepo,
    usersService,
    email: emailService,
    jwtAccessSecret: c.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: c.env.JWT_REFRESH_SECRET,
    accessTokenTtl: Number(c.env.ACCESS_TOKEN_TTL),
    refreshTokenTtl: Number(c.env.REFRESH_TOKEN_TTL),
    otpTtl: Number(c.env.OTP_TTL),
    otpMaxAttempts: Number(c.env.OTP_MAX_ATTEMPTS),
  });

  c.set('db', db);
  c.set('authService', authService);
  c.set('usersService', usersService);
  await next();
}
```

- [ ] **Step 3: Update `src/core/middleware/auth.ts`**

```ts
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
  const payload = await verifyAccessToken(token, c.env.JWT_ACCESS_SECRET);
  c.set('user', { id: payload.sub });
  await next();
}
```

- [ ] **Step 4: Update `src/app.ts`**

```ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import { corsMiddleware } from './core/middleware/cors';
import { servicesMiddleware } from './core/middleware/services';
import type { Env } from './types/env';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { productsRoutes } from './modules/products/products.routes';
import { savedProductsRoutes } from './modules/saved-products/saved-products.routes';

export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

  app.use('*', logger());
  app.use('*', corsMiddleware);
  app.use('*', servicesMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/products', productsRoutes);
  app.route('/saved-products', savedProductsRoutes);

  app.onError(errorHandler);
  return app;
}
```

- [ ] **Step 5: Update route files to use context services**

In `src/modules/auth/auth.routes.ts`, replace each `authService.xxx` call with `c.get('authService').xxx`. Example diff:

```ts
// before
await authService.requestOtp(email);
// after
await c.get('authService').requestOtp(email);
```

Apply the same pattern to `auth.routes.ts` (authService), `users.routes.ts` (usersService), `products.routes.ts` (get `db` from context if needed), `saved-products.routes.ts`.

- [ ] **Step 6: Remove singleton exports from service files**

In `src/modules/users/users.service.ts`: remove the bottom two lines (`export const usersService = createUsersService(...)`) — no more module-level singletons.

In `src/modules/auth/auth.service.ts`: confirm the `AuthService` type export is still there but no singleton.

- [ ] **Step 7: Update existing tests to pass env bindings**

In route test files (`auth.routes.test.ts`, etc.), `app.request()` now needs env as the 3rd argument. Add a test env helper:

```ts
// At the top of each routes test file
const testEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: 'test-access-secret-16+',
  JWT_REFRESH_SECRET: 'test-refresh-secret-16+',
  ACCESS_TOKEN_TTL: '900',
  REFRESH_TOKEN_TTL: '2592000',
  OTP_TTL: '300',
  OTP_MAX_ATTEMPTS: '5',
  EMAIL_FROM: 'test@example.com',
  WEB_ORIGIN: 'http://localhost:5173',
  CHAT_ROOM: {} as DurableObjectNamespace,
};

// Then: await app.request('/path', init, testEnv)
```

- [ ] **Step 8: Run tests**

```bash
cd apps/backend && npm test
```

Expected: all existing tests PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/backend/src/core/middleware/services.ts apps/backend/src/core/middleware/auth.ts apps/backend/src/types/hono.ts apps/backend/src/app.ts apps/backend/src/modules/
git commit -m "refactor(backend): services middleware wires db + services from CF Workers env"
```

---

## Task 7: Migrate entry point to CF Workers

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Rewrite `src/index.ts`**

```ts
import { createApp } from './app';

export { ChatRoomDO } from './modules/chat/ChatRoomDO';

export default { fetch: createApp().fetch };
```

Note: `ChatRoomDO` doesn't exist yet — it will be added in Task 10. For now, comment it out or create a stub:

```ts
// export { ChatRoomDO } from './modules/chat/ChatRoomDO'; // added in Task 10
export default { fetch: createApp().fetch };
```

- [ ] **Step 2: Start wrangler dev and verify health endpoint**

```bash
cd apps/backend && npx wrangler dev
```

Expected: worker starts, `curl http://localhost:8787/health` returns `{"status":"ok"}`.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/index.ts
git commit -m "feat(backend): migrate entry point to Cloudflare Workers export"
```

---

## Task 8: Chat repository

**Files:**
- Create: `src/modules/chat/chat.repository.ts`
- Create: `src/modules/chat/chat.repository.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/modules/chat/chat.repository.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { useTestDb, testDb } from '../../core/test/db';
import { createChatRepository } from './chat.repository';
import { createUsersRepository } from '../users/users.repository';
import { createProductsRepository } from '../products/products.repository';

useTestDb();

async function seedConversation() {
  const usersRepo = createUsersRepository(testDb);
  const productsRepo = createProductsRepository(testDb);
  const chatRepo = createChatRepository(testDb);

  const buyer = await usersRepo.create({ email: 'buyer@example.com' });
  const seller = await usersRepo.create({ email: 'seller@example.com' });
  const product = await productsRepo.create({
    sellerId: seller.id, name: 'Sepatu', price: 100_000,
    description: '', category: 'fashion', subcategory: 'shoes',
    attributes: {}, listingStatus: 'active', approvalStatus: 'approved',
    expiresAt: null, locationName: '', locationPlaceId: '', locationLat: 0, locationLng: 0,
    photos: [],
  });
  const convo = await chatRepo.findOrCreateConversation({ productId: product.id, buyerId: buyer.id, sellerId: seller.id });
  return { buyer, seller, product, convo, chatRepo };
}

describe('ChatRepository', () => {
  it('findOrCreateConversation is idempotent', async () => {
    const { convo, chatRepo, product, buyer, seller } = await seedConversation();
    const again = await chatRepo.findOrCreateConversation({ productId: product.id, buyerId: buyer.id, sellerId: seller.id });
    expect(again.id).toBe(convo.id);
  });

  it('createMessage + listMessages round-trip', async () => {
    const { convo, buyer, chatRepo } = await seedConversation();
    await chatRepo.createMessage({ conversationId: convo.id, senderId: buyer.id, text: 'Halo', imageUrl: null });
    const msgs = await chatRepo.listMessages(convo.id, 50);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.text).toBe('Halo');
  });

  it('listConversations returns conversations for user', async () => {
    const { buyer, chatRepo } = await seedConversation();
    const list = await chatRepo.listConversations(buyer.id);
    expect(list).toHaveLength(1);
    expect(list[0]!.conversation.buyerId).toBe(buyer.id);
  });

  it('isParticipant returns true for buyer and seller', async () => {
    const { convo, buyer, seller, chatRepo } = await seedConversation();
    expect(await chatRepo.isParticipant(convo.id, buyer.id)).toBe(true);
    expect(await chatRepo.isParticipant(convo.id, seller.id)).toBe(true);
    expect(await chatRepo.isParticipant(convo.id, 'random-uuid')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/backend && npx vitest run src/modules/chat/chat.repository.test.ts
```

Expected: FAIL — `createChatRepository` not found.

- [ ] **Step 3: Implement `src/modules/chat/chat.repository.ts`**

```ts
import { and, desc, eq, or } from 'drizzle-orm';
import type { Database } from '../../core/db/client';
import { conversations, messages, products, users } from '../../core/db/schema';

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export interface FindOrCreateConversationInput {
  productId: string;
  buyerId: string;
  sellerId: string;
}

export interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  text: string | null;
  imageUrl: string | null;
}

export interface ConversationWithContext {
  conversation: Conversation;
  product: { id: string; name: string; price: number };
  otherUser: { id: string; name: string | null; avatarUrl: string | null };
  lastMessage: Message | null;
}

export interface ChatRepository {
  findOrCreateConversation(input: FindOrCreateConversationInput): Promise<Conversation>;
  findConversationById(id: string): Promise<Conversation | null>;
  isParticipant(conversationId: string, userId: string): Promise<boolean>;
  createMessage(input: CreateMessageInput): Promise<Message>;
  listMessages(conversationId: string, limit: number, beforeId?: string): Promise<Message[]>;
  listConversations(userId: string): Promise<ConversationWithContext[]>;
}

export function createChatRepository(db: Database): ChatRepository {
  return {
    async findOrCreateConversation({ productId, buyerId, sellerId }) {
      const [existing] = await db
        .select().from(conversations)
        .where(and(eq(conversations.productId, productId), eq(conversations.buyerId, buyerId)))
        .limit(1);
      if (existing) return existing;
      const [created] = await db.insert(conversations).values({ productId, buyerId, sellerId }).returning();
      return created;
    },

    async findConversationById(id) {
      const [row] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
      return row ?? null;
    },

    async isParticipant(conversationId, userId) {
      const [row] = await db
        .select({ id: conversations.id }).from(conversations)
        .where(and(
          eq(conversations.id, conversationId),
          or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)),
        ))
        .limit(1);
      return !!row;
    },

    async createMessage({ conversationId, senderId, text, imageUrl }) {
      const [row] = await db.insert(messages).values({ conversationId, senderId, text, imageUrl }).returning();
      return row;
    },

    async listMessages(conversationId, limit, beforeId) {
      const rows = await db
        .select().from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(limit);
      return rows.reverse();
    },

    async listConversations(userId) {
      const rows = await db
        .select({
          conversation: conversations,
          product: { id: products.id, name: products.name, price: products.price },
          otherUser: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
        })
        .from(conversations)
        .innerJoin(products, eq(conversations.productId, products.id))
        .innerJoin(users, or(
          and(eq(conversations.buyerId, userId), eq(users.id, conversations.sellerId)),
          and(eq(conversations.sellerId, userId), eq(users.id, conversations.buyerId)),
        ))
        .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
        .orderBy(desc(conversations.updatedAt));

      const result: ConversationWithContext[] = [];
      for (const row of rows) {
        const [lastMessage] = await db
          .select().from(messages)
          .where(eq(messages.conversationId, row.conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);
        result.push({ ...row, lastMessage: lastMessage ?? null });
      }
      return result;
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/backend && npx vitest run src/modules/chat/chat.repository.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/chat/
git commit -m "feat(backend): add chat repository with conversation + message queries"
```

---

## Task 9: Chat service + REST routes

**Files:**
- Create: `src/modules/chat/chat.service.ts`
- Create: `src/modules/chat/chat.routes.ts`
- Modify: `src/core/middleware/services.ts`
- Modify: `src/types/hono.ts`
- Modify: `src/app.ts`

- [ ] **Step 1: Write failing test for chat service**

Create `src/modules/chat/chat.service.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { createChatService } from './chat.service';
import type { ChatRepository } from './chat.repository';
import type { UsersRepository } from '../users/users.repository';

function makeRepo(overrides: Partial<ChatRepository> = {}): ChatRepository {
  return {
    findOrCreateConversation: vi.fn().mockResolvedValue({ id: 'c1', productId: 'p1', buyerId: 'u1', sellerId: 'u2', createdAt: new Date(), updatedAt: new Date() }),
    findConversationById: vi.fn().mockResolvedValue(null),
    isParticipant: vi.fn().mockResolvedValue(true),
    createMessage: vi.fn().mockResolvedValue({ id: 'm1', conversationId: 'c1', senderId: 'u1', text: 'hi', imageUrl: null, readAt: null, createdAt: new Date() }),
    listMessages: vi.fn().mockResolvedValue([]),
    listConversations: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('ChatService', () => {
  it('startConversation delegates to repo.findOrCreateConversation', async () => {
    const repo = makeRepo();
    const svc = createChatService({ chatRepo: repo });
    await svc.startConversation({ productId: 'p1', buyerId: 'u1', sellerId: 'u2' });
    expect(repo.findOrCreateConversation).toHaveBeenCalledWith({ productId: 'p1', buyerId: 'u1', sellerId: 'u2' });
  });

  it('getMessages throws if user is not participant', async () => {
    const repo = makeRepo({ isParticipant: vi.fn().mockResolvedValue(false) });
    const svc = createChatService({ chatRepo: repo });
    await expect(svc.getMessages('c1', 'u99')).rejects.toThrow();
  });

  it('getMessages returns messages for participant', async () => {
    const msgs = [{ id: 'm1', conversationId: 'c1', senderId: 'u1', text: 'hi', imageUrl: null, readAt: null, createdAt: new Date() }];
    const repo = makeRepo({ listMessages: vi.fn().mockResolvedValue(msgs) });
    const svc = createChatService({ chatRepo: repo });
    const result = await svc.getMessages('c1', 'u1');
    expect(result).toEqual(msgs);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/backend && npx vitest run src/modules/chat/chat.service.test.ts
```

Expected: FAIL — `createChatService` not found.

- [ ] **Step 3: Implement `src/modules/chat/chat.service.ts`**

```ts
import { ForbiddenError } from '../../core/errors';
import type { ChatRepository, Conversation, ConversationWithContext, Message } from './chat.repository';

export interface ChatDeps {
  chatRepo: ChatRepository;
}

export function createChatService({ chatRepo }: ChatDeps) {
  return {
    async startConversation(input: { productId: string; buyerId: string; sellerId: string }): Promise<Conversation> {
      return chatRepo.findOrCreateConversation(input);
    },

    async listConversations(userId: string): Promise<ConversationWithContext[]> {
      return chatRepo.listConversations(userId);
    },

    async getConversation(conversationId: string, userId: string): Promise<Conversation> {
      const ok = await chatRepo.isParticipant(conversationId, userId);
      if (!ok) throw new ForbiddenError('Not a participant');
      const convo = await chatRepo.findConversationById(conversationId);
      if (!convo) throw new ForbiddenError('Not a participant');
      return convo;
    },

    async getMessages(conversationId: string, userId: string, limit = 50): Promise<Message[]> {
      const ok = await chatRepo.isParticipant(conversationId, userId);
      if (!ok) throw new ForbiddenError('Not a participant');
      return chatRepo.listMessages(conversationId, limit);
    },
  };
}

export type ChatService = ReturnType<typeof createChatService>;
```

- [ ] **Step 4: Verify `ForbiddenError` exists in `src/core/errors.ts`**

`ForbiddenError` is already defined in `src/core/errors.ts` — no change needed. Just confirm the import in `chat.service.ts` resolves correctly.

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/backend && npx vitest run src/modules/chat/chat.service.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 6: Implement `src/modules/chat/chat.routes.ts`**

```ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';

export const chatRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const startConvoSchema = z.object({ productId: z.string().uuid(), sellerId: z.string().uuid() });

chatRoutes.post('/conversations', requireAuth, zValidator('json', startConvoSchema), async (c) => {
  const { productId, sellerId } = c.req.valid('json');
  const buyerId = c.get('user').id;
  const convo = await c.get('chatService').startConversation({ productId, buyerId, sellerId });
  return c.json(convo, 201);
});

chatRoutes.get('/conversations', requireAuth, async (c) => {
  const list = await c.get('chatService').listConversations(c.get('user').id);
  return c.json(list);
});

chatRoutes.get('/conversations/:id', requireAuth, async (c) => {
  const convo = await c.get('chatService').getConversation(c.req.param('id'), c.get('user').id);
  return c.json(convo);
});

chatRoutes.get('/conversations/:id/messages', requireAuth, async (c) => {
  const msgs = await c.get('chatService').getMessages(c.req.param('id'), c.get('user').id);
  return c.json(msgs);
});

chatRoutes.get('/conversations/:id/ws', requireAuth, async (c) => {
  const id = c.req.param('id');
  const ok = await c.get('db')
    // isParticipant check via DO stub — DO handles auth on connect too
    .query.conversations.findFirst({ where: (t, { eq }) => eq(t.id, id) });
  if (!ok) return c.json({ error: 'Not found' }, 404);

  const doId = c.env.CHAT_ROOM.idFromName(id);
  const stub = c.env.CHAT_ROOM.get(doId);
  return stub.fetch(c.req.raw);
});
```

- [ ] **Step 7: Add `chatService` to `AppVariables` and services middleware**

In `src/types/hono.ts`, add:
```ts
import type { ChatService } from '../modules/chat/chat.service';
// in AppVariables:
chatService: ChatService;
```

In `src/core/middleware/services.ts`, add at the bottom of the function before `await next()`:
```ts
import { createChatRepository } from '../../modules/chat/chat.repository';
import { createChatService } from '../../modules/chat/chat.service';

// inside servicesMiddleware:
const chatRepo = createChatRepository(db);
const chatService = createChatService({ chatRepo });
c.set('chatService', chatService);
```

- [ ] **Step 8: Wire chat routes into `src/app.ts`**

```ts
import { chatRoutes } from './modules/chat/chat.routes';
// in createApp():
app.route('/chat', chatRoutes);
```

- [ ] **Step 9: Commit**

```bash
git add apps/backend/src/modules/chat/chat.service.ts apps/backend/src/modules/chat/chat.service.test.ts apps/backend/src/modules/chat/chat.routes.ts apps/backend/src/core/middleware/services.ts apps/backend/src/types/hono.ts apps/backend/src/app.ts apps/backend/src/core/errors.ts
git commit -m "feat(backend): add chat service + REST routes"
```

---

## Task 10: ChatRoom Durable Object

**Files:**
- Create: `src/modules/chat/ChatRoomDO.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create `src/modules/chat/ChatRoomDO.ts`**

```ts
import { createDb } from '../../core/db/client';
import { createChatRepository } from './chat.repository';
import { verifyAccessToken } from '../../core/jwt';

interface Env {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
}

export class ChatRoomDO {
  private conversationId: string | null = null;

  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env,
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Derive conversation ID from the DO name (set by chat.routes.ts via idFromName(convoId))
    this.conversationId = this.state.id.name ?? null;

    // Auth: token in query param
    const token = url.searchParams.get('token');
    if (!token) return new Response('Unauthorized', { status: 401 });

    let userId: string;
    try {
      const payload = await verifyAccessToken(token, this.env.JWT_ACCESS_SECRET);
      userId = payload.sub;
    } catch {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify participant
    const db = createDb(this.env.DATABASE_URL);
    const chatRepo = createChatRepository(db);
    const ok = this.conversationId
      ? await chatRepo.isParticipant(this.conversationId, userId)
      : false;
    if (!ok) return new Response('Forbidden', { status: 403 });

    // Upgrade to WebSocket using Hibernation API
    const { 0: client, 1: server } = new WebSocketPair();
    this.state.acceptWebSocket(server, [userId]);

    // Send message history on connect
    const history = this.conversationId
      ? await chatRepo.listMessages(this.conversationId, 50)
      : [];
    server.send(JSON.stringify({ type: 'history', messages: history }));

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    const tags = this.state.getTags(ws);
    const senderId = tags[0];
    if (!senderId || !this.conversationId) return;

    let parsed: { type: string; text?: string; imageUrl?: string };
    try {
      parsed = JSON.parse(message);
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    if (parsed.type !== 'message') return;

    const text = parsed.text ?? null;
    const imageUrl = parsed.imageUrl ?? null;
    if (!text && !imageUrl) {
      ws.send(JSON.stringify({ type: 'error', message: 'text or imageUrl required' }));
      return;
    }

    const db = createDb(this.env.DATABASE_URL);
    const chatRepo = createChatRepository(db);
    const saved = await chatRepo.createMessage({ conversationId: this.conversationId, senderId, text, imageUrl });

    const broadcast = JSON.stringify({ type: 'message', ...saved });
    for (const socket of this.state.getWebSockets()) {
      socket.send(broadcast);
    }
  }

  async webSocketClose(_ws: WebSocket): Promise<void> {
    // Hibernation API handles cleanup automatically.
  }
}
```

- [ ] **Step 2: Export `ChatRoomDO` from `src/index.ts`**

```ts
import { createApp } from './app';

export { ChatRoomDO } from './modules/chat/ChatRoomDO';

export default { fetch: createApp().fetch };
```

- [ ] **Step 3: Verify wrangler dev picks up the DO**

```bash
cd apps/backend && npx wrangler dev
```

Expected: starts without errors. `curl http://localhost:8787/health` → `{"status":"ok"}`.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/chat/ChatRoomDO.ts apps/backend/src/index.ts
git commit -m "feat(backend): add ChatRoomDO with WebSocket Hibernation API"
```

---

## Task 11: Mobile — `useChatRoom` hook

**Files:**
- Create: `apps/mobile/features/chat/hooks/useChatRoom.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p apps/mobile/features/chat/hooks
```

- [ ] **Step 2: Create `useChatRoom.ts`**

```ts
import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import type { Message } from '@/lib/types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';
const WS_BASE = BASE.replace(/^http/, 'ws');

export type ChatStatus = 'connecting' | 'connected' | 'disconnected';

export function useChatRoom(conversationId: string) {
  const { token } = useContext(AuthContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!token) return;
    const url = `${WS_BASE}/chat/conversations/${conversationId}/ws?token=${token}`;
    const ws = new WebSocket(url);

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data as string);
      if (event.type === 'history') {
        setMessages(
          (event.messages as any[]).map(normalizeMessage),
        );
      } else if (event.type === 'message') {
        setMessages((prev) => [...prev, normalizeMessage(event)]);
      }
    };

    ws.onclose = (e) => {
      setStatus('disconnected');
      if (e.code !== 1000) {
        retryRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, [conversationId, token]);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close(1000);
    };
  }, [connect]);

  const send = useCallback((text: string, imageUrl?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', text, imageUrl: imageUrl ?? null }));
    }
  }, []);

  return { messages, status, send };
}

function normalizeMessage(raw: any): Message {
  return {
    id: raw.id,
    conversationId: raw.conversationId,
    senderId: raw.senderId,
    text: raw.text ?? undefined,
    image: raw.imageUrl ?? undefined,
    timestamp: new Date(raw.createdAt),
    isRead: !!raw.readAt,
  };
}
```

- [ ] **Step 3: Add `EXPO_PUBLIC_API_URL` to mobile `.env`**

In `apps/mobile/.env` (create if missing):
```
EXPO_PUBLIC_API_URL=http://localhost:8787
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/features/chat/hooks/useChatRoom.ts apps/mobile/.env
git commit -m "feat(mobile): add useChatRoom WebSocket hook"
```

---

## Task 12: Mobile — wire ChatRoomScreen + ConversationListScreen

**Files:**
- Modify: `apps/mobile/features/chat/ChatRoomScreen.tsx`
- Modify: `apps/mobile/features/chat/ConversationListScreen.tsx`

- [ ] **Step 1: Update `ChatRoomScreen.tsx`**

Remove the `initialMessages` prop and the local `handleSend` handler. Replace with `useChatRoom`:

```ts
import { useChatRoom } from './hooks/useChatRoom';
// ... other imports unchanged

interface ChatRoomScreenProps {
  conversation: Conversation;
  // initialMessages removed
}

export function ChatRoomScreen({ conversation }: ChatRoomScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { messages, status, send } = useChatRoom(conversation.id);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  // renderMessages() stays identical — no changes needed

  return (
    <KeyboardAvoidingView ...>
      {/* header unchanged */}
      {status === 'disconnected' && (
        <View className="bg-red-100 px-4 py-1 items-center">
          <Text className="text-xs text-red-600">Reconnecting...</Text>
        </View>
      )}
      {/* ScrollView + ChatInput unchanged, onSend={send} */}
      <ChatInput onSend={send} />
    </KeyboardAvoidingView>
  );
}
```

The full updated file keeps the existing JSX structure intact — only the hook wiring and the disconnected banner are new. Remove the `initialMessages` import from `mockData.ts` at the top.

- [ ] **Step 2: Update the route file that passes props to ChatRoomScreen**

In `apps/mobile/app/(protected)/chat/[id].tsx`, remove passing `initialMessages`:

```ts
// before
<ChatRoomScreen conversation={conversation} initialMessages={mockMessages} />
// after
<ChatRoomScreen conversation={conversation} />
```

- [ ] **Step 3: Update `ConversationListScreen.tsx` to fetch from API**

Replace the mock data import with a `useQuery` call (the project already uses React Query — see `lib/queryClient.ts`):

```ts
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

async function fetchConversations(token: string) {
  const res = await fetch(`${BASE}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function ConversationListScreen() {
  const { token } = useContext(AuthContext);
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => fetchConversations(token!),
    enabled: !!token,
  });

  // rest of JSX uses `conversations` instead of mock data
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/features/chat/ChatRoomScreen.tsx apps/mobile/features/chat/ConversationListScreen.tsx apps/mobile/app/
git commit -m "feat(mobile): wire ChatRoomScreen + ConversationListScreen to real API"
```

---

## Verification checklist

After all tasks complete:

- [ ] `cd apps/backend && npm test` → all tests pass
- [ ] `cd apps/backend && npx wrangler dev` → starts without errors
- [ ] `POST /auth/otp/request` → 200
- [ ] `POST /auth/otp/verify` → access token + refresh token
- [ ] `POST /chat/conversations` with valid token → 201 with conversation
- [ ] `GET /chat/conversations/:id/ws` upgrades to WebSocket
- [ ] Two WS clients in same conversation receive each other's messages
- [ ] `cd apps/mobile && npx tsc --noEmit` → no errors
- [ ] Mobile app connects to local wrangler dev server and chat works end-to-end
