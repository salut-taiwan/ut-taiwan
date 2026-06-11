'use client';

import ChatWindow from '@/components/chat/ChatWindow';
import { AssistantAvatar } from '@/components/chat/MessageBubble';

// Full-screen view of the same session the floating panel uses (shared via
// ChatProvider). Visualization only: all chat logic lives in the AI backend.
export default function ChatPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
      <header className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="relative">
          <AssistantAvatar size={36} />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]" />
        </div>
        <div>
          <p className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--foreground)]">
            Asisten UT Taiwan
          </p>
          <p className="text-xs text-[var(--text-muted)]">Online</p>
        </div>
      </header>
      <ChatWindow variant="page" />
    </div>
  );
}
