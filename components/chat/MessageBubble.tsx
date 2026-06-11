'use client';

import Image from 'next/image';
import { type ChatMessage } from '@/lib/chat/types';
import Markdown from '@/components/chat/Markdown';
import TypingIndicator from '@/components/chat/TypingIndicator';

// cs.png on a clean surface circle with a thin golden-yellow ring (the single
// brand-accent signature of the assistant).
export function AssistantAvatar({ size = 28 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-[var(--surface)] ring-2 ring-amber-400"
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/cs.png"
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    </span>
  );
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isStreamingPlaceholder = message.role === 'assistant' && message.content.length === 0;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-indigo-600 px-3.5 py-2 text-sm text-white shadow-[var(--shadow-xs)]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <AssistantAvatar />
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3.5 py-2 [font-variant-numeric:tabular-nums]">
        {isStreamingPlaceholder ? <TypingIndicator /> : <Markdown content={message.content} />}
      </div>
    </div>
  );
}
