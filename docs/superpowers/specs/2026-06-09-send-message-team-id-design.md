# Send Message + Team ID Design

**Date:** 2026-06-09  
**Status:** Approved

---

## Goal

Wire up the `/hono-conversations-send` Bubble.io workflow action so users can send messages from the chat detail screen, and propagate `team_id` through the auth flow so real-time WebSocket notifications reach all members of the same team.

---

## Architecture

```
Mobile
  → POST /conversations/:id/messages  (JWT auth)
  → Hono Worker validates JWT, calls BUBBLE_API_URL/hono-conversations-send
  → Bubble processes message, fires webhook → POST /internal/webhook
  → Worker routes to ConnectionManager DO keyed by team_id
  → DO pushes WS event to all connected team members
  → useConversationsSocket.onmessage → invalidateQueries(['conversations'])
  → React Query refetches, sent message + any replies appear
```

**Optimistic UX:** The sent message is appended to the local cache immediately (optimistic update) so it appears instantly. When the WebSocket push triggers a refetch, the optimistic entry is replaced by real server data.

---

## team_id Flow

`team_id` is returned by the `/hono-me` Bubble workflow (already implemented in Bubble). It is extracted during login (where `getProfile` is already called), persisted to Supabase, and embedded in the JWT so it is available on every request including token refresh.

- DO is keyed by `team_id` → all team members share one DO → one push notifies everyone
- Webhook payload uses `team_id` (not `bubble_user_id`)

---

## Backend Changes

### 1. `BubbleProfileResult` + `getProfile`
Add `team_id: string` to the return type and extract it from the `/hono-me` response body.

### 2. Supabase `users` table
Add nullable `team_id text` column via migration.

### 3. `User` interface + `UpdateUserInput`
Add `team_id: string | null` to both types in `users.repository.ts`.

### 4. `auth.service.ts` — `login()`
After `getProfile`, call `updateProfile(user.id, { bubble_token: token, team_id: profile.team_id })`.

### 5. `signAccessToken`
Add `team_id` to JWT claims: `{ sub, bubble_id, team_id, type, jti, iat, exp }`.

### 6. `/ws` route in `app.ts`
Key the DO by `team_id` from JWT: `c.env.CONNECTIONS.idFromName(payload.team_id ?? payload.sub)`.

### 7. `webhook.routes.ts`
Change accepted field from `bubble_user_id` to `team_id`. Route to DO: `c.env.CONNECTIONS.idFromName(body.team_id)`.

### 8. `BubbleClient` — `sendMessage`
New method:
```
sendMessage(bubbleToken: string, conversationId: string, body: string): Promise<void>
POST BUBBLE_API_URL/hono-conversations-send
Headers: Authorization: Bearer <admin api key>
Body: { conversation_id, body }
```

### 9. `ConversationsService` — `sendMessage`
```
sendMessage(userId: string, conversationId: string, body: string): Promise<void>
```
Fetches user (to get `bubble_token`), calls `bubbleClient.sendMessage`.

### 10. Route `POST /conversations/:id/messages`
Body schema: `{ body: string }` (zod). Calls `conversationsService.sendMessage`. Returns `204`.

---

## Mobile Changes

### 11. `conversations.api.ts` — `sendMessage`
```
sendMessage(conversationId: string, body: string): Promise<void>
POST API_URL/conversations/:id/messages
Bearer JWT auth, same retry-on-401 pattern as fetchConversations
```

### 12. `useSendMessage` hook
`useMutation` wrapping `sendMessage`. On `mutate`:
- **Optimistic update:** snapshot current cache, append a temp `Message` `{ id: 'temp-<uuid>', text, is_from_agent: false, sent_at: new Date().toISOString() }` to `conversation.messages` in the `['conversations']` infinite query cache.
- **onError:** roll back to snapshot.
- **onSettled:** invalidate `['conversations']` — React Query refetches, temp message replaced by real data (or removed on error).

### 13. `conversation-detail-screen.tsx`
- Import and call `useSendMessage`
- Add send `Pressable` button inside the input row (using `PaperPlaneTiltIcon` from phosphor-react-native)
- Disable button when `message.trim() === ''` or `isPending`
- On press: call `mutate({ conversationId: id, body: message })`, then `setMessage('')`

---

## Error Handling

- Network/Bubble error on send → optimistic rollback + brief inline error text below input
- 401 on send → same `tryRefreshTokens` retry pattern used in `fetchConversations`
- Webhook with unknown `team_id` → DO delivers 0 sockets, returns `{ delivered: 0 }`, no crash

---

## Out of Scope

- Sending attachments / media
- Read receipts
- Typing indicators
- Message pagination on detail screen (messages still come from conversations list cache)
