'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { type ChatSocket, useChatSocket } from '@/lib/chat/useChatSocket';

interface ChatContextValue extends ChatSocket {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// Owns the single chat session for the whole app. The floating panel and the
// /chat page both read from here, so expanding from one to the other shows the
// same live conversation. The socket itself stays closed until the first send.
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const socket = useChatSocket({
    onError: useCallback((_code: string, message: string) => showToast(message, 'error'), [showToast]),
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo<ChatContextValue>(
    () => ({ ...socket, isOpen, open, close, toggle }),
    [socket, isOpen, open, close, toggle],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
