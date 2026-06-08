# Conversations Real-Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build paginated conversation list and chat detail endpoints on Cloudflare Workers, with real-time push via Durable Objects and Bubble.io webhook triggers.

**Architecture:** Hono Worker proxies REST reads from Bubble.io Data API (using admin key + bubble_id filter). A `ConnectionManager` Durable Object holds one WebSocket connection per user. When Bubble.io fires a webhook, the Worker routes the event to the correct DO instance which pushes to the connected mobile client.

**Tech Stack:** Hono, Cloudflare Workers, Durable Objects (hibernatable WebSocket), Bubble.io Data API, Supabase (user lookup only), Vitest

---

## File Map

**New files:**
- `src/core/bubble/data-client.ts` — Bubble.io Data API client (conversations + messages)
- `src/core/realtime/connection-manager.ts` — Durable Object: manages WebSocket per user
- `src/modules/conversations/conversations.service.ts`
- `src/modules/conversations/conversations.routes.ts`
- `src/modules/conversations/conversations.validation.ts`
- `src/modules/conversations/__tests__/conversations.service.test.ts`
- `src/modules/conversations/__tests__/conversations.routes.test.ts`
- `src/modules/internal/webhook.routes.ts`

**Modified files:**
- `src/types/env.ts` — add `CONNECTIONS`, `BUBBLE_DATA_URL`, `WEBHOOK_SECRET`
- `src/types/hono.ts` — add `conversationsService`
- `src/app.ts` — register conversations + webhook + ws routes
- `src/core/middleware/services.ts` — inject conversationsService
- `src/index.ts` — export `ConnectionManager` DO class
- `wrangler.toml` — DO binding + new vars

---

## Task 1: Update config and env types

**Files:**
- Modify: `wrangler.toml`
- Modify: `src/types/env.ts`

- [ ] **Step 1: Add DO binding and new vars to wrangler.toml**

Replace the existing content of `wrangler.toml` with:

```toml
name = "heep-api"
main = "src/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat_v2"]

[dev]
ip = "0.0.0.0"

[vars]
ACCESS_TOKEN_TTL = "900"
REFRESH_TOKEN_TTL = "2592000"
BUBBLE_API_URL = "https://app.heep.ai/version-13djz/api/1.1/wf"
BUBBLE_DATA_URL = "https://app.heep.ai/version-13djz/api/1.1/obj"
SUPABASE_URL = "https://hqzrhlybtjjgxepvzbuo.supabase.co"
WEB_ORIGIN = "http://localhost:5173"

[[durable_objects.bindings]]
name = "CONNECTIONS"
class_name = "ConnectionManager"

[[migrations]]
tag = "v1"
new_classes = ["ConnectionManager"]
```

- [ ] **Step 2: Update Env type**

Replace `src/types/env.ts` with:

```typescript
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL: string;
  REFRESH_TOKEN_TTL: string;
  BUBBLE_API_URL: string;
  BUBBLE_DATA_URL: string;
  BUBBLE_API_KEY: string;
  WEBHOOK_SECRET: string;
  WEB_ORIGIN: string;
  CONNECTIONS: DurableObjectNamespace;
}
```

- [ ] **Step 3: Commit**

```bash
git add wrangler.toml src/types/env.ts
git commit -m "feat(conversations): add DO binding and env vars for realtime"
```

---

## Task 2: Bubble.io Data Client

**Files:**
- Create: `src/core/bubble/data-client.ts`

This client uses the Bubble.io Data API (`/obj/`) with the admin API key. It filters conversations by the user's `bubble_id`.

> **Important:** Bubble.io field names below (`Channel`, `Contact`, `Property`, `Last Message Text`, `Last Message Date`) are placeholder names — confirm the exact field names from the Bubble.io editor before wiring up.

- [ ] **Step 1: Create the data client**

