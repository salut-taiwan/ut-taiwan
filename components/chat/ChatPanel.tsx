'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useChat } from '@/components/chat/ChatProvider';
import ChatWindow from '@/components/chat/ChatWindow';
import { AssistantAvatar } from '@/components/chat/MessageBubble';

function PanelHeader({ onExpand, onClose }: { onExpand: () => void; onClose: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-4 py-3 backdrop-blur-xl">
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
        onClick={onExpand}
        aria-label="Buka layar penuh"
        className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-body)] transition-colors hover:bg-[var(--surface-sunken)]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup chat"
        className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-body)] transition-colors hover:bg-[var(--surface-sunken)]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>
  );
}

export default function ChatPanel() {
  const router = useRouter();
  const { isOpen, close } = useChat();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc closes; on open, move focus into the panel and trap Tab within it.
  useEffect(() => {
    if (!isOpen) return;
    const node = panelRef.current;
    if (!node) return;

    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  const expand = () => {
    close();
    router.push('/chat');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Chat Asisten UT Taiwan"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }
          }
          style={{ transformOrigin: 'bottom right' }}
          className="fixed inset-0 z-[60] flex flex-col bg-[var(--surface)] sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[600px] sm:max-h-[calc(100dvh-7rem)] sm:w-[400px] sm:rounded-[var(--radius-lg)] sm:shadow-[var(--shadow-modal)] sm:ring-1 sm:ring-[var(--border-subtle)]"
        >
          <PanelHeader onExpand={expand} onClose={close} />
          <ChatWindow variant="panel" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
