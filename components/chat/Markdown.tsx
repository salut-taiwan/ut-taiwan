'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

// Render untrusted LLM markdown safely. rehype-sanitize strips dangerous HTML;
// rehype-raw is intentionally not used. Styling maps to brand design tokens so
// light and dark themes stay consistent.
const components: Components = {
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
    >
      {children}
    </a>
  ),
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => (
    <h3 className="mt-3 mb-1.5 font-[family-name:var(--font-display)] text-base font-bold first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-1.5 font-[family-name:var(--font-display)] text-base font-bold first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-3 mb-1 font-[family-name:var(--font-display)] text-sm font-semibold first:mt-0">
      {children}
    </h4>
  ),
  strong: ({ children }) => <strong className="font-semibold text-[var(--foreground)]">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-indigo-300 pl-3 text-[var(--text-body)] italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = (className ?? '').includes('language-');
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3 font-mono text-[13px] leading-relaxed">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-[var(--surface-sunken)] px-1.5 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-2">{children}</pre>,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-2 py-1 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[var(--border-subtle)] px-2 py-1">{children}</td>
  ),
  hr: () => <hr className="my-3 border-[var(--border-subtle)]" />,
  img: ({ src, alt }) => {
    // Only render https images (the knowledge base stores real image URLs).
    if (typeof src !== 'string' || !src.startsWith('https://')) return null;
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="mt-2 block">
        <img
          src={src}
          alt={typeof alt === 'string' ? alt : ''}
          loading="lazy"
          className="max-h-72 w-auto max-w-full rounded-lg border border-[var(--border-subtle)] object-contain"
        />
      </a>
    );
  },
};

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="text-sm text-[var(--foreground)] [text-wrap:pretty]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
