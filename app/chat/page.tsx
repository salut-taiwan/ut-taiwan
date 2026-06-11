'use client';

import { useRouter } from 'next/navigation';
import { useChat } from '@/components/chat/ChatProvider';
import ChatWindow from '@/components/chat/ChatWindow';
import { AssistantAvatar } from '@/components/chat/MessageBubble';

// Full-screen view of the same session the floating panel uses (shared via
// ChatProvider). Visualization only: all chat logic lives in the AI backend.
export default function ChatPage() {
  const router = useRouter();
  const { open, expandedInApp, setExpandedInApp } = useChat();

  // Reverse of the panel's expand: hand the conversation back to the floating
  // panel and leave the page. Only go back when expand brought us here —
  // direct visits would otherwise back out of the app entirely.
  const minimize = () => {
    open();
    if (expandedInApp) {
      setExpandedInApp(false);
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
      <header className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="relative">
          <AssistantAvatar size={36} />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-display)] text-sm font-bold text-[var(--foreground)]">
            Asisten UT Taiwan
          </p>
          <p className="text-xs text-[var(--text-muted)]">Online</p>
        </div>
        <button
          type="button"
          onClick={minimize}
          aria-label="Perkecil chat"
          className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-body)] transition-colors hover:bg-[var(--surface-sunken)]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 4v4H4M20 8h-4V4M16 20v-4h4M4 16h4v4" />
          </svg>
        </button>
      </header>
      <ChatWindow variant="page" />
    </div>
  );
}
