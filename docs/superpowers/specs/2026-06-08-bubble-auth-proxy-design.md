# Auth via Bubble.io Proxy — Design Spec

**Date:** 2026-06-08
**Status:** Approved

---

## Context

90% of application data, including user accounts and credentials, currently lives in Bubble.io. The React Native app needs to support user login and signup while this migration is still in early stages. The goal is to implement authentication now in a way that fully decouples the mobile app from Bubble.io, so that when the full migration eventually happens, only the Hono backend needs to change — not the mobile app.

---

## Architecture

```
Mobile
  │
  ├─ POST /auth/login    { email, password }
  ├─ POST /auth/signup   { firstName, lastName, email, password }
  │
  ▼
Hono Backend (proxy layer)
  │
  ├─ Validates credentials against Bubble.io API
  ├─ Upserts user in Supabase Postgres via Drizzle
  └─ Issues its own JWT (access + refresh tokens)
  │
  ├─────────────────────────────────┐
  ▼                                 ▼
Supabase Postgres              Bubble.io
(shadow users + refresh_tokens) (credentials + all app data)
```

Mobile never communicates with Bubble.io directly. Supabase holds a shadow user record — enough to resolve a JWT to a user identity. All application data fetches go through Hono → Bubble.io using the Bubble.io admin API key.

---

## Database

### Supabase Setup

Supabase is used as a hosted Postgres database only. Supabase Auth is not used. Schema is managed entirely via Drizzle ORM — no manual table creation in the Supabase console.

Migration workflow:
1. Modify `apps/backend/src/core/db/schema.ts`
2. Run `drizzle-kit generate` to produce SQL migration file
3. Run `drizzle-kit migrate` (or the existing `src/core/db/migrate.ts`) to apply

Each environment (dev, prod) has its own Supabase project and `DATABASE_URL` env var. The same migration command works for both.

### Schema Change

Add `bubble_id` to the `users` table:

```sql
ALTER TABLE users ADD COLUMN bubble_id text UNIQUE;
```

This links a Hono user record to its Bubble.io counterpart, enabling Hono to make user-scoped data calls to Bubble.io on behalf of the user.

---

## Auth Flows

### Login

```
Mobile  → POST /auth/login { email, password }
Hono    → POST bubble.io/api/1.1/user/login { email, password }
Bubble  → { status: "success", response: { token, user_id } }
Hono    → upsert users SET bubble_id = user_id WHERE email = email
Hono    → issue accessToken + refreshToken (Hono JWT)
Mobile ← { accessToken, refreshToken, user }
```

If Bubble.io returns an error, Hono returns `401 Unauthorized`. The Bubble.io session token is used only to confirm identity and then discarded — it is never stored.

### Signup

```
Mobile  → POST /auth/signup { firstName, lastName, email, password }
Hono    → POST bubble.io/api/1.1/wf/signup (custom workflow)
         Headers: Authorization: Bearer <BUBBLE_API_KEY>
         Body: { email, password, firstName, lastName }
Bubble  → creates user, returns { status: "success", response: { user_id } }
Hono    → INSERT INTO users { email, name: firstName + " " + lastName, bubble_id }
Hono    → issue accessToken + refreshToken (Hono JWT)
Mobile ← { accessToken, refreshToken, user }
```

Signup requires a custom Bubble.io workflow endpoint because the built-in Data API does not support creating users with passwords. This workflow must be created in Bubble.io, accept `Authorization: Bearer` header for security, and return at minimum `{ user_id }` on success.

If Bubble.io returns a conflict (email already registered), Hono returns `409 Conflict`.

### Token Refresh & Logout

Unchanged from existing implementation — Hono already handles refresh token rotation and revocation.

---

## Bubble.io Integration

### Credentials Storage

`BUBBLE_API_URL` and `BUBBLE_API_KEY` are stored as Hono environment variables. The admin API key is used for all Bubble.io calls from the backend.

### Endpoints Used

| Purpose | Method | Bubble.io Endpoint |
|---------|--------|--------------------|
| Login (verify credentials) | POST | `/api/1.1/user/login` (built-in) |
| Signup (create user) | POST | `/api/1.1/wf/signup` (custom workflow) |

### Future Data Calls

When fetching Bubble.io data for a user (conversations, listings, etc.), Hono uses `bubble_id` + admin API key. The mobile app remains unaware of Bubble.io throughout.

---

## Changes to Existing Hono Auth

The existing OTP-based auth system (`/auth/otp/request`, `/auth/otp/verify`) is **removed** and replaced with email+password routes that proxy to Bubble.io. The JWT issuance, refresh token rotation, and logout logic remain unchanged.

New routes:
- `POST /auth/login`
- `POST /auth/signup`

Kept as-is:
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

---

## Mobile Changes

The login and signup screens already have the correct email+password forms — no UI changes needed. The OTP screen is removed. Auth hooks are wired to the new Hono endpoints.

---

## Out of Scope

- Password reset / forgot password (Bubble.io handles this via its own flow for now)
- Social login
- Migration of existing Bubble.io credentials to Hono-native auth
- Supabase Auth
