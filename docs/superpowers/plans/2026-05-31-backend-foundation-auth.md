# Backend Foundation + Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the BantuJual backend (`apps/backend`) so the mobile app can complete the full email → OTP → complete-profile login flow against a real Postgres database.

**Architecture:** Hono on Node.js, TypeScript. Module-based with light internal layering: `route → service → repository → db`. Each module is a self-contained folder; shared plumbing lives in `core/`. Services are Hono-free and depend on repository *interfaces* (dependency inversion), so they unit-test with fake repositories. Repositories are the only code that touches Drizzle.

**Tech Stack:** Hono 4, `@hono/node-server`, `@hono/zod-validator`, Zod, Drizzle ORM + `drizzle-kit`, `postgres` (postgres.js) driver, `bcryptjs` (OTP hashing), `hono/jwt` (tokens), `resend` (email), Vitest (tests), `tsx` (dev runtime), `dotenv`.

---

## Testing Strategy

- **Unit tests (no DB):** services and pure helpers (`jwt`, `errors`, `env` parsing). Services receive a **fake repository** implementing the repo interface — fast, deterministic. These files do **not** touch Postgres.
- **Integration tests (real Postgres):** repositories and full HTTP flows (`app.ts` routes). These require a test database. The developer provides `DATABASE_URL` in `.env.test` pointing at a **throwaway local Postgres** (e.g. `postgres://postgres:postgres@localhost:5432/bantujual_test`) or a dedicated Neon branch. Each integration test file opts in by calling `useTestDb()` at its top level — this runs migrations once per file and truncates all tables before each test. Unit-test files simply omit that call, so they never need a database. (No global `setupFiles`, so DB connection is opt-in per file.)
- **Email in tests:** a `TestEmailService` records sent OTPs in a module-level array so integration tests can read the code that would have been emailed.

**Prerequisite for running integration tests:** a reachable Postgres instance. Locally: `docker run --rm -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bantujual_test postgres:16`.

---

## File Structure

```
apps/backend/
├── package.json                         # Task 1
├── tsconfig.json                        # Task 1
├── vitest.config.ts                     # Task 1
├── drizzle.config.ts                    # Task 9
├── .env.example                         # Task 2
├── .env.test                            # Task 2 (gitignored; developer fills DATABASE_URL)
├── .gitignore                           # Task 1
└── src/
    ├── index.ts                         # Task 8  — entry point
    ├── app.ts                           # Task 7  — app factory
    ├── core/
    │   ├── env.ts                       # Task 2  — Zod-validated env
    │   ├── errors.ts                    # Task 3  — AppError + typed errors
    │   ├── jwt.ts                       # Task 12 — token sign/verify
    │   ├── email.ts                     # Task 13 — email interface + impls
    │   ├── db/
    │   │   ├── client.ts                # Task 4  — postgres.js + Drizzle client
    │   │   ├── schema.ts                # Task 9  — ALL tables + relations
    │   │   └── migrations/              # Task 10 — drizzle-kit generated SQL
    │   ├── middleware/
    │   │   ├── error-handler.ts         # Task 5  — maps errors → HTTP
    │   │   ├── auth.ts                  # Task 16 — verify JWT, set c.var.user
    │   │   └── cors.ts                  # Task 19 — allow web origin
    │   └── test/
    │       └── db.ts                    # Task 6  — useTestDb() helper (migrate + truncate)
    ├── types/
    │   └── hono.ts                      # Task 16 — Hono Variables typing
    └── modules/
        ├── users/
        │   ├── users.repository.ts      # Task 11 — interface + Drizzle impl
        │   ├── users.service.ts         # Task 12 (logic) — uses jwt? no; pure
        │   ├── users.validation.ts      # Task 14
        │   └── users.routes.ts          # Task 17, 19
        └── auth/
            ├── auth.repository.ts        # Task 14 — otpCodes + refreshTokens
            ├── auth.service.ts           # Task 15
            ├── auth.validation.ts        # Task 15
            └── auth.routes.ts            # Task 18
```

---

## PHASE 0 — Project Setup

