'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';
import {
  type ChatMessage,
  type ClientMessage,
  type ConnectionStatus,
  type ServerErrorCode,
  type ServerMessage,
} from '@/lib/chat/types';

const WS_BASE = process.env.NEXT_PUBLIC_AI_WS_URL ?? 'ws://localhost:8001';
const WS_POLICY_VIOLATION = 1008;
const HEARTBEAT_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000];

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isServerMessage(value: unknown): value is ServerMessage {
  if (typeof value !== 'object' || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return type === 'token' || type === 'done' || type === 'error' || type === 'pong';
}

interface UseChatSocketOptions {
  // Called for backend error frames so the UI layer owns toast presentation.
  onError?: (code: ServerErrorCode, message: string) => void;
}

export interface ChatSocket {
  messages: ChatMessage[];
  status: ConnectionStatus;
  isStreaming: boolean;
  send: (content: string) => void;
  retry: () => void;
  reset: () => void;
}

// Transport only. Opens the WebSocket, relays JSON frames, and exposes render
// state. It holds no business logic: the backend owns auth, retrieval, the LLM
// call, conversation creation, and history. conversation_id is issued by the
// backend and echoed back so the server can thread context.
export function useChatSocket(options: UseChatSocketOptions = {}): ChatSocket {
  const { onError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [isStreaming, setIsStreaming] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const outboxRef = useRef<string[]>([]);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onErrorRef = useRef(onError);
  // connect schedules itself for reconnects; the ref breaks the self-reference.
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const clearTimers = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const flushOutbox = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    for (const frame of outboxRef.current) socket.send(frame);
    outboxRef.current = [];
  }, []);

  const handleServerMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'token': {
        const streamingId = streamingIdRef.current;
        if (!streamingId) return;
        setMessages((prev) =>
          prev.map((m) => (m.id === streamingId ? { ...m, content: m.content + msg.content } : m)),
        );
        return;
      }
      case 'done': {
        conversationIdRef.current = msg.conversation_id;
        const streamingId = streamingIdRef.current;
        if (streamingId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === streamingId ? { ...m, id: msg.message_id } : m)),
          );
        }
        streamingIdRef.current = null;
        setIsStreaming(false);
        setStatus('open');
        return;
      }
      case 'error': {
        const streamingId = streamingIdRef.current;
        if (streamingId) {
          // Drop the empty assistant placeholder so the UI does not show a blank bubble.
          setMessages((prev) => prev.filter((m) => m.id !== streamingId || m.content.length > 0));
        }
        streamingIdRef.current = null;
        setIsStreaming(false);
        setStatus('open');
        onErrorRef.current?.(msg.code, msg.message);
        return;
      }
      case 'pong':
        return;
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    const existing = socketRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      setStatus('expired');
      return;
    }

    setStatus((prev) => (prev === 'reconnecting' ? prev : 'connecting'));
    // The token rides in the Sec-WebSocket-Protocol header (["bearer", <jwt>])
    // instead of the URL so it never lands in proxy or access logs. The
    // constructor throws if a tampered token has characters illegal in
    // subprotocols; treat that like a missing token.
    let socket: WebSocket;
    try {
      socket = new WebSocket(`${WS_BASE}/ws/chat`, ['bearer', token]);
    } catch {
      setStatus('expired');
      return;
    }
    socketRef.current = socket;

    socket.onopen = () => {
      if (!mountedRef.current) return;
      reconnectAttemptsRef.current = 0;
      setStatus('open');
      flushOutbox();
      heartbeatRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' } satisfies ClientMessage));
        }
      }, HEARTBEAT_MS);
    };

    socket.onmessage = (event) => {
      if (!mountedRef.current) return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data as string);
      } catch {
        return;
      }
      if (isServerMessage(parsed)) handleServerMessage(parsed);
    };

    socket.onclose = (event) => {
      if (!mountedRef.current) return;
      clearTimers();
      socketRef.current = null;
      streamingIdRef.current = null;
      setIsStreaming(false);

      if (event.code === WS_POLICY_VIOLATION) {
        setStatus('expired');
        return;
      }
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setStatus('closed');
        return;
      }
      const delay = RECONNECT_DELAYS_MS[reconnectAttemptsRef.current] ?? 16_000;
      reconnectAttemptsRef.current += 1;
      setStatus('reconnecting');
      reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay);
    };

    // onerror is followed by onclose; closing there drives the single reconnect path.
    socket.onerror = () => {
      socket.close();
    };
  }, [clearTimers, flushOutbox, handleServerMessage]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = { id: randomId(), role: 'user', content: trimmed };
      const assistantId = randomId();
      streamingIdRef.current = assistantId;
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: 'assistant', content: '' },
      ]);
      setIsStreaming(true);
      setStatus('streaming');

      const frame = JSON.stringify({
        type: 'message',
        content: trimmed,
        conversation_id: conversationIdRef.current,
      } satisfies ClientMessage);

      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(frame);
      } else {
        outboxRef.current.push(frame);
        connect();
      }
    },
    [connect],
  );

  const retry = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  const reset = useCallback(() => {
    conversationIdRef.current = null;
    streamingIdRef.current = null;
    setMessages([]);
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      }
    };
  }, [clearTimers]);

  return { messages, status, isStreaming, send, retry, reset };
}
