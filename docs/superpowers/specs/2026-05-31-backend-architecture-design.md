# Backend Architecture — Design

**Date:** 2026-05-31
**Status:** Approved (design phase)
**Scope:** Initial backend for BantuJual (`apps/backend`) — stack, folder structure, layering conventions, data model, auth module, and build roadmap.

---

## 1. Goals & Constraints

- Stand up the backend for the BantuJual second-hand marketplace. `apps/backend` is currently empty — this is greenfield.
- Serve **both** the mobile app (Expo/React Native, already built) and a future web app from **one API**.
- Mirror the mobile app's **feature-first / module-based** organization so the team reads both sides the same way.
- Keep it lightweight and pragmatic — this is a weekend/side project, so favor velocity and YAGNI over dogmatic layering.

## 2. Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | **Hono** | TypeScript-first, fast, lightweight; shares the language with mobile. |
| Runtime | **Node.js** | Widest ecosystem, long-lived DB connections (needed for chat realtime later), runs anywhere; Hono code stays portable to Bun later. |
| Database | **Neon (serverless Postgres)** | Relational fits a marketplace's foreign keys (orders→products→users, conversations→messages). Works on Node via Neon's driver + pooling. |
| ORM / data access | **Drizzle ORM** | Lightweight, TypeScript-native, SQL-like, type-safe; pairs cleanly with a repository layer. |
| Auth | **Self-hosted**: JWT access/refresh + OTP codes in DB | Full control, no vendor lock-in, fits the hand-rolled stack. |
| Email delivery | **Resend** | Best DX for transactional email; isolated behind a small `core/email.ts` interface so it's swappable. |
| Validation | **Zod** (`@hono/zod-validator`) | Request-shape validation at the route boundary. |
| Image storage | **Cloudflare R2 / S3** (presigned uploads) | Decided in Phase 3; keeps blobs out of Postgres. |

## 3. Architecture: Module-based with light internal layering

Each domain is a self-contained **module** (`auth`, `users`, `products`, `chat`, later `orders`). Inside each module is a thin vertical slice:

```
route  →  service  →  repository  →  db
(HTTP)    (logic)     (data access)
```

The dependency direction always points **inward**. A layer never imports the layer above it. This delivers clean-architecture benefits (clear boundaries, testable services, data-access details isolated) without DI-framework ceremony, and matches the mobile app's `features/<name>/` convention.

### Folder structure

