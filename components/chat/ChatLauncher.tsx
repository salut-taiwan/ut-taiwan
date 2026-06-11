'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useChat } from '@/components/chat/ChatProvider';
import ChatPanel from '@/components/chat/ChatPanel';
import { api } from '@/lib/api';

const GREETING_SHOWN_KEY = 'chat-greeting-shown'; // sessionStorage: at most once per session
const GREETING_MUTED_KEY = 'chat-greeting-muted'; // localStorage: ✕ or engagement silences it for good

// Greeting text and timing live in the backend (/config/chat-widget); these
// defaults only kick in when the API is unreachable.
const GREETING_FALLBACK = {
  enabled: true,
  text: 'Aku bisa jawab semua pertanyaan kamu sini, serius deh. 👋',
  showDelayMs: 1500,
  autoHideMs: 8000,
};

// Floating launcher anchored bottom-right. cs.png on a clean surface circle with
// a golden-yellow ring and a green online dot. Hidden while the panel is open so
// the panel close button is the single dismiss control. On /chat the full page
// already is the chat, so the widget stays out of the way entirely.
export default function ChatLauncher() {
  const { isOpen, open } = useChat();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingText, setGreetingText] = useState(GREETING_FALLBACK.text);

  useEffect(() => {
    try {
      if (
        localStorage.getItem(GREETING_MUTED_KEY) === '1' ||
        sessionStorage.getItem(GREETING_SHOWN_KEY) === '1'
      ) {
        return;
      }
    } catch {
      return;
    }
    let cancelled = false;
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    api.config
      .getChatWidget()
      .then((cfg) => cfg.greeting)
      .catch(() => GREETING_FALLBACK)
      .then((greeting) => {
        if (cancelled || !greeting.enabled) return;
        setGreetingText(greeting.text);
        showTimer = setTimeout(() => {
          setShowGreeting(true);
          try {
            sessionStorage.setItem(GREETING_SHOWN_KEY, '1');
          } catch {}
          // Auto-hide without muting: the greeting may still appear in a future session.
          hideTimer = setTimeout(() => setShowGreeting(false), greeting.autoHideMs);
        }, greeting.showDelayMs);
      });
    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (pathname === '/chat') return null;

  const muteGreeting = () => {
    setShowGreeting(false);
    try {
      localStorage.setItem(GREETING_MUTED_KEY, '1');
    } catch {}
  };

  const openChat = () => {
    muteGreeting();
    open();
  };

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
          <AnimatePresence>
            {showGreeting && (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 6 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
                transition={
                  reduceMotion
                    ? { duration: 0.15 }
                    : { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }
                }
                style={{ transformOrigin: 'bottom right' }}
                className="relative mb-1 rounded-2xl rounded-br-sm bg-[var(--surface)] shadow-[var(--shadow-lg)] ring-1 ring-black/5"
              >
                <button
                  type="button"
                  onClick={openChat}
                  className="block max-w-[220px] px-4 py-2.5 text-left text-sm font-medium text-[var(--foreground)]"
                >
                  {greetingText}
                </button>
                <button
                  type="button"
                  aria-label="Tutup sapaan"
                  onClick={(e) => {
                    e.stopPropagation();
                    muteGreeting();
                  }}
                  className="absolute -left-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[var(--surface)] text-xs leading-none text-[var(--text-muted)] shadow-[var(--shadow-sm)] ring-1 ring-black/10"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            type="button"
            onClick={openChat}
            aria-label="Buka bantuan chat"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--surface)] shadow-[var(--shadow-lg)] ring-2 ring-amber-400"
          >
            <Image
              src="/images/cs.png"
              alt=""
              width={56}
              height={56}
              className="h-full w-full rounded-full object-cover"
            />
            <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]" />
          </motion.button>
        </div>
      )}
      <ChatPanel />
    </>
  );
}
