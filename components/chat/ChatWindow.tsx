'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { MAX_MESSAGE_LENGTH } from '@/lib/chat/types';
import { useChat } from '@/components/chat/ChatProvider';
import MessageBubble, { AssistantAvatar } from '@/components/chat/MessageBubble';

const STARTER_QUESTIONS = [
  'Berapa biaya kuliah di UT?',
  'Bagaimana cara daftar ujian?',
  'Apa itu layanan SALUT?',
];

const NEAR_BOTTOM_THRESHOLD_PX = 80;

interface ChatWindowProps {
  // 'page' fills the route height; 'panel' fills the floating panel body.
  variant: 'panel' | 'page';
}

export default function ChatWindow({ variant }: ChatWindowProps) {
  const { user, isLoading } = useAuth();
  const { messages, status, isStreaming, send, retry } = useChat();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pinnedToBottomRef = useRef(true);

  const isEmpty = messages.length === 0;
  const canSend = useMemo(
    () => input.trim().length > 0 && !isStreaming,
    [input, isStreaming],
  );

  // Track whether the user is reading older messages, so streaming never yanks
  // the scroll position away from them.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    if (!pinnedToBottomRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Auto-grow the composer between 1 and 5 rows.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input]);

  const submit = useCallback(() => {
    const value = input.trim();
    if (!value || isStreaming) return;
    pinnedToBottomRef.current = true;
    send(value);
    setInput('');
  }, [input, isStreaming, send]);

  if (isLoading) {
    return (
      <div className="grid flex-1 place-items-center p-6">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-center">
        <div className="max-w-xs space-y-3">
          <AssistantAvatar size={48} />
          <p className="text-sm text-[var(--text-body)]">
            Masuk untuk mulai mengobrol dengan Asisten UT Taiwan.
          </p>
          <Link
            href="/login?redirect=/chat"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <AssistantAvatar size={56} />
            <div className="space-y-1">
              <p className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--foreground)]">
                Halo, saya Asisten UT Taiwan
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Tanyakan apa saja tentang kuliah, ujian, atau layanan UT.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    pinnedToBottomRef.current = true;
                    send(q);
                  }}
                  className="rounded-full border border-[var(--border-subtle)] bg-indigo-50 px-3.5 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 active:scale-[0.98]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      {status === 'expired' && (
        <div className="border-t border-[var(--border-subtle)] bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          Sesi berakhir. Muat ulang halaman untuk melanjutkan.
        </div>
      )}
      {status === 'closed' && (
        <div className="flex items-center justify-center gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-4 py-2 text-xs text-[var(--text-body)]">
          Koneksi terputus.
          <button type="button" onClick={retry} className="font-semibold text-indigo-600 hover:text-indigo-700">
            Coba lagi
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-[var(--border-subtle)] bg-[var(--surface)] p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            enterKeyHint="send"
            placeholder="Tulis pesan..."
            aria-label="Tulis pesan"
            className="max-h-[132px] flex-1 resize-none rounded-xl border border-[var(--border-default)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/30"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Kirim pesan"
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white transition-[background-color,transform] active:scale-95',
              canSend ? 'bg-indigo-600 hover:bg-indigo-700' : 'cursor-not-allowed bg-[var(--border-strong)]',
            )}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        {variant === 'page' && (
          <p className="mt-1.5 px-1 text-[11px] text-[var(--text-muted)]">
            Tekan Enter untuk kirim, Shift + Enter untuk baris baru.
          </p>
        )}
      </form>
    </div>
  );
}
