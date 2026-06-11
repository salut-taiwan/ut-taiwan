'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useChat } from '@/components/chat/ChatProvider';
import ChatPanel from '@/components/chat/ChatPanel';

// Floating launcher anchored bottom-right. cs.png on a clean surface circle with
// a golden-yellow ring and a green online dot. Hidden while the panel is open so
// the panel close button is the single dismiss control. On /chat the full page
// already is the chat, so the widget stays out of the way entirely.
export default function ChatLauncher() {
  const { isOpen, open } = useChat();
  const pathname = usePathname();

  if (pathname === '/chat') return null;

  return (
    <>
      {!isOpen && (
        <motion.button
          type="button"
          onClick={open}
          aria-label="Buka bantuan chat"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[var(--surface)] shadow-[var(--shadow-lg)] ring-2 ring-amber-400"
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
      )}
      <ChatPanel />
    </>
  );
}
