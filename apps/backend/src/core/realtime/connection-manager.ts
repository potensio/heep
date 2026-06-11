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

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    try {
      const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
      if (data?.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    } catch {}
  }

  webSocketClose(_ws: WebSocket): void {}

  webSocketError(_ws: WebSocket, _error: unknown): void {}
}
