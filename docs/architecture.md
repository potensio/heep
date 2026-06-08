# Architecture

## Stack

| Layer | Technology |
|---|---|
| API | Hono on Cloudflare Workers |
| Database | Supabase (PostgreSQL) via Drizzle ORM |
| Auth | JWT (access + refresh tokens) |
| Data source | Bubble.io (via workflow API) |
| Real-time | Cloudflare Durable Objects + WebSocket |

## Request Flow

### REST
```
Mobile → CF Worker → Bubble.io workflow API
                   → Supabase (user/auth data)
```

### Real-time
```
Bubble.io trigger → POST /internal/webhook → CF Worker → Durable Object → WebSocket → Mobile
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Login, returns JWT + stores Bubble token |
| POST | `/auth/signup` | Signup |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/auth/me` | Current user |
| GET | `/conversations` | Paginated conversation list |
| GET | `/conversations/:id/messages` | Paginated messages |
| GET | `/ws` | WebSocket connection (real-time) |
| POST | `/internal/webhook` | Bubble.io database trigger receiver |

## Auth Flow

1. Login → Worker calls Bubble.io → gets Bubble token → stores in `users.bubble_token`
2. Issues our own JWT (15min access, 30day refresh)
3. All protected routes validate JWT via `requireAuth` middleware

## Conversations Real-time

- `GET /ws` — Mobile authenticates via JWT, connects to user's `ConnectionManager` DO instance
- `POST /internal/webhook` — Bubble.io fires this on conversation/message change; Worker routes event to the correct DO; DO pushes to connected mobile client
- One DO instance per user, keyed by user ID

## Key Design Decisions

- **Bubble.io as data source** — conversations/messages live in Bubble.io, accessed via user-scoped workflow API calls using the stored `bubble_token`
- **Supabase for auth state only** — users, refresh tokens, and `bubble_token` stored here; not conversation data
- **No caching layer** — Bubble.io is the single source of truth; DO is a relay only (stateless)
- **Pagination** — offset-based via `cursor` + `limit` params, matching Bubble.io's Data API convention

## Environment

Secrets set via `wrangler secret put` — never in `wrangler.toml`.
Local dev uses `.dev.vars` (loaded automatically by Wrangler and Drizzle Kit).
