import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/features/auth/store/auth.store';

const WS_URL = process.env.EXPO_PUBLIC_API_URL!.replace(/^http/, 'ws');
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

export function useConversationsSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(RECONNECT_DELAY_MS);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;

    async function connect() {
      if (unmounted.current) return;

      const token = await getAccessToken();
      if (!token) return;

      const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelay.current = RECONNECT_DELAY_MS;
      };

      ws.onmessage = () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      };

      ws.onclose = () => {
        if (unmounted.current) return;
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY_MS);
          connect();
        }, reconnectDelay.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && wsRef.current?.readyState !== WebSocket.OPEN) {
        reconnectDelay.current = RECONNECT_DELAY_MS;
        connect();
      }
    });

    return () => {
      unmounted.current = true;
      sub.remove();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);
}