### Task 1: Initialize the package, TypeScript, and Vitest

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/vitest.config.ts`
- Create: `apps/backend/.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@bantujual/backend",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "NODE_ENV=test vitest run",
    "test:watch": "NODE_ENV=test vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/core/db/migrate.ts"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.0",
    "@hono/zod-validator": "^0.4.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.36.0",
    "hono": "^4.6.0",
    "postgres": "^3.4.4",
    "resend": "^4.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.0.0",
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": false
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false, // integration tests share one test DB
  },
});
```

- [ ] **Step 4: Create `.gitignore`**

```
node_modules
dist
.env
.env.test
```

- [ ] **Step 5: Install dependencies**

Run: `cd apps/backend && npm install`
Expected: dependencies install, `node_modules` created, no peer-dep errors (repo `.npmrc` has `legacy-peer-deps=true`).

- [ ] **Step 6: Commit**

```bash
cd apps/backend && git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore
git commit -m "chore(backend): initialize Hono + TypeScript + Vitest project"
```

---

### Task 2: Environment configuration (`core/env.ts`)

**Files:**
- Create: `apps/backend/src/core/env.ts`
- Create: `apps/backend/.env.example`
- Create: `apps/backend/.env.test`
- Test: `apps/backend/src/core/env.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/core/env.test.ts
import { describe, it, expect } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  const valid = {
    DATABASE_URL: 'postgres://u:p@localhost:5432/db',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
  };

  it('applies defaults for optional vars', () => {
    const env = parseEnv(valid);
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.ACCESS_TOKEN_TTL).toBe(900);
    expect(env.OTP_TTL).toBe(300);
  });

  it('throws when a required var is missing', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow();
  });

  it('coerces numeric strings', () => {
    const env = parseEnv({ ...valid, PORT: '8080' });
    expect(env.PORT).toBe(8080);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/env.test.ts`
Expected: FAIL — cannot find module `./env`.

- [ ] **Step 3: Write `core/env.ts`**

```ts
// src/core/env.ts
import { config } from 'dotenv';
import { z } from 'zod';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(900),      // 15 min (seconds)
  REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(2592000), // 30 days
  OTP_TTL: z.coerce.number().int().positive().default(300),               // 5 min
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('BantuJual <noreply@bantujual.app>'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(raw: NodeJS.ProcessEnv | Record<string, unknown>): Env {
  return EnvSchema.parse(raw);
}

export const env = parseEnv(process.env);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/env.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Create `.env.example`**

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:password@host:5432/bantujual
JWT_ACCESS_SECRET=change-me-to-a-long-random-string-min-16
JWT_REFRESH_SECRET=change-me-to-another-long-random-string
ACCESS_TOKEN_TTL=900
REFRESH_TOKEN_TTL=2592000
OTP_TTL=300
OTP_MAX_ATTEMPTS=5
RESEND_API_KEY=
EMAIL_FROM=BantuJual <noreply@bantujual.app>
WEB_ORIGIN=http://localhost:5173
```

- [ ] **Step 6: Create `.env.test`** (gitignored — developer points it at a throwaway DB)

```
NODE_ENV=test
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bantujual_test
JWT_ACCESS_SECRET=test-access-secret-at-least-16-chars
JWT_REFRESH_SECRET=test-refresh-secret-at-least-16-chars
```

- [ ] **Step 7: Commit**

```bash
git add src/core/env.ts src/core/env.test.ts .env.example
git commit -m "feat(backend): validated environment config"
```

---

### Task 3: Typed errors (`core/errors.ts`)

**Files:**
- Create: `apps/backend/src/core/errors.ts`
- Test: `apps/backend/src/core/errors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/core/errors.test.ts
import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError, UnauthorizedError, ForbiddenError, TooManyAttemptsError } from './errors';

describe('errors', () => {
  it('AppError carries status and code', () => {
    const e = new AppError(418, 'TEAPOT', 'I am a teapot');
    expect(e).toBeInstanceOf(Error);
    expect(e.status).toBe(418);
    expect(e.code).toBe('TEAPOT');
    expect(e.message).toBe('I am a teapot');
  });

  it('NotFoundError defaults to 404', () => {
    expect(new NotFoundError().status).toBe(404);
    expect(new NotFoundError().code).toBe('NOT_FOUND');
  });

  it('UnauthorizedError is 401, Forbidden 403, TooManyAttempts 429', () => {
    expect(new UnauthorizedError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
    expect(new TooManyAttemptsError().status).toBe(429);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/errors.test.ts`
Expected: FAIL — cannot find module `./errors`.

- [ ] **Step 3: Write `core/errors.ts`**

```ts
// src/core/errors.ts
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request') {
    super(400, 'VALIDATION_ERROR', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class TooManyAttemptsError extends AppError {
  constructor(message = 'Too many attempts') {
    super(429, 'TOO_MANY_ATTEMPTS', message);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/errors.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/errors.ts src/core/errors.test.ts
git commit -m "feat(backend): typed application errors"
```

---

### Task 4: Database client (`core/db/client.ts`)

**Files:**
- Create: `apps/backend/src/core/db/client.ts`

(No test — this is a thin singleton exercised by every integration test in later tasks.)

- [ ] **Step 1: Write `core/db/client.ts`**

```ts
// src/core/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import * as schema from './schema';

// One connection in tests (shared transactional state), pooled otherwise.
export const sql = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'test' ? 1 : 10,
});

export const db = drizzle(sql, { schema });

export type Database = typeof db;
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/backend && npx tsc --noEmit`
Expected: FAIL — `./schema` does not exist yet (created in Task 9). This is expected; the client is committed alongside the schema.

- [ ] **Step 3: Commit** (deferred until Task 9 so the project typechecks)

This file is committed together with `schema.ts` in Task 9, Step 5.

---

### Task 5: Error-handler middleware (`core/middleware/error-handler.ts`)

**Files:**
- Create: `apps/backend/src/core/middleware/error-handler.ts`
- Test: `apps/backend/src/core/middleware/error-handler.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/core/middleware/error-handler.test.ts
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { errorHandler } from './error-handler';
import { NotFoundError } from '../errors';

function appThatThrows(err: unknown) {
  const app = new Hono();
  app.get('/boom', () => {
    throw err;
  });
  app.onError(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('maps AppError to its status and code', async () => {
    const res = await appThatThrows(new NotFoundError('No product')).request('/boom');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'No product' } });
  });

  it('maps unknown errors to 500 with a generic message', async () => {
    const res = await appThatThrows(new Error('db exploded')).request('/boom');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: { code: 'INTERNAL', message: 'Internal server error' },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/middleware/error-handler.test.ts`
Expected: FAIL — cannot find module `./error-handler`.

- [ ] **Step 3: Write `core/middleware/error-handler.ts`**

```ts
// src/core/middleware/error-handler.ts
import type { Context } from 'hono';
import { AppError } from '../errors';

export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status as never);
  }
  console.error('[unhandled]', err);
  return c.json({ error: { code: 'INTERNAL', message: 'Internal server error' } }, 500);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/middleware/error-handler.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/middleware/error-handler.ts src/core/middleware/error-handler.test.ts
git commit -m "feat(backend): error-handler middleware"
```

---

### Task 6: Test database helper (`core/test/db.ts`)

**Files:**
- Create: `apps/backend/src/core/test/db.ts`

(No test of its own — it is the harness later integration tests rely on. It is exercised the moment Task 11's repository test runs. Because it imports `client.ts`/`schema.ts` (Task 9) and needs the migrations folder (Task 10), it is committed in Task 10.)

- [ ] **Step 1: Write `core/test/db.ts`** — exports an opt-in `useTestDb()` that integration test files call at top level. Unit tests omit it and never touch Postgres.

```ts
// src/core/test/db.ts
import { beforeAll, beforeEach } from 'vitest';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from '../db/client';

let migrated = false;

export async function migrateTestDb(): Promise<void> {
  if (migrated) return;
  await migrate(db, { migrationsFolder: 'src/core/db/migrations' });
  migrated = true;
}

// Wipe every public table between tests. Order-independent thanks to CASCADE.
export async function truncateAll(): Promise<void> {
  const rows = await sql<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '__drizzle_migrations'
  `;
  if (rows.length === 0) return;
  const list = rows.map((r) => `"${r.tablename}"`).join(', ');
  await sql.unsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

// Call at the top level of an integration test file to migrate once + reset per test.
export function useTestDb(): void {
  beforeAll(async () => { await migrateTestDb(); });
  beforeEach(async () => { await truncateAll(); });
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/backend && npx tsc --noEmit`
Expected: FAIL — depends on `schema.ts`/`client.ts` (Task 9). Resolves and is committed in Task 10 once migrations exist.

- [ ] **Step 3: Commit** (deferred — committed in Task 10, Step 6, once migrations exist so the helper actually runs)

---

## PHASE 1 — Schema + Users Module

### Task 7: App factory + health route (`app.ts`)

**Files:**
- Create: `apps/backend/src/app.ts`
- Test: `apps/backend/src/app.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/app.test.ts
import { describe, it, expect } from 'vitest';
import { createApp } from './app';

describe('app', () => {
  it('GET /health returns ok', async () => {
    const app = createApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('unknown route returns 404 JSON', async () => {
    const app = createApp();
    const res = await app.request('/nope');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/app.test.ts`
Expected: FAIL — cannot find module `./app`.

- [ ] **Step 3: Write `app.ts`** (routes for users/auth are mounted in Tasks 17–18; start minimal)

```ts
// src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.onError(errorHandler);
  return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/app.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app.ts src/app.test.ts
git commit -m "feat(backend): app factory with health route"
```

---

### Task 8: Server entry point (`index.ts`)

**Files:**
- Create: `apps/backend/src/index.ts`

(No automated test — it only binds the app to a port. Verified manually.)

- [ ] **Step 1: Write `index.ts`**

```ts
// src/index.ts
import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './core/env';

const app = createApp();

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`BantuJual API listening on http://localhost:${info.port}`);
});
```

- [ ] **Step 2: Verify it boots** (requires a `.env` with a valid `DATABASE_URL`; for this smoke test the DB need not be reachable since no query runs yet)

Run: `cd apps/backend && npx tsx src/index.ts`
Expected: prints `BantuJual API listening on http://localhost:3000`. In another terminal: `curl localhost:3000/health` → `{"status":"ok"}`. Stop with Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat(backend): server entry point"
```

---

### Task 9: Database schema (`core/db/schema.ts`)

**Files:**
- Create: `apps/backend/src/core/db/schema.ts`
- Commit alongside: `apps/backend/src/core/db/client.ts` (from Task 4)
- Create: `apps/backend/drizzle.config.ts`

(No unit test — the schema is validated by migration generation in Task 10 and exercised by repository integration tests.)

- [ ] **Step 1: Write `core/db/schema.ts`**

```ts
// src/core/db/schema.ts
import {
  pgTable, pgEnum, uuid, text, integer, boolean, timestamp, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const genderEnum = pgEnum('gender', ['male', 'female']);

export const productCategoryEnum = pgEnum('product_category', [
  'komputer', 'handphone-tablet', 'elektronik-lain', 'fashion-pria',
  'fashion-wanita', 'sepatu-tas', 'rumah-tangga', 'mobil', 'motor',
  'properti', 'hobi-olahraga', 'alat-musik', 'bayi-anak',
  'kesehatan-kecantikan', 'makanan-minuman', 'lainnya',
]);

export const productConditionEnum = pgEnum('product_condition', [
  'Baru', 'Masih Bagus', 'Masih Layak', 'Apa adanya',
]);

export const productStatusEnum = pgEnum('product_status', ['active', 'sold', 'draft']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  gender: genderEnum('gender'),
  profileCompleted: boolean('profile_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('otp_codes_email_idx').on(t.email)]);

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('refresh_tokens_user_id_idx').on(t.userId)]);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: integer('price').notNull(), // rupiah
  description: text('description').notNull().default(''),
  category: productCategoryEnum('category').notNull(),
  condition: productConditionEnum('condition').notNull(),
  status: productStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('products_seller_id_idx').on(t.sellerId)]);

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
}, (t) => [index('product_images_product_id_idx').on(t.productId)]);

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text('text'),
  imageUrl: text('image_url'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('messages_conversation_id_idx').on(t.conversationId)]);

// ---- Relations ----
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, { fields: [products.sellerId], references: [users.id] }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  product: one(products, { fields: [conversations.productId], references: [products.id] }),
  buyer: one(users, { fields: [conversations.buyerId], references: [users.id] }),
  seller: one(users, { fields: [conversations.sellerId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));
```

- [ ] **Step 2: Write `drizzle.config.ts`**

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/core/db/schema.ts',
  out: './src/core/db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/backend && npx tsc --noEmit`
Expected: PASS — `client.ts` and `schema.ts` now resolve. (`test/db.ts` also resolves.)

- [ ] **Step 4: Commit**

```bash
git add src/core/db/schema.ts src/core/db/client.ts drizzle.config.ts
git commit -m "feat(backend): Drizzle schema, client, and config"
```

---

### Task 10: Generate + apply the first migration

**Files:**
- Create: `apps/backend/src/core/db/migrations/*` (generated)
- Create: `apps/backend/src/core/db/migrate.ts`
- Commit alongside: `apps/backend/src/core/test/db.ts` (from Task 6)

- [ ] **Step 1: Write the migration runner `core/db/migrate.ts`**

```ts
// src/core/db/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, sql } from './client';

async function main() {
  await migrate(db, { migrationsFolder: 'src/core/db/migrations' });
  await sql.end();
  console.log('Migrations applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Generate the migration SQL**

Run: `cd apps/backend && npx drizzle-kit generate`
Expected: a new file `src/core/db/migrations/0000_*.sql` plus a `meta/` folder. The SQL contains `CREATE TYPE ... gender`, `CREATE TABLE "users"`, etc.

- [ ] **Step 3: Apply migrations to the test DB** (Postgres must be running — see Testing Strategy)

Run: `cd apps/backend && NODE_ENV=test npx tsx src/core/db/migrate.ts`
Expected: prints `Migrations applied.` with no error.

- [ ] **Step 4: Typecheck — the test helper now resolves**

Run: `cd apps/backend && npx tsc --noEmit`
Expected: PASS — `client.ts`, `schema.ts`, and `test/db.ts` all resolve now that migrations exist.

- [ ] **Step 5: Confirm existing tests still pass** (none need the DB yet — the harness is first exercised in Task 11)

Run: `cd apps/backend && npm test`
Expected: PASS — env, errors, error-handler, app suites green.

- [ ] **Step 6: Commit**

```bash
git add src/core/db/migrations src/core/db/migrate.ts src/core/test/db.ts
git commit -m "feat(backend): initial migration + test DB harness"
```

---

### Task 11: Users repository (`modules/users/users.repository.ts`)

**Files:**
- Create: `apps/backend/src/modules/users/users.repository.ts`
- Test: `apps/backend/src/modules/users/users.repository.test.ts`

- [ ] **Step 1: Write the failing integration test**

```ts
// src/modules/users/users.repository.test.ts
import { describe, it, expect } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { usersRepository } from './users.repository';

useTestDb();

describe('usersRepository (integration)', () => {
  it('create then findByEmail returns the row', async () => {
    const created = await usersRepository.create({ email: 'a@example.com' });
    expect(created.id).toBeTruthy();
    expect(created.email).toBe('a@example.com');
    expect(created.profileCompleted).toBe(false);

    const found = await usersRepository.findByEmail('a@example.com');
    expect(found?.id).toBe(created.id);
  });

  it('findByEmail returns null when absent', async () => {
    expect(await usersRepository.findByEmail('missing@example.com')).toBeNull();
  });

  it('findById returns the row or null', async () => {
    const created = await usersRepository.create({ email: 'b@example.com' });
    expect((await usersRepository.findById(created.id))?.email).toBe('b@example.com');
    expect(await usersRepository.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
  });

  it('update patches fields and bumps updatedAt', async () => {
    const created = await usersRepository.create({ email: 'c@example.com' });
    const updated = await usersRepository.update(created.id, {
      name: 'Citra', gender: 'female', profileCompleted: true,
    });
    expect(updated.name).toBe('Citra');
    expect(updated.gender).toBe('female');
    expect(updated.profileCompleted).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/users/users.repository.test.ts`
Expected: FAIL — cannot find module `./users.repository`.

- [ ] **Step 3: Write `users.repository.ts`** (interface + Drizzle implementation)

```ts
// src/modules/users/users.repository.ts
import { eq } from 'drizzle-orm';
import { db } from '../../core/db/client';
import { users } from '../../core/db/schema';

export type User = typeof users.$inferSelect;

export interface CreateUserInput {
  email: string;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  gender?: 'male' | 'female';
  profileCompleted?: boolean;
}

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, patch: UpdateUserInput): Promise<User>;
}

export const usersRepository: UsersRepository = {
  async findById(id) {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  },

  async findByEmail(email) {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ?? null;
  },

  async create(input) {
    const [row] = await db.insert(users).values({ email: input.email }).returning();
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/users/users.repository.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/users/users.repository.ts src/modules/users/users.repository.test.ts
git commit -m "feat(backend): users repository"
```

---

### Task 12: Users service (`modules/users/users.service.ts`)

**Files:**
- Create: `apps/backend/src/modules/users/users.service.ts`
- Test: `apps/backend/src/modules/users/users.service.test.ts`

- [ ] **Step 1: Write the failing unit test** (uses an in-memory fake repo — no DB)

```ts
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
        gender: null, profileCompleted: false, createdAt: now, updatedAt: now,
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
    const svc = createUsersService(makeFakeRepo());
    const first = await svc.findOrCreateByEmail('x@example.com');
    const second = await svc.findOrCreateByEmail('x@example.com');
    expect(first.id).toBe(second.id);
  });

  it('getById throws NotFound when absent', async () => {
    const svc = createUsersService(makeFakeRepo());
    await expect(svc.getById('nope')).rejects.toMatchObject({ status: 404 });
  });

  it('updateProfile sets profileCompleted true when a name is provided', async () => {
    const repo = makeFakeRepo();
    const svc = createUsersService(repo);
    const u = await svc.findOrCreateByEmail('y@example.com');
    const updated = await svc.updateProfile(u.id, { name: 'Yuni', gender: 'female' });
    expect(updated.name).toBe('Yuni');
    expect(updated.profileCompleted).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/users/users.service.test.ts`
Expected: FAIL — cannot find module `./users.service`.

- [ ] **Step 3: Write `users.service.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/users/users.service.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/users/users.service.ts src/modules/users/users.service.test.ts
git commit -m "feat(backend): users service"
```

---

## PHASE 2 — Auth Module

### Task 13: JWT helpers (`core/jwt.ts`)

**Files:**
- Create: `apps/backend/src/core/jwt.ts`
- Test: `apps/backend/src/core/jwt.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/core/jwt.test.ts
import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken } from './jwt';
import { UnauthorizedError } from './errors';

describe('jwt', () => {
  it('round-trips a user id through an access token', async () => {
    const token = await signAccessToken('user-123');
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe('user-123');
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken('user-123');
    await expect(verifyAccessToken(token + 'x')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a malformed token', async () => {
    await expect(verifyAccessToken('not-a-jwt')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/jwt.test.ts`
Expected: FAIL — cannot find module `./jwt`.

- [ ] **Step 3: Write `core/jwt.ts`**

```ts
// src/core/jwt.ts
import { sign, verify } from 'hono/jwt';
import { env } from './env';
import { UnauthorizedError } from './errors';

export interface AccessPayload {
  sub: string;
  type: 'access';
  exp: number;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export async function signAccessToken(userId: string): Promise<string> {
  const payload: AccessPayload = {
    sub: userId,
    type: 'access',
    exp: nowSeconds() + env.ACCESS_TOKEN_TTL,
  };
  return sign(payload, env.JWT_ACCESS_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  try {
    const payload = (await verify(token, env.JWT_ACCESS_SECRET)) as unknown as AccessPayload;
    if (payload.type !== 'access') throw new Error('wrong token type');
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/jwt.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/jwt.ts src/core/jwt.test.ts
git commit -m "feat(backend): JWT access-token helpers"
```

---

### Task 14: Email service (`core/email.ts`)

**Files:**
- Create: `apps/backend/src/core/email.ts`
- Test: `apps/backend/src/core/email.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/core/email.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TestEmailService, sentOtps } from './email';

describe('TestEmailService', () => {
  beforeEach(() => { sentOtps.length = 0; });

  it('records the OTP it would have sent', async () => {
    const svc = new TestEmailService();
    await svc.sendOtp('a@example.com', '123456');
    expect(sentOtps).toEqual([{ email: 'a@example.com', code: '123456' }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/email.test.ts`
Expected: FAIL — cannot find module `./email`.

- [ ] **Step 3: Write `core/email.ts`**

```ts
// src/core/email.ts
import { Resend } from 'resend';
import { env } from './env';

export interface EmailService {
  sendOtp(email: string, code: string): Promise<void>;
}

// --- Test double: records what would have been sent ---
export const sentOtps: { email: string; code: string }[] = [];

export class TestEmailService implements EmailService {
  async sendOtp(email: string, code: string): Promise<void> {
    sentOtps.push({ email, code });
  }
}

// --- Dev double: logs to the console ---
export class ConsoleEmailService implements EmailService {
  async sendOtp(email: string, code: string): Promise<void> {
    console.log(`[email] OTP for ${email}: ${code}`);
  }
}

// --- Production: sends via Resend ---
export class ResendEmailService implements EmailService {
  private resend = new Resend(env.RESEND_API_KEY);
  async sendOtp(email: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Kode masuk BantuJual',
      text: `Kode verifikasi kamu: ${code}. Berlaku ${Math.floor(env.OTP_TTL / 60)} menit.`,
    });
  }
}

function pickEmailService(): EmailService {
  if (env.NODE_ENV === 'test') return new TestEmailService();
  if (env.RESEND_API_KEY) return new ResendEmailService();
  return new ConsoleEmailService();
}

export const emailService: EmailService = pickEmailService();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/email.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/core/email.ts src/core/email.test.ts
git commit -m "feat(backend): email service with test/console/resend impls"
```

---

### Task 15: Auth repository (`modules/auth/auth.repository.ts`)

**Files:**
- Create: `apps/backend/src/modules/auth/auth.repository.ts`
- Test: `apps/backend/src/modules/auth/auth.repository.test.ts`

- [ ] **Step 1: Write the failing integration test**

```ts
// src/modules/auth/auth.repository.test.ts
import { describe, it, expect } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { authRepository } from './auth.repository';
import { usersRepository } from '../users/users.repository';

useTestDb();

const future = () => new Date(Date.now() + 60_000);

describe('authRepository (integration)', () => {
  it('creates and finds the latest active OTP for an email', async () => {
    await authRepository.createOtp({ email: 'o@example.com', codeHash: 'h1', expiresAt: future() });
    const otp = await authRepository.findActiveOtp('o@example.com');
    expect(otp?.codeHash).toBe('h1');
    expect(otp?.consumedAt).toBeNull();
  });

  it('incrementAttempts and consume mutate the row', async () => {
    await authRepository.createOtp({ email: 'p@example.com', codeHash: 'h2', expiresAt: future() });
    const otp = (await authRepository.findActiveOtp('p@example.com'))!;
    await authRepository.incrementAttempts(otp.id);
    await authRepository.consumeOtp(otp.id);
    expect(await authRepository.findActiveOtp('p@example.com')).toBeNull(); // consumed → not active
  });

  it('refresh tokens: create, find valid by hash, revoke', async () => {
    const user = await usersRepository.create({ email: 'r@example.com' });
    await authRepository.createRefreshToken({ userId: user.id, tokenHash: 'rt-hash', expiresAt: future() });
    const found = await authRepository.findValidRefreshToken('rt-hash');
    expect(found?.userId).toBe(user.id);
    await authRepository.revokeRefreshToken(found!.id);
    expect(await authRepository.findValidRefreshToken('rt-hash')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/auth/auth.repository.test.ts`
Expected: FAIL — cannot find module `./auth.repository`.

- [ ] **Step 3: Write `auth.repository.ts`**

```ts
// src/modules/auth/auth.repository.ts
import { and, eq, gt, isNull, desc } from 'drizzle-orm';
import { db } from '../../core/db/client';
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

export const authRepository: AuthRepository = {
  async createOtp(input) {
    const [row] = await db.insert(otpCodes).values(input).returning();
    return row;
  },

  async findActiveOtp(email) {
    const [row] = await db
      .select().from(otpCodes)
      .where(and(
        eq(otpCodes.email, email),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.expiresAt, new Date()),
      ))
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
      .where(and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ))
      .limit(1);
    return row ?? null;
  },

  async revokeRefreshToken(id) {
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, id));
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/auth/auth.repository.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/auth.repository.ts src/modules/auth/auth.repository.test.ts
git commit -m "feat(backend): auth repository (otp + refresh tokens)"
```

---

### Task 16: Auth service + validation (`modules/auth/auth.service.ts`, `auth.validation.ts`)

**Files:**
- Create: `apps/backend/src/modules/auth/auth.validation.ts`
- Create: `apps/backend/src/modules/auth/auth.service.ts`
- Test: `apps/backend/src/modules/auth/auth.service.test.ts`

- [ ] **Step 1: Write `auth.validation.ts`**

```ts
// src/modules/auth/auth.validation.ts
import { z } from 'zod';

export const requestOtpSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
```

- [ ] **Step 2: Write the failing unit test** (fake auth repo + fake users service + fake email)

```ts
// src/modules/auth/auth.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthService } from './auth.service';
import type { AuthRepository, OtpCode, RefreshToken } from './auth.repository';
import type { User } from '../users/users.repository';

// --- fakes ---
function makeFakeAuthRepo() {
  const otps: OtpCode[] = [];
  const tokens: RefreshToken[] = [];
  let seq = 0;
  const repo: AuthRepository = {
    async createOtp(i) {
      const row: OtpCode = { id: `otp-${++seq}`, email: i.email, codeHash: i.codeHash, expiresAt: i.expiresAt, consumedAt: null, attempts: 0, createdAt: new Date() };
      otps.push(row); return row;
    },
    async findActiveOtp(email) {
      return [...otps].reverse().find((o) => o.email === email && !o.consumedAt && o.expiresAt > new Date()) ?? null;
    },
    async incrementAttempts(id) { const o = otps.find((x) => x.id === id)!; o.attempts += 1; },
    async consumeOtp(id) { const o = otps.find((x) => x.id === id)!; o.consumedAt = new Date(); },
    async createRefreshToken(i) {
      const row: RefreshToken = { id: `rt-${++seq}`, userId: i.userId, tokenHash: i.tokenHash, expiresAt: i.expiresAt, revokedAt: null, createdAt: new Date() };
      tokens.push(row); return row;
    },
    async findValidRefreshToken(h) { return tokens.find((t) => t.tokenHash === h && !t.revokedAt && t.expiresAt > new Date()) ?? null; },
    async revokeRefreshToken(id) { const t = tokens.find((x) => x.id === id)!; t.revokedAt = new Date(); },
  };
  return { repo, otps, tokens };
}

const fakeUser: User = {
  id: 'user-1', email: 'u@example.com', name: null, avatarUrl: null,
  gender: null, profileCompleted: false, createdAt: new Date(), updatedAt: new Date(),
};
const fakeUsersService = { findOrCreateByEmail: async () => fakeUser } as any;

let captured: { email: string; code: string }[];
const fakeEmail = { sendOtp: async (email: string, code: string) => { captured.push({ email, code }); } };

describe('authService', () => {
  beforeEach(() => { captured = []; });

  it('requestOtp stores a hashed code and emails the plaintext', async () => {
    const { repo, otps } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, email: fakeEmail });
    await svc.requestOtp('u@example.com');
    expect(captured).toHaveLength(1);
    expect(captured[0].code).toMatch(/^\d{6}$/);
    expect(otps[0].codeHash).not.toBe(captured[0].code); // stored hashed, not plaintext
  });

  it('verifyOtp returns tokens + user for the correct code', async () => {
    const { repo } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, email: fakeEmail });
    await svc.requestOtp('u@example.com');
    const result = await svc.verifyOtp('u@example.com', captured[0].code);
    expect(result.user.id).toBe('user-1');
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
  });

  it('verifyOtp rejects a wrong code and increments attempts', async () => {
    const { repo, otps } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, email: fakeEmail });
    await svc.requestOtp('u@example.com');
    await expect(svc.verifyOtp('u@example.com', '000000')).rejects.toMatchObject({ status: 401 });
    expect(otps[0].attempts).toBe(1);
  });

  it('verifyOtp throws 401 when there is no active code', async () => {
    const { repo } = makeFakeAuthRepo();
    const svc = createAuthService({ authRepo: repo, usersService: fakeUsersService, email: fakeEmail });
    await expect(svc.verifyOtp('nobody@example.com', '123456')).rejects.toMatchObject({ status: 401 });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/auth/auth.service.test.ts`
Expected: FAIL — cannot find module `./auth.service`.

- [ ] **Step 4: Write `auth.service.ts`**

```ts
// src/modules/auth/auth.service.ts
import { randomInt, createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../../core/env';
import { UnauthorizedError, TooManyAttemptsError } from '../../core/errors';
import { signAccessToken } from '../../core/jwt';
import { emailService, type EmailService } from '../../core/email';
import { usersService as defaultUsersService, type UsersService } from '../users/users.service';
import { authRepository, type AuthRepository } from './auth.repository';
import type { User } from '../users/users.repository';

export interface AuthDeps {
  authRepo: AuthRepository;
  usersService: UsersService;
  email: EmailService;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createAuthService(deps: AuthDeps) {
  const { authRepo, usersService, email } = deps;

  async function issueTokens(user: User): Promise<AuthResult> {
    const accessToken = await signAccessToken(user.id);
    const refreshToken = randomBytes(32).toString('hex');
    await authRepo.createRefreshToken({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000),
    });
    return { accessToken, refreshToken, user };
  }

  return {
    async requestOtp(emailAddr: string): Promise<void> {
      const code = generateOtpCode();
      const codeHash = await bcrypt.hash(code, 10);
      await authRepo.createOtp({
        email: emailAddr,
        codeHash,
        expiresAt: new Date(Date.now() + env.OTP_TTL * 1000),
      });
      await email.sendOtp(emailAddr, code);
      // Always resolves — no account enumeration at the route layer.
    },

    async verifyOtp(emailAddr: string, code: string): Promise<AuthResult> {
      const otp = await authRepo.findActiveOtp(emailAddr);
      if (!otp) throw new UnauthorizedError('Invalid or expired code');
      if (otp.attempts >= env.OTP_MAX_ATTEMPTS) throw new TooManyAttemptsError();

      const ok = await bcrypt.compare(code, otp.codeHash);
      if (!ok) {
        await authRepo.incrementAttempts(otp.id);
        throw new UnauthorizedError('Invalid or expired code');
      }

      await authRepo.consumeOtp(otp.id);
      const user = await usersService.findOrCreateByEmail(emailAddr);
      return issueTokens(user);
    },

    async refresh(refreshToken: string): Promise<AuthResult> {
      const existing = await authRepo.findValidRefreshToken(hashRefreshToken(refreshToken));
      if (!existing) throw new UnauthorizedError('Invalid refresh token');
      await authRepo.revokeRefreshToken(existing.id); // rotation
      const user = await usersService.getMe(existing.userId);
      return issueTokens(user);
    },

    async logout(refreshToken: string): Promise<void> {
      const existing = await authRepo.findValidRefreshToken(hashRefreshToken(refreshToken));
      if (existing) await authRepo.revokeRefreshToken(existing.id);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
export const authService = createAuthService({
  authRepo: authRepository,
  usersService: defaultUsersService,
  email: emailService,
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/auth/auth.service.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/modules/auth/auth.validation.ts src/modules/auth/auth.service.ts src/modules/auth/auth.service.test.ts
git commit -m "feat(backend): auth service + request validation"
```

---

### Task 17: Auth middleware + Hono typing (`core/middleware/auth.ts`, `types/hono.ts`)

**Files:**
- Create: `apps/backend/src/types/hono.ts`
- Create: `apps/backend/src/core/middleware/auth.ts`
- Test: `apps/backend/src/core/middleware/auth.test.ts`

- [ ] **Step 1: Write `types/hono.ts`**

```ts
// src/types/hono.ts
export interface AuthUser {
  id: string;
}

export interface AppVariables {
  user: AuthUser;
}
```

- [ ] **Step 2: Write the failing test**

```ts
// src/core/middleware/auth.test.ts
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { requireAuth } from './auth';
import { errorHandler } from './error-handler';
import { signAccessToken } from '../jwt';
import type { AppVariables } from '../../types/hono';

function protectedApp() {
  const app = new Hono<{ Variables: AppVariables }>();
  app.use('/me', requireAuth);
  app.get('/me', (c) => c.json({ id: c.get('user').id }));
  app.onError(errorHandler);
  return app;
}

describe('requireAuth', () => {
  it('rejects when no Authorization header is present', async () => {
    const res = await protectedApp().request('/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed bearer token', async () => {
    const res = await protectedApp().request('/me', { headers: { Authorization: 'Bearer garbage' } });
    expect(res.status).toBe(401);
  });

  it('passes through and sets c.var.user for a valid token', async () => {
    const token = await signAccessToken('user-42');
    const res = await protectedApp().request('/me', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'user-42' });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/middleware/auth.test.ts`
Expected: FAIL — cannot find module `./auth`.

- [ ] **Step 4: Write `core/middleware/auth.ts`**

```ts
// src/core/middleware/auth.ts
import type { Context, Next } from 'hono';
import { verifyAccessToken } from '../jwt';
import { UnauthorizedError } from '../errors';
import type { AppVariables } from '../../types/hono';

export async function requireAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token');
  }
  const token = header.slice('Bearer '.length);
  const payload = await verifyAccessToken(token);
  c.set('user', { id: payload.sub });
  await next();
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/core/middleware/auth.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types/hono.ts src/core/middleware/auth.ts src/core/middleware/auth.test.ts
git commit -m "feat(backend): requireAuth middleware + Hono variable typing"
```

---

### Task 18: Users routes (`modules/users/users.routes.ts`)

**Files:**
- Create: `apps/backend/src/modules/users/users.validation.ts`
- Create: `apps/backend/src/modules/users/users.routes.ts`
- Modify: `apps/backend/src/app.ts` (mount `/users`)
- Test: `apps/backend/src/modules/users/users.routes.test.ts`

- [ ] **Step 1: Write `users.validation.ts`**

```ts
// src/modules/users/users.validation.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  gender: z.enum(['male', 'female']).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

- [ ] **Step 2: Write the failing integration test**

```ts
// src/modules/users/users.routes.test.ts
import { describe, it, expect } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { signAccessToken } from '../../core/jwt';
import { usersRepository } from './users.repository';

useTestDb();

describe('users routes (integration)', () => {
  it('GET /users/:id returns a public profile', async () => {
    const u = await usersRepository.create({ email: 'pub@example.com' });
    await usersRepository.update(u.id, { name: 'Public Person' });
    const res = await createApp().request(`/users/${u.id}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: u.id, name: 'Public Person' });
  });

  it('GET /users/:id returns 404 for unknown id', async () => {
    const res = await createApp().request('/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('GET /users/me requires auth', async () => {
    const res = await createApp().request('/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /users/me returns the authenticated user', async () => {
    const u = await usersRepository.create({ email: 'me@example.com' });
    const token = await signAccessToken(u.id);
    const res = await createApp().request('/users/me', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: u.id, email: 'me@example.com' });
  });

  it('PATCH /users/me updates the profile and flips profileCompleted', async () => {
    const u = await usersRepository.create({ email: 'edit@example.com' });
    const token = await signAccessToken(u.id);
    const res = await createApp().request('/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Edited', gender: 'male' }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: 'Edited', profileCompleted: true });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/users/users.routes.test.ts`
Expected: FAIL — cannot find module `./users.routes` (and `/users/me` is not mounted yet).

- [ ] **Step 4: Write `users.routes.ts`**

```ts
// src/modules/users/users.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { usersService } from './users.service';
import { updateProfileSchema } from './users.validation';

export const usersRoutes = new Hono<{ Variables: AppVariables }>();

// Protected routes first so `/me` is not captured by `/:id`.
usersRoutes.get('/me', requireAuth, async (c) => {
  const user = await usersService.getMe(c.get('user').id);
  return c.json(user);
});

usersRoutes.patch('/me', requireAuth, zValidator('json', updateProfileSchema), async (c) => {
  const patch = c.req.valid('json');
  const updated = await usersService.updateProfile(c.get('user').id, patch);
  return c.json(updated);
});

usersRoutes.get('/:id', async (c) => {
  const profile = await usersService.getById(c.req.param('id'));
  return c.json(profile);
});
```

- [ ] **Step 5: Mount it in `app.ts`**

Modify `src/app.ts` — add the import and the `.route()` call, and type the app with `AppVariables`:

```ts
// src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', logger());

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.route('/users', usersRoutes);

  app.onError(errorHandler);
  return app;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/users/users.routes.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add src/modules/users/users.validation.ts src/modules/users/users.routes.ts src/app.ts src/modules/users/users.routes.test.ts
git commit -m "feat(backend): users routes (public profile + protected me)"
```

---

### Task 19: Auth routes (`modules/auth/auth.routes.ts`) + end-to-end login test

**Files:**
- Create: `apps/backend/src/modules/auth/auth.routes.ts`
- Modify: `apps/backend/src/app.ts` (mount `/auth`)
- Test: `apps/backend/src/modules/auth/auth.routes.test.ts`

- [ ] **Step 1: Write the failing end-to-end integration test**

```ts
// src/modules/auth/auth.routes.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useTestDb } from '../../core/test/db';
import { createApp } from '../../app';
import { sentOtps } from '../../core/email';

useTestDb();

async function json(res: Response) { return res.json() as Promise<any>; }

describe('auth routes (integration, full login flow)', () => {
  beforeEach(() => { sentOtps.length = 0; });

  it('request OTP → verify → use access token on /users/me → refresh', async () => {
    const app = createApp();

    // 1. Request OTP
    const reqRes = await app.request('/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'flow@example.com' }),
    });
    expect(reqRes.status).toBe(200);
    expect(await json(reqRes)).toEqual({ ok: true });
    expect(sentOtps).toHaveLength(1);
    const code = sentOtps[0].code;

    // 2. Verify OTP → tokens + user (new user auto-created)
    const verRes = await app.request('/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'flow@example.com', code }),
    });
    expect(verRes.status).toBe(200);
    const { accessToken, refreshToken, user } = await json(verRes);
    expect(user.email).toBe('flow@example.com');
    expect(user.profileCompleted).toBe(false);

    // 3. Use the access token
    const meRes = await app.request('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
    expect(meRes.status).toBe(200);
    expect((await json(meRes)).id).toBe(user.id);

    // 4. Refresh rotates the token
    const refRes = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    expect(refRes.status).toBe(200);
    const refreshed = await json(refRes);
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.refreshToken).not.toBe(refreshToken); // rotated

    // 5. Old refresh token is now revoked
    const reuseRes = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    expect(reuseRes.status).toBe(401);
  });

  it('verify with a wrong code returns 401', async () => {
    const app = createApp();
    await app.request('/auth/otp/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@example.com' }),
    });
    const res = await app.request('/auth/otp/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@example.com', code: '000000' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects an invalid email shape with 400', async () => {
    const res = await createApp().request('/auth/otp/request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/auth/auth.routes.test.ts`
Expected: FAIL — cannot find module `./auth.routes` / `/auth` not mounted.

- [ ] **Step 3: Write `auth.routes.ts`**

```ts
// src/modules/auth/auth.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { AppVariables } from '../../types/hono';
import { authService } from './auth.service';
import { usersService } from '../users/users.service';
import { requestOtpSchema, verifyOtpSchema, refreshSchema } from './auth.validation';

export const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.post('/otp/request', zValidator('json', requestOtpSchema), async (c) => {
  const { email } = c.req.valid('json');
  await authService.requestOtp(email);
  return c.json({ ok: true });
});

authRoutes.post('/otp/verify', zValidator('json', verifyOtpSchema), async (c) => {
  const { email, code } = c.req.valid('json');
  const result = await authService.verifyOtp(email, code);
  return c.json(result);
});

authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  const result = await authService.refresh(refreshToken);
  return c.json(result);
});

authRoutes.post('/logout', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  await authService.logout(refreshToken);
  return c.json({ ok: true });
});

authRoutes.get('/me', requireAuth, async (c) => {
  const user = await usersService.getMe(c.get('user').id);
  return c.json(user);
});
```

- [ ] **Step 4: Mount it in `app.ts`**

Modify `src/app.ts` — add the import and `.route('/auth', authRoutes)`:

```ts
// src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';
import { authRoutes } from './modules/auth/auth.routes';

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', logger());

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);

  app.onError(errorHandler);
  return app;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/backend && NODE_ENV=test npx vitest run src/modules/auth/auth.routes.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/modules/auth/auth.routes.ts src/app.ts src/modules/auth/auth.routes.test.ts
git commit -m "feat(backend): auth routes + end-to-end login flow test"
```

---

### Task 20: CORS for web + final verification

**Files:**
- Create: `apps/backend/src/core/middleware/cors.ts`
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Write `core/middleware/cors.ts`**

```ts
// src/core/middleware/cors.ts
import { cors } from 'hono/cors';
import { env } from '../env';

export const corsMiddleware = cors({
  origin: env.WEB_ORIGIN,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

- [ ] **Step 2: Wire it into `app.ts`** (before routes)

Modify `src/app.ts` to add the import and `app.use('*', corsMiddleware)` immediately after the logger:

```ts
// src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import { corsMiddleware } from './core/middleware/cors';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';
import { authRoutes } from './modules/auth/auth.routes';

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', logger());
  app.use('*', corsMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);

  app.onError(errorHandler);
  return app;
}
```

- [ ] **Step 3: Run the full test suite**

Run: `cd apps/backend && npm test`
Expected: ALL tests pass across env, errors, error-handler, app, jwt, email, auth middleware, users repository/service/routes, auth repository/service/routes.

- [ ] **Step 4: Typecheck**

Run: `cd apps/backend && npm run typecheck`
Expected: PASS, no errors.

- [ ] **Step 5: Manual smoke test against a dev DB** (optional but recommended)

With a real `.env` (`DATABASE_URL` reachable, migrations applied via `npm run db:migrate`):
```bash
npm run dev
# new terminal:
curl -X POST localhost:3000/auth/otp/request -H 'Content-Type: application/json' -d '{"email":"you@example.com"}'
# read the OTP from the server console (ConsoleEmailService), then:
curl -X POST localhost:3000/auth/otp/verify -H 'Content-Type: application/json' -d '{"email":"you@example.com","code":"<CODE>"}'
```
Expected: `verify` returns `{ accessToken, refreshToken, user }`.

- [ ] **Step 6: Commit**

```bash
git add src/core/middleware/cors.ts src/app.ts
git commit -m "feat(backend): CORS middleware for web client"
```

---

## Done — what this delivers

- A booting Hono API with `/health`.
- Postgres schema for the full marketplace domain (users, otp, refresh tokens, products, product images, conversations, messages) with one migration applied.
- A complete, tested **email-OTP login flow**: `POST /auth/otp/request` → `POST /auth/otp/verify` → access + refresh tokens → `GET /users/me` → `POST /auth/refresh` (with rotation) → `POST /auth/logout`.
- Public seller profile (`GET /users/:id`) and profile completion (`PATCH /users/me`).
- CORS so the future web client can call the same API.

**Next plans (separate):** Phase 3 — Products module (CRUD, search/filter, image uploads to R2/S3). Phase 4 — Chat module (conversations + messages, then realtime). Phase 5 — Orders (when the transaction flow is decided).
