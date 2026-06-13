import type { Env } from '../../types/env';

const PING = JSON.stringify({ type: 'ping' });
const PONG = JSON.stringify({ type: 'pong' });

export class ConnectionManager {
  constructor(private state: DurableObjectState, private env: Env) {
    // Answer heartbeat pings automatically without waking the DO from
    // hibernation. The client still gets its {type:'pong'} for liveness checks.
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
  }

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
      const payload = JSON.stringify(await request.json());
      const sockets = this.state.getWebSockets();
      let delivered = 0;
      for (const ws of sockets) {
        try {
          ws.send(payload);
          delivered++;
        } catch {
          // A dead/closing socket must not abort delivery to everyone after it.
          // Drop it and keep broadcasting.
          try {
            ws.close(1011, 'send failed');
          } catch {}
        }
      }
      return new Response(JSON.stringify({ delivered }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  // Fallback for messages that bypass the auto-responder (e.g. a client that
  // doesn't send the exact ping payload). Auto-response handles the common case.
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    try {
      const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
      if (data?.type === 'ping') ws.send(PONG);
    } catch {}
  }

  webSocketClose(_ws: WebSocket): void {}

  webSocketError(_ws: WebSocket, _error: unknown): void {}
}