```typescript
// src/core/bubble/data-client.ts

export interface BubbleContact {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
}

export interface BubbleConversation {
  id: string;
  contact: BubbleContact;
  channel: 'whatsapp' | 'sms' | 'email';
  property_id: string;
  property_name: string;
  last_message_text: string;
  last_message_sent_at: string;
  unread_count: number;
  updated_at: string;
}

export interface BubbleMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  sent_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    has_more: boolean;
  };
}

export interface GetConversationsOptions {
  bubbleUserId: string;
  cursor?: string;
  limit: number;
  propertyId?: string;
  q?: string;
}

export interface GetMessagesOptions {
  cursor?: string;
  limit: number;
}

export interface BubbleDataClient {
  getConversations(options: GetConversationsOptions): Promise<PaginatedResult<BubbleConversation>>;
  getMessages(conversationId: string, options: GetMessagesOptions): Promise<PaginatedResult<BubbleMessage>>;
}

export function createBubbleDataClient(dataUrl: string, apiKey: string): BubbleDataClient {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    async getConversations({ bubbleUserId, cursor, limit, propertyId, q }) {
      const constraints: object[] = [
        { key: 'Host', constraint_type: 'equals', value: bubbleUserId },
      ];
      if (propertyId) {
        constraints.push({ key: 'Property', constraint_type: 'equals', value: propertyId });
      }
      if (q) {
        constraints.push({ key: 'Contact Name', constraint_type: 'contains', value: q });
      }

      const params = new URLSearchParams({
        limit: String(limit),
        sort_field: 'Modified Date',
        descending: 'true',
        constraints: JSON.stringify(constraints),
      });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${dataUrl}/conversation?${params}`, { headers });
      if (!res.ok) throw new Error(`Bubble getConversations failed: ${res.status}`);

      const json = await res.json() as {
        response: {
          results: Record<string, unknown>[];
          cursor: number;
          count: number;
          remaining: number;
        };
      };

      const { results, cursor: nextCursor, remaining } = json.response;

      return {
        data: results.map(mapConversation),
        pagination: {
          cursor: remaining > 0 ? String(nextCursor) : null,
          has_more: remaining > 0,
        },
      };
    },

    async getMessages(conversationId, { cursor, limit }) {
      const constraints = [
        { key: 'Conversation', constraint_type: 'equals', value: conversationId },
      ];

      const params = new URLSearchParams({
        limit: String(limit),
        sort_field: 'Created Date',
        descending: 'false',
        constraints: JSON.stringify(constraints),
      });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${dataUrl}/message?${params}`, { headers });
      if (!res.ok) throw new Error(`Bubble getMessages failed: ${res.status}`);

      const json = await res.json() as {
        response: {
          results: Record<string, unknown>[];
          cursor: number;
          remaining: number;
        };
      };

      const { results, cursor: nextCursor, remaining } = json.response;

      return {
        data: results.map(mapMessage),
        pagination: {
          cursor: remaining > 0 ? String(nextCursor) : null,
          has_more: remaining > 0,
        },
      };
    },
  };
}

// ─── Field mapping ──────────────────────────────────────────────────────────
// These field names match Bubble.io's data type field labels.
// Update if the actual Bubble field names differ.

function mapConversation(raw: Record<string, unknown>): BubbleConversation {
  return {
    id: raw._id as string,
    contact: {
      id: (raw['Contact'] as Record<string, unknown>)?._id as string ?? '',
      name: raw['Contact Name'] as string ?? '',
      phone: raw['Contact Phone'] as string ?? '',
      avatar_url: raw['Contact Avatar'] as string | null ?? null,
    },
    channel: (raw['Channel'] as 'whatsapp' | 'sms' | 'email') ?? 'whatsapp',
    property_id: (raw['Property'] as Record<string, unknown>)?._id as string ?? '',
    property_name: raw['Property Name'] as string ?? '',
    last_message_text: raw['Last Message Text'] as string ?? '',
    last_message_sent_at: raw['Last Message Date'] as string ?? raw['Modified Date'] as string,
    unread_count: raw['Unread Count'] as number ?? 0,
    updated_at: raw['Modified Date'] as string,
  };
}

function mapMessage(raw: Record<string, unknown>): BubbleMessage {
  return {
    id: raw._id as string,
    text: raw['Text'] as string ?? '',
    sender: (raw['Direction'] as string) === 'outbound' ? 'me' : 'them',
    sent_at: raw['Created Date'] as string,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/bubble/data-client.ts
git commit -m "feat(conversations): add Bubble.io Data API client"
```

---

## Task 3: Conversations Service

**Files:**
- Create: `src/modules/conversations/conversations.service.ts`
- Create: `src/modules/conversations/__tests__/conversations.service.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/modules/conversations/__tests__/conversations.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createConversationsService } from '../conversations.service';
import type { BubbleDataClient } from '../../../core/bubble/data-client';
import type { UsersService } from '../../users/users.service';

const mockUser = {
  id: 'user-1',
  bubble_id: 'bubble-abc',
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
  contact: { id: 'c-1', name: 'Mathis Vella', phone: '+33778566100', avatar_url: null },
  channel: 'whatsapp' as const,
  property_id: 'prop-1',
  property_name: 'Villa Sunset',
  last_message_text: 'Hey there',
  last_message_sent_at: '2025-07-07T10:00:00Z',
  unread_count: 2,
  updated_at: '2025-07-07T10:00:00Z',
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
    const usersService = {
      getMe: vi.fn().mockResolvedValue(mockUser),
    } as unknown as UsersService;
    return { service: createConversationsService({ bubbleDataClient, usersService }), bubbleDataClient, usersService };
  };

  it('getConversations calls Bubble with users bubble_id', async () => {
    const { service, bubbleDataClient } = makeService();
    const result = await service.getConversations('user-1', { limit: 20 });
    expect(bubbleDataClient.getConversations).toHaveBeenCalledWith(
      expect.objectContaining({ bubbleUserId: 'bubble-abc', limit: 20 }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('conv-1');
  });

  it('getConversations throws if user has no bubble_id', async () => {
    const { service, usersService } = makeService();
    (usersService.getMe as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ...mockUser, bubble_id: null });
    await expect(service.getConversations('user-1', { limit: 20 })).rejects.toThrow('User has no Bubble account linked');
  });

  it('getMessages calls Bubble with conversationId', async () => {
    const { service, bubbleDataClient } = makeService();
    const result = await service.getMessages('user-1', 'conv-1', { limit: 20 });
    expect(bubbleDataClient.getMessages).toHaveBeenCalledWith('conv-1', expect.objectContaining({ limit: 20 }));
    expect(result.data[0].id).toBe('msg-1');
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd apps/backend && npx vitest run src/modules/conversations/__tests__/conversations.service.test.ts
```

Expected: FAIL — `Cannot find module '../conversations.service'`

- [ ] **Step 3: Create the service**

```typescript
// src/modules/conversations/conversations.service.ts
import type { BubbleDataClient, PaginatedResult, BubbleConversation, BubbleMessage } from '../../core/bubble/data-client';
import type { UsersService } from '../users/users.service';
import { NotFoundError } from '../../core/errors';

export interface ConversationsServiceDeps {
  bubbleDataClient: BubbleDataClient;
  usersService: UsersService;
}

export interface GetConversationsQuery {
  cursor?: string;
  limit?: number;
  propertyId?: string;
  q?: string;
}

export function createConversationsService({ bubbleDataClient, usersService }: ConversationsServiceDeps) {
  return {
    async getConversations(
      userId: string,
      query: GetConversationsQuery,
    ): Promise<PaginatedResult<BubbleConversation>> {
      const user = await usersService.getMe(userId);
      if (!user.bubble_id) throw new Error('User has no Bubble account linked');
      return bubbleDataClient.getConversations({
        bubbleUserId: user.bubble_id,
        cursor: query.cursor,
        limit: query.limit ?? 20,
        propertyId: query.propertyId,
        q: query.q,
      });
    },

    async getMessages(
      userId: string,
      conversationId: string,
      query: { cursor?: string; limit?: number },
    ): Promise<PaginatedResult<BubbleMessage>> {
      const user = await usersService.getMe(userId);
      if (!user.bubble_id) throw new Error('User has no Bubble account linked');
      return bubbleDataClient.getMessages(conversationId, {
        cursor: query.cursor,
        limit: query.limit ?? 30,
      });
    },
  };
}

export type ConversationsService = ReturnType<typeof createConversationsService>;
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd apps/backend && npx vitest run src/modules/conversations/__tests__/conversations.service.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/conversations/conversations.service.ts src/modules/conversations/__tests__/conversations.service.test.ts
git commit -m "feat(conversations): add conversations service"
```

---

## Task 4: Conversations Routes

**Files:**
- Create: `src/modules/conversations/conversations.validation.ts`
- Create: `src/modules/conversations/conversations.routes.ts`
- Create: `src/modules/conversations/__tests__/conversations.routes.test.ts`

- [ ] **Step 1: Create validation schemas**

```typescript
// src/modules/conversations/conversations.validation.ts
import { z } from 'zod';

export const listConversationsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  property_id: z.string().optional(),
  q: z.string().optional(),
});

export const listMessagesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
```

- [ ] **Step 2: Write failing route tests**

```typescript
// src/modules/conversations/__tests__/conversations.routes.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { conversationsRoutes } from '../conversations.routes';
import type { AppVariables } from '../../../types/hono';
import type { Env } from '../../../types/env';

const mockPaginated = {
  data: [{ id: 'conv-1', contact: { id: 'c-1', name: 'Test', phone: '', avatar_url: null }, channel: 'whatsapp', property_id: 'p-1', property_name: 'Villa', last_message_text: 'Hi', last_message_sent_at: '2025-01-01T00:00:00Z', unread_count: 0, updated_at: '2025-01-01T00:00:00Z' }],
  pagination: { cursor: null, has_more: false },
};

const makeApp = () => {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();
  app.use('*', async (c, next) => {
    c.set('user', { id: 'user-1' });
    c.set('conversationsService', {
      getConversations: vi.fn().mockResolvedValue(mockPaginated),
      getMessages: vi.fn().mockResolvedValue({ data: [], pagination: { cursor: null, has_more: false } }),
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
    const res = await makeApp().request('/conversations?limit=10&property_id=p-1');
    expect(res.status).toBe(200);
  });
});

describe('GET /conversations/:id/messages', () => {
  it('returns 200 with paginated messages', async () => {
    const res = await makeApp().request('/conversations/conv-1/messages');
    expect(res.status).toBe(200);
    const body = await res.json() as { data: unknown[]; pagination: { cursor: string | null; has_more: boolean } };
    expect(body.data).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run tests — confirm they fail**

```bash
cd apps/backend && npx vitest run src/modules/conversations/__tests__/conversations.routes.test.ts
```

Expected: FAIL — `Cannot find module '../conversations.routes'`

- [ ] **Step 4: Create routes**

```typescript
// src/modules/conversations/conversations.routes.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../core/middleware/auth';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { listConversationsSchema, listMessagesSchema } from './conversations.validation';

export const conversationsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

conversationsRoutes.use('*', requireAuth);

conversationsRoutes.get('/', zValidator('query', listConversationsSchema), async (c) => {
  const { cursor, limit, property_id, q } = c.req.valid('query');
  const result = await c.get('conversationsService').getConversations(c.get('user').id, {
    cursor,
    limit,
    propertyId: property_id,
    q,
  });
  return c.json(result);
});

conversationsRoutes.get('/:id/messages', zValidator('query', listMessagesSchema), async (c) => {
  const conversationId = c.req.param('id');
  const { cursor, limit } = c.req.valid('query');
  const result = await c.get('conversationsService').getMessages(c.get('user').id, conversationId, {
    cursor,
    limit,
  });
  return c.json(result);
});
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
cd apps/backend && npx vitest run src/modules/conversations/__tests__/conversations.routes.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/modules/conversations/
git commit -m "feat(conversations): add GET /conversations and GET /conversations/:id/messages"
```

---

## Task 5: ConnectionManager Durable Object

**Files:**
- Create: `src/core/realtime/connection-manager.ts`

The DO uses **hibernatable WebSockets** — Cloudflare hibernates the DO when no messages are being processed, reducing cost. Each DO instance is keyed by user ID (`env.CONNECTIONS.idFromName(userId)`), so one DO = one user's live connection.

- [ ] **Step 1: Create the DO**

```typescript
// src/core/realtime/connection-manager.ts
import type { Env } from '../../types/env';

export class ConnectionManager {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/connect') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/notify') {
      const event = await request.json();
      const sockets = this.state.getWebSockets();
      for (const ws of sockets) {
        ws.send(JSON.stringify(event));
      }
      return new Response(JSON.stringify({ delivered: sockets.length }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  webSocketMessage(_ws: WebSocket, _message: string | ArrayBuffer): void {
    // Mobile → server messages not needed for conversation list
    // Future: handle message send here
  }

  webSocketClose(_ws: WebSocket): void {}

  webSocketError(_ws: WebSocket, _error: unknown): void {}
}
```

- [ ] **Step 2: Export DO from index.ts**

Replace `src/index.ts` with:

```typescript
import { createApp } from './app';
import { ConnectionManager } from './core/realtime/connection-manager';

export { ConnectionManager };
export default { fetch: createApp().fetch };
```

- [ ] **Step 3: Commit**

```bash
git add src/core/realtime/connection-manager.ts src/index.ts
git commit -m "feat(realtime): add ConnectionManager Durable Object"
```

---

## Task 6: WebSocket Route

**Files:**
- Modify: `src/app.ts`

The Worker validates the JWT, then hands off the WebSocket upgrade to the user's DO instance.

- [ ] **Step 1: Add `/ws` route to app.ts**

```typescript
// src/app.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { errorHandler } from './core/middleware/error-handler';
import { corsMiddleware } from './core/middleware/cors';
import { servicesMiddleware } from './core/middleware/services';
import type { Env } from './types/env';
import type { AppVariables } from './types/hono';
import { usersRoutes } from './modules/users/users.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { conversationsRoutes } from './modules/conversations/conversations.routes';
import { webhookRoutes } from './modules/internal/webhook.routes';
import { requireAuth } from './core/middleware/auth';

export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

  app.use('*', logger());
  app.use('*', corsMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.use('*', servicesMiddleware);

  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/conversations', conversationsRoutes);
  app.route('/internal', webhookRoutes);

  app.get('/ws', requireAuth, async (c) => {
    const userId = c.get('user').id;
    const id = c.env.CONNECTIONS.idFromName(userId);
    const stub = c.env.CONNECTIONS.get(id);
    const wsRequest = new Request(`${new URL(c.req.url).origin}/connect`, c.req.raw);
    return stub.fetch(wsRequest);
  });

  app.onError(errorHandler);
  return app;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app.ts
git commit -m "feat(realtime): add GET /ws WebSocket upgrade route"
```

---

## Task 7: Webhook Route

**Files:**
- Create: `src/modules/internal/webhook.routes.ts`

Bubble.io POSTs here when a conversation or message is created/modified. The Worker validates the secret, then notifies the correct user's DO.

Expected Bubble.io payload:
```json
{
  "user_id": "<our internal user id or bubble_id>",
  "event": "conversation.updated",
  "conversation_id": "conv-abc"
}
```

- [ ] **Step 1: Create webhook route**

```typescript
// src/modules/internal/webhook.routes.ts
import { Hono } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';

export const webhookRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

webhookRoutes.post('/webhook', async (c) => {
  const secret = c.req.header('X-Webhook-Secret');
  if (!secret || secret !== c.env.WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json() as {
    user_id: string;
    event: string;
    conversation_id?: string;
  };

  if (!body.user_id || !body.event) {
    return c.json({ error: 'Missing user_id or event' }, 400);
  }

  const doId = c.env.CONNECTIONS.idFromName(body.user_id);
  const stub = c.env.CONNECTIONS.get(doId);

  await stub.fetch(
    new Request('https://do/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: body.event, conversation_id: body.conversation_id }),
    }),
  );

  return c.json({ ok: true });
});
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/internal/webhook.routes.ts
git commit -m "feat(realtime): add POST /internal/webhook for Bubble.io triggers"
```

---

## Task 8: Wire services middleware

**Files:**
- Modify: `src/types/hono.ts`
- Modify: `src/core/middleware/services.ts`

- [ ] **Step 1: Update AppVariables**

```typescript
// src/types/hono.ts
import type { Database } from '../core/db/client';
import type { AuthService } from '../modules/auth/auth.service';
import type { UsersService } from '../modules/users/users.service';
import type { ConversationsService } from '../modules/conversations/conversations.service';

export interface AuthUser {
  id: string;
}

export interface AppVariables {
  user: AuthUser;
  db: Database;
  authService: AuthService;
  usersService: UsersService;
  conversationsService: ConversationsService;
}
```

- [ ] **Step 2: Update services middleware**

```typescript
// src/core/middleware/services.ts
import type { Context, Next } from 'hono';
import type { Env } from '../../types/env';
import type { AppVariables } from '../../types/hono';
import { createSupabaseClient } from '../supabase/client';
import { createAuthRepository } from '../../modules/auth/auth.repository';
import { createUsersRepository } from '../../modules/users/users.repository';
import { createAuthService } from '../../modules/auth/auth.service';
import { createUsersService } from '../../modules/users/users.service';
import { createBubbleClient } from '../bubble/client';
import { createBubbleDataClient } from '../bubble/data-client';
import { createConversationsService } from '../../modules/conversations/conversations.service';

export async function servicesMiddleware(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  next: Next,
) {
  const supabase = createSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const authRepo = createAuthRepository(supabase);
  const usersRepo = createUsersRepository(supabase);

  const usersService = createUsersService({ repo: usersRepo });
  const bubbleClient = createBubbleClient(c.env.BUBBLE_API_URL, c.env.BUBBLE_API_KEY);
  const bubbleDataClient = createBubbleDataClient(c.env.BUBBLE_DATA_URL, c.env.BUBBLE_API_KEY);

  const authService = createAuthService({
    authRepo,
    usersService,
    bubbleClient,
    jwtAccessSecret: c.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: c.env.JWT_REFRESH_SECRET,
    accessTokenTtl: Number(c.env.ACCESS_TOKEN_TTL),
    refreshTokenTtl: Number(c.env.REFRESH_TOKEN_TTL),
  });

  const conversationsService = createConversationsService({ bubbleDataClient, usersService });

  c.set('authService', authService);
  c.set('usersService', usersService);
  c.set('conversationsService', conversationsService);
  await next();
}
```

- [ ] **Step 3: Run all tests**

```bash
cd apps/backend && npx vitest run
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/types/hono.ts src/core/middleware/services.ts
git commit -m "feat(conversations): wire conversations service into middleware"
```

---

## Task 9: Deploy

- [ ] **Step 1: Set secrets on Cloudflare**

Run these in `apps/backend`:

```bash
npx wrangler secret put BUBBLE_API_KEY
npx wrangler secret put JWT_ACCESS_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
npx wrangler secret put SUPABASE_KEY
npx wrangler secret put WEBHOOK_SECRET
```

For `WEBHOOK_SECRET`, generate a random string and save it somewhere safe — you'll need to paste it into Bubble.io's workflow later.

- [ ] **Step 2: Deploy**

```bash
cd apps/backend && npx wrangler deploy
```

Expected output includes:
```
✅ ConnectionManager (Durable Object)
Published heep-api (X.XXs)
  https://heep-api.<your-account>.workers.dev
```

- [ ] **Step 3: Verify health check**

```bash
curl https://heep-api.<your-account>.workers.dev/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: Note the deployed URL**

The base URL (`https://heep-api.<your-account>.workers.dev`) is what you give to Bubble.io for the webhook. The exact endpoint is:

```
POST https://heep-api.<your-account>.workers.dev/internal/webhook
Header: X-Webhook-Secret: <your WEBHOOK_SECRET value>
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: deploy conversations + realtime endpoints"
```

---

## What to tell Bubble.io to send

When you set up the Bubble.io database trigger, configure it to POST to:

```
URL: https://heep-api.<your-account>.workers.dev/internal/webhook
Method: POST
Headers:
  Content-Type: application/json
  X-Webhook-Secret: <WEBHOOK_SECRET>
Body:
{
  "user_id": "<our internal user ID — stored on the User record in Bubble>",
  "event": "conversation.updated",
  "conversation_id": "<the conversation's Bubble ID>"
}
```

> **Note on `user_id`:** Our JWT uses the Supabase internal user ID (UUID). When we created users, we stored `bubble_id` on the Supabase user. But the DO is keyed by our internal `user_id`. Make sure the Bubble.io User record has a field storing our internal user ID, or alternatively adjust `webhook.routes.ts` to look up the user by `bubble_id` via `usersService`.