```
apps/backend/
├── src/
│   ├── index.ts                  # entry: create app, start server
│   ├── app.ts                    # app factory (mount routes + global middleware) — testable
│   │
│   ├── core/                     # shared infrastructure — NO business logic
│   │   ├── db/
│   │   │   ├── client.ts         # Neon + Drizzle client singleton
│   │   │   ├── schema.ts         # ALL tables + relations (single file)
│   │   │   └── migrations/       # drizzle-kit generated SQL
│   │   ├── env.ts                # Zod-validated env vars — fail fast on boot
│   │   ├── errors.ts             # AppError + typed errors (NotFound, Unauthorized, …)
│   │   ├── jwt.ts                # sign/verify access + refresh tokens
│   │   ├── email.ts              # email-send interface (Resend impl behind it)
│   │   └── middleware/
│   │       ├── auth.ts           # verify JWT, set c.var.user
│   │       ├── cors.ts           # allow web origin (mobile doesn't need it)
│   │       ├── error-handler.ts  # map thrown errors → HTTP responses
│   │       └── logger.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts        # HTTP layer only
│   │   │   ├── auth.service.ts       # business logic
│   │   │   ├── auth.repository.ts    # DB access (otpCodes, refreshTokens)
│   │   │   └── auth.validation.ts    # Zod request schemas
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── users.validation.ts
│   │   ├── products/                 # same shape
│   │   └── chat/                     # conversations + messages
│   │
│   └── types/                    # shared TS types (e.g. Hono Variables: { user })
│
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

### Conventions (mirroring mobile)

- **No barrel exports** between modules — import directly to the target file.
- A module **never imports another module's repository**. Cross-module data goes through that module's **service** (e.g. `products.service` asks `users.service` for a seller). Keeps boundaries honest.
- **`core/` holds no business logic** — only plumbing (db, jwt, email, errors, middleware, env).
- **Single `schema.ts`** holds all tables + relations. Chosen over per-module schema files because the tables are highly relational (foreign keys + Drizzle `relations()` are simpler in one scope) and Drizzle Kit wants one entry point. Escape hatch if it grows past ~20 tables: split into `core/db/schema/*.ts` with a barrel — a later refactor, not a day-one concern.
- **Only repositories import from `schema.ts`** — services and routes never touch Drizzle tables directly.
- **File naming:** `<module>.<layer>.ts` (e.g. `auth.service.ts`). Flat, one file per layer; subfolders only if a module grows multiple services.

## 4. Layering Contract

**Route (`*.routes.ts`) — HTTP layer. Thin, like mobile's `app/` wrappers.**
- Defines the Hono router and paths.
- Validates input shape with the Zod schema (`@hono/zod-validator`).
- Reads `c.var.user` (set by auth middleware), pulls validated body/params.
- Calls **one** service method, maps the result to an HTTP response.
- No business logic, no DB access.

```ts
// auth.routes.ts
auth.post('/otp/request', zValidator('json', requestOtpSchema), async (c) => {
  const { email } = c.req.valid('json');
  await authService.requestOtp(email);
  return c.json({ ok: true });
});
```

**Service (`*.service.ts`) — business logic. The brain.**
- Orchestrates the use case; enforces domain rules (OTP generation, hashing, token minting, ownership checks).
- Calls its own repository, and **other modules' services** for their data — never another module's repository.
- Throws typed errors from `core/errors.ts`; the error-handler middleware maps them to HTTP responses.
- **Knows nothing about Hono** — no `c`, no request/response objects. Takes plain args, returns plain data. This is what makes it unit-testable.

**Repository (`*.repository.ts`) — data access. The only place Drizzle lives.**
- Imports tables from `core/db/schema.ts`, runs queries, returns plain typed objects.
- No business logic — e.g. it returns the OTP row; the service decides what "expired" means.

**Validation (`*.validation.ts`)** — Zod schemas for request shapes only. Domain rules (e.g. "email not already registered") live in the service.

## 5. Data Model (`core/db/schema.ts`)

Derived from the mobile types. **Price is stored as an integer in rupiah** (IDR has no practical sub-unit). **Product photos are a separate table** (the mobile form holds a photo array). **`unreadCount` is computed per-user at query time**, not stored.

### `users` — identity + profile
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | text, unique, not null | login identity |
| `name` | text, nullable | filled at complete-profile |
| `avatarUrl` | text, nullable | |
| `gender` | enum, nullable | from `GenderSelector` |
| `profileCompleted` | boolean, default false | gates complete-profile step |
| `createdAt` / `updatedAt` | timestamptz | |

### `otpCodes` — short-lived login codes (auth module)
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `email` | text, not null, indexed | |
| `codeHash` | text | hashed; never store the raw code |
| `expiresAt` | timestamptz | e.g. 5 min |
| `consumedAt` | timestamptz, nullable | single-use |
| `attempts` | int, default 0 | brute-force guard |

### `refreshTokens` — session/rotation (auth module)
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `userId` | uuid FK → users | |
| `tokenHash` | text | |
| `expiresAt` | timestamptz | ~30 days |
| `revokedAt` | timestamptz, nullable | |

### `products`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `sellerId` | uuid FK → users | |
| `name` | text | |
| `price` | integer | rupiah |
| `description` | text | |
| `category` | enum | 16 `ProductCategory` values |
| `condition` | enum | 4 `ProductCondition` values |
| `status` | enum: `active` / `sold` / `draft`, default `active` | |
| `createdAt` / `updatedAt` | timestamptz | |

### `productImages`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `productId` | uuid FK → products (cascade delete) | |
| `url` | text | |
| `position` | int | ordering of the photo array |

### `conversations` — one per (product, buyer, seller)
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `productId` | uuid FK → products | |
| `buyerId` | uuid FK → users | |
| `sellerId` | uuid FK → users | |
| `createdAt` / `updatedAt` | timestamptz | `updatedAt` drives list sort |

### `messages`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `conversationId` | uuid FK → conversations (cascade) | |
| `senderId` | uuid FK → users | |
| `text` | text, nullable | text OR image |
| `imageUrl` | text, nullable | |
| `readAt` | timestamptz, nullable | drives `unreadCount` |
| `createdAt` | timestamptz | |

### `orders` — **deferred**
Not in the initial schema. The mobile `OrdersScreen` is WIP with no route, and a chat-first second-hand marketplace typically lets buyers/sellers arrange deals in chat. Add once the transaction flow is decided.

## 6. Auth Module (first real feature)

Built first because every other module depends on an authenticated user.

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `POST` | `/auth/otp/request` | `{ email }` → generate OTP, store hash, email it | public |
| `POST` | `/auth/otp/verify` | `{ email, code }` → verify, find-or-create user, issue tokens | public |
| `POST` | `/auth/refresh` | `{ refreshToken }` → rotate, issue new access token | public |
| `POST` | `/auth/logout` | revoke the refresh token | bearer |
| `GET` | `/auth/me` | return current user (drives mobile `AuthContext`) | bearer |

### Flow, mapped to mobile screens
1. **EmailScreen** → `POST /auth/otp/request`. Generate a 6-digit code, store `codeHash` + `expiresAt` (~5 min), send via Resend. Always returns `{ ok: true }` even if the email is unknown (no account enumeration).
2. **OtpScreen** → `POST /auth/otp/verify`. Check code (not expired, not consumed, `attempts` under limit), mark consumed. If no user exists for the email, **create one** with `profileCompleted: false`. Mint access token (~15 min JWT) + refresh token (~30 days, hash stored). Return `{ accessToken, refreshToken, user }`.
3. **CompleteProfileScreen** → `PATCH /users/me` with `{ name, gender, avatarUrl }` (users module), flipping `profileCompleted: true`.
4. **Mobile `AuthContext`** stores tokens, calls `GET /auth/me` on boot to rehydrate, uses `/auth/refresh` on access-token expiry.

### Security defaults
OTP codes hashed at rest, single-use, expiring, attempt-limited. Refresh tokens hashed + rotated on every use. No account enumeration. Short-lived access tokens.

## 7. One API for Mobile + Web

Both clients hit the same endpoints. They differ only in:
1. **Token storage** — mobile uses secure storage; web uses an httpOnly cookie (or localStorage for an MVP). Same verify response; the client decides where to store tokens.
2. **CORS** — a `core/middleware/cors.ts` allows the web origin. Mobile is unaffected.

No separate API, no versioning until a real divergence appears (YAGNI).

## 8. Build Roadmap

**Phase 0 — Project setup.** `npm init`; install Hono + `@hono/node-server`, Drizzle + `drizzle-kit`, Neon driver, Zod, bcrypt/argon2, JWT lib, Resend. Build `core/env.ts`, `core/db/client.ts`, `drizzle.config.ts`, `core/errors.ts` + error-handler + logger middleware, `app.ts` + `index.ts`, and a `GET /health` route to prove it boots.

**Phase 1 — Schema + users module.** Write all tables in `schema.ts`, generate + run the first migration. Build `users`: `GET /users/me`, `PATCH /users/me`, `GET /users/:id`.

**Phase 2 — Auth module** (first real feature). `core/jwt.ts` + `core/email.ts`, the 5 auth endpoints, then the `auth` middleware. Mobile can fully log in at this point.

**Phase 3 — Products module.** CRUD + list/search/filter (mobile search screen) + image upload (decide Cloudflare R2 / S3 presigned uploads here).

**Phase 4 — Chat module.** Conversations + messages over REST first (client polling); add realtime (SSE/WebSocket) later only if needed.

**Phase 5 — Orders** (deferred — revisit once the transaction flow is decided).

Order is strictly dependency-driven: setup → schema/users → auth, then products and chat both hang off authenticated users.
