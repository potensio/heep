import { createDb } from '../../core/db/client';
import { createChatRepository } from './chat.repository';
import { verifyAccessToken } from '../../core/jwt';

interface DOEnv {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
}

export class ChatRoomDO {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: DOEnv,
  ) {}

  // Always read from state.id.name — instance vars are lost on hibernation wake-up
  private get conversationId(): string | null {
    return this.state.id.name ?? null;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Auth: JWT token passed as query param (WebSocket headers can't be set from React Native)
    const token = url.searchParams.get('token');
    if (!token) return new Response('Unauthorized', { status: 401 });

    let userId: string;
    try {
      const payload = await verifyAccessToken(token, this.env.JWT_ACCESS_SECRET);
      userId = payload.sub;
    } catch {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify user is a participant in this conversation
    const db = createDb(this.env.DATABASE_URL);
    const chatRepo = createChatRepository(db);
    const ok = this.conversationId
      ? await chatRepo.isParticipant(this.conversationId, userId)
      : false;
    if (!ok) return new Response('Forbidden', { status: 403 });

    // Upgrade to WebSocket using Hibernation API
    // Tags store the userId so webSocketMessage can retrieve it without keeping state
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
    const saved = await chatRepo.createMessage({
      conversationId: this.conversationId,
      senderId,
      text,
      imageUrl,
    });

    const broadcast = JSON.stringify({ type: 'message', ...saved });
    for (const socket of this.state.getWebSockets()) {
      socket.send(broadcast);
    }
  }

  async webSocketClose(_ws: WebSocket): Promise<void> {
    // Hibernation API handles cleanup automatically — no action needed.
  }
}
