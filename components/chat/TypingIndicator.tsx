'use client';

// Three bouncing dots shown while waiting for the first streamed token.
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Asisten sedang mengetik" role="status">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-[chatBounce_1.2s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}
