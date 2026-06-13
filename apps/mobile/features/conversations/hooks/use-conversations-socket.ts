import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getFreshAccessToken, getRefreshToken } from '@/features/auth/store/auth.store';
import type { ConversationListResponse, Message } from '../types';

const WS_URL = process.env.EXPO_PUBLIC_API_URL!.replace(/^http/, 'ws');
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;
const PING_INTERVAL_MS = 25000;
const PONG_TIMEOUT_MS = 10000;
const INVALIDATE_DEBOUNCE_MS = 300;

export function useConversationsSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(RECONNECT_DELAY_MS);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);
  const isFirstConnect = useRef(true);
  const isConnecting = useRef(false);
  const failedBeforeOpen = useRef(0);
  const invalidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    unmounted.current = false;

    // Coalesce list refetches: a burst of messages for not-yet-loaded
    // conversations triggers a single refetch instead of one per message.
    function scheduleListInvalidate() {
      if (invalidateTimer.current) return;
      invalidateTimer.current = setTimeout(() => {
        invalidateTimer.current = null;
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }, INVALIDATE_DEBOUNCE_MS);
    }

    function clearPing() {
      if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
      if (pongTimer.current) { clearTimeout(pongTimer.current); pongTimer.current = null; }
    }

    function scheduleReconnect() {
      if (unmounted.current || reconnectTimer.current) return;
      reconnectTimer.current = setTimeout(() => {
        reconnectTimer.current = null;
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY_MS);
        connect();
      }, reconnectDelay.current);
    }

    function startPing(ws: WebSocket) {
      clearPing();
      pingTimer.current = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'ping' }));
        pongTimer.current = setTimeout(() => {
          // no pong received — connection is zombie, force close
          ws.close();
        }, PONG_TIMEOUT_MS);
      }, PING_INTERVAL_MS);
    }

    async function connect() {
      if (unmounted.current || isConnecting.current) return;
      isConnecting.current = true;

      try {
        // If the previous attempt failed before the socket ever opened, the
        // stored token is likely expired/invalid — force a refresh rather than
        // reconnecting forever with the same dead token.
        const token = await getFreshAccessToken(failedBeforeOpen.current > 0);
        if (!token) {
          isConnecting.current = false;
          // Couldn't get a token. If a refresh token still exists this was a
          // transient failure — retry later. Otherwise the user is logged out;
          // stop trying.
          if (!unmounted.current && (await getRefreshToken())) scheduleReconnect();
          return;
        }

        const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
        wsRef.current = ws;
        let opened = false;

        ws.onopen = () => {
          opened = true;
          isConnecting.current = false;
          failedBeforeOpen.current = 0;
          reconnectDelay.current = RECONNECT_DELAY_MS;
          startPing(ws);
          if (!isFirstConnect.current) {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
          isFirstConnect.current = false;
        };

        ws.onerror = () => {
          ws.close();
        };

        ws.onmessage = (e) => {
          const event = JSON.parse(e.data) as {
            type: string;
            conversation_id: string | null;
            message: Message | null;
            is_ai_paused: boolean | null;
          };

          if (event.type === 'pong') {
            if (pongTimer.current) { clearTimeout(pongTimer.current); pongTimer.current = null; }
            return;
          }

          if (event.type === 'message.created' && event.conversation_id && event.message) {
            const { conversation_id, message } = event;
            let found = false;
            queryClient.setQueryData<InfiniteData<ConversationListResponse>>(
              ['conversations'],
              (old) => {
                if (!old) return old;
                let updated: typeof old.pages[0]['data'][0] | null = null;
                const pages = old.pages.map((page) => ({
                  ...page,
                  data: page.data.filter((conv) => {
                    if (conv.id !== conversation_id) return true;
                    updated = {
                      ...conv,
                      last_message: { text: message.text, sent_at: message.sent_at },
                      messages: [message, ...conv.messages.filter((m) => !m.id.startsWith('temp-'))],
                    };
                    return false;
                  }),
                }));
                if (!updated) return old;
                found = true;
                return {
                  ...old,
                  pages: [
                    { ...pages[0], data: [updated, ...pages[0].data] },
                    ...pages.slice(1),
                  ],
                };
              },
            );
            // Message for a conversation we haven't loaded (brand-new thread, or
            // one beyond the loaded pages) — refetch so it shows up live.
            if (!found) scheduleListInvalidate();
          }

          if (event.type === 'conversation.updated' && event.conversation_id && event.is_ai_paused !== null) {
            const { conversation_id, is_ai_paused } = event;
            queryClient.setQueryData<InfiniteData<ConversationListResponse>>(
              ['conversations'],
              (old) => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    data: page.data.map((conv) =>
                      conv.id === conversation_id ? { ...conv, is_ai_paused } : conv,
                    ),
                  })),
                };
              },
            );
          }
        };

        ws.onclose = () => {
          isConnecting.current = false;
          clearPing();
          // Track upgrades that never opened so the next attempt forces a token
          // refresh (covers the "stored token expired" case).
          if (!opened) failedBeforeOpen.current += 1;
          if (unmounted.current) return;
          scheduleReconnect();
        };
      } catch {
        isConnecting.current = false;
        if (!unmounted.current) scheduleReconnect();
      }
    }

    connect();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
          reconnectDelay.current = RECONNECT_DELAY_MS;
          connect();
        }
      }
    });

    return () => {
      unmounted.current = true;
      clearPing();
      sub.remove();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (invalidateTimer.current) clearTimeout(invalidateTimer.current);
      wsRef.current?.close();
    };
  }, []);
}
