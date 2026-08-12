'use client';

import dynamic from 'next/dynamic';

// The launcher pulls in Framer Motion, the chat panel, and react-markdown +
// remark/rehype plugins. None of that is needed for first paint on any page, so
// defer the whole subtree until after hydration. ssr:false keeps it out of the
// server-rendered HTML and the initial JS bundle; the lightweight ChatProvider
// (which owns the socket, closed until first send) still loads eagerly.
const ChatLauncher = dynamic(() => import('./ChatLauncher'), { ssr: false });

export default function ChatLauncherLazy() {
  return <ChatLauncher />;
}
