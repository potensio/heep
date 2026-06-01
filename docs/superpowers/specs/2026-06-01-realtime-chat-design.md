# Real-Time Chat — Design Spec

**Date:** 2026-06-01  
**Status:** Approved

---

## Overview

Wire up the existing chat UI and schema to a real-time WebSocket backend. The backend will be fully deployed on Cloudflare Workers with Durable Objects handling persistent WebSocket connections. The existing PostgreSQL schema on Neon is retained as-is.

---

## Architecture

```
Mobile App (React Native)
    │
    ├── REST calls ──────────→ Cloudflare Worker (Hono)
    │                              ├── /auth, /users, /products (existing)
    │                              └── /chat/* (new)
    │
    └── WebSocket ───────────→ Durable Object: ChatRoomDO
                                   ├── 1 DO instance per conversation
                                   ├── Manages active WS connections via Hibernation API
                                   └── Persists messages to Neon
                                            │
                                            ▼
                                       Neon Postgres (existing schema)
```

### Infrastructure

| Concern | Solution |
|---|---|
| Runtime | Cloudflare Workers |
| Real-time | Durable Objects + WebSocket Hibernation API |
| Database | Neon Postgres (existing schema, HTTP driver) |
| Deployment | Wrangler CLI |
| Local dev | `wrangler dev` (emulates DO locally) |

**Cost:** Cloudflare Workers paid plan ($5/month). DO idle time not billed due to Hibernation API. Comfortably supports 10k–50k MAU before meaningful extra cost.

---

## Backend Changes

### Migration from Node.js

| Before | After |
|---|---|
| `@hono/node-server` + `serve()` | CF Workers `export default { fetch }` |
| `postgres` (TCP) | `@neondatabase/serverless` (HTTP) |
| `bcryptjs` | Web Crypto API (`crypto.subtle`) |
| `tsx watch` / `node dist/index.js` | `wrangler dev` / `wrangler deploy` |

### New files

```
apps/backend/
├── wrangler.toml                         ← CF Workers config + DO bindings
└── src/
    ├── index.ts                          ← CHANGED: CF Workers export
    ├── core/
    │   ├── crypto.ts                     ← NEW: Web Crypto replacements for bcryptjs
    │   └── db/client.ts                  ← CHANGED: Neon serverless driver
    └── modules/
        └── chat/
            ├── chat.routes.ts            ← REST endpoints
            ├── chat.repository.ts        ← Neon queries (conversations + messages)
            ├── chat.service.ts           ← business logic
            └── ChatRoomDO.ts             ← Durable Object class
```

### `wrangler.toml`

```toml
name = "bantujual-api"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "CHAT_ROOM"
class_name = "ChatRoomDO"

[[migrations]]
tag = "v1"
new_classes = ["ChatRoomDO"]
```

Secrets (`DATABASE_URL`, `JWT_SECRET`, etc.) set via `wrangler secret put`.

### `src/index.ts`

```ts
export default { fetch: app.fetch }
export { ChatRoomDO } from './modules/chat/ChatRoomDO'
```

### `src/core/crypto.ts`

Replaces bcryptjs with Web Crypto API:
- OTP hashing: `crypto.subtle.digest('SHA-256', data)`
- Token hashing: same, with a secret-keyed HMAC

No schema changes required.

---

## REST API

All routes require `Authorization: Bearer <token>` except where noted.

```
POST /chat/conversations
  body: { productId }
  → creates conversation if not exists, returns conversation

GET  /chat/conversations
  → list of user's conversations with last message + unread count

GET  /chat/conversations/:id
  → conversation detail

GET  /chat/conversations/:id/messages?cursor=&limit=50
  → paginated message history (newest first)

GET  /chat/conversations/:id/ws
  → WebSocket upgrade (token via ?token= query param)
```

---

## WebSocket Protocol

Connection: `wss://api.bantujual.com/chat/conversations/:id/ws?token=<jwt>`

Auth is validated on connect. Invalid token closes the connection immediately with code 4001.

### Message shapes

**Client → Server**
```json
{ "type": "message", "text": "Harga bisa kurang?" }
{ "type": "message", "text": null, "imageUrl": "https://..." }
{ "type": "read", "messageId": "uuid" }
```

**Server → Client**
```json
{ "type": "history", "messages": [...] }
{ "type": "message", "id": "uuid", "senderId": "uuid", "text": "...", "imageUrl": null, "createdAt": "ISO8601" }
{ "type": "read", "messageId": "uuid" }
{ "type": "error", "message": "Unauthorized" }
```

On connect, server sends a `history` event with the last 50 messages before entering hibernation.

---

## Durable Object: `ChatRoomDO`

One instance per `conversationId`. Uses the **WebSocket Hibernation API** — DO is only active (and billed) while processing a message event, not during idle connection time.

### Lifecycle

```
Client connects
  → DO wakes (or is created)
  → Validates JWT from query param
  → Validates sender is conversation participant (buyer or seller)
  → Accepts WebSocket via state.acceptWebSocket(ws)
  → Sends "history" event (last 50 messages from Neon)
  → Hibernates

Client sends message
  → DO wakes via webSocketMessage()
  → Validates message shape
  → Persists to Neon (messages table)
  → Broadcasts to all connected sockets
  → Hibernates

Client disconnects
  → DO wakes via webSocketClose()
  → No-op (Hibernation API handles cleanup)
  → Hibernates
```

### Security

- Sender verified against `conversations.buyerId` / `conversations.sellerId` on every message
- A user can only connect to conversations they participate in
- Messages with neither `text` nor `imageUrl` are rejected

---

## Mobile Changes

### New hook: `features/chat/hooks/useChatRoom.ts`

Owns the WebSocket connection lifecycle for a conversation.

**Returns:** `{ messages, status, send }`

**Behavior:**
- Opens WS on mount, closes on unmount
- Populates `messages` from the `history` event on connect
- Appends incoming `message` events to state
- `send(text, imageUrl?)` serializes and sends to server
- `status`: `'connecting' | 'connected' | 'disconnected'`
- Reconnects with exponential backoff on unexpected disconnect (MVP: simple retry after 3s)

### `ChatRoomScreen` changes

- Remove `initialMessages` prop (data comes from hook)
- Replace local `useState` + `handleSend` with `useChatRoom(conversation.id)`
- Add connection status indicator (subtle — e.g. grey dot when disconnected)

### `ConversationListScreen` changes

- Replace mock data with REST `GET /chat/conversations`
- No real-time required on list screen for MVP (refresh on focus)

---

## Error Handling

| Scenario | Behavior |
|---|---|
| WS connect with invalid token | Server closes with code 4001 |
| Message from non-participant | Server closes with code 4003 |
| Neon write fails | Server sends `error` event, does not broadcast |
| Client loses connection | Hook retries after 3s (MVP), exponential backoff post-MVP |
| DO cold start latency | Acceptable — happens only on first message in a conversation |

---

## Out of Scope (MVP)

- Push notifications for messages received while app is backgrounded
- Typing indicators
- Message delivery receipts (sent vs delivered vs read UI)
- Image upload in chat (schema supports `imageUrl` but upload flow not designed here)
- Read receipts synced across devices in real-time
