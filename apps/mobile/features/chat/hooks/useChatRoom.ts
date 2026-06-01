import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Message } from '@/lib/types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';
const WS_BASE = BASE.replace(/^http/, 'ws');

export type ChatStatus = 'connecting' | 'connected' | 'disconnected';

export function useChatRoom(conversationId: string) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!token) return;
    const url = `${WS_BASE}/chat/conversations/${conversationId}/ws?token=${token}`;
    const ws = new WebSocket(url);

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data as string);
      if (event.type === 'history') {
        setMessages(
          (event.messages as any[]).map(normalizeMessage),
        );
      } else if (event.type === 'message') {
        setMessages((prev) => [...prev, normalizeMessage(event)]);
      }
    };

    ws.onclose = (e) => {
      setStatus('disconnected');
      if (e.code !== 1000) {
        retryRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, [conversationId, token]);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close(1000);
    };
  }, [connect]);

  const send = useCallback((text: string, imageUrl?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', text, imageUrl: imageUrl ?? null }));
    }
  }, []);

  return { messages, status, send };
}

function normalizeMessage(raw: any): Message {
  return {
    id: raw.id,
    conversationId: raw.conversationId,
    senderId: raw.senderId,
    text: raw.text ?? undefined,
    image: raw.imageUrl ?? undefined,
    timestamp: new Date(raw.createdAt),
    isRead: !!raw.readAt,
  };
}
