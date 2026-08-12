import { render, screen, waitFor, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import Providers from '@/components/ui/Providers';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { ToastProvider } from '@/components/ui/Toast';
import { signIn } from '@/test/fixtures';

/**
 * The same provider nesting as app/layout.tsx, minus ChatProvider — it opens a
 * WebSocket, which no page test is about. A page that needs the chat mounts it
 * itself.
 */
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartProvider>
      </AuthProvider>
    </Providers>
  );
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** Seed a session before mounting. Omit to render as a signed-out visitor. */
  as?: 'student' | 'admin';
}

export function renderPage(ui: ReactElement, { as, ...options }: Options = {}) {
  if (as) signIn(as);
  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Wait until AuthProvider has finished restoring the session.
 *
 * Nearly every page renders a skeleton until `isLoading` clears, so asserting
 * before this point tests the skeleton. Pages differ in what they show first,
 * so this waits for the spinner-ish placeholders to go rather than for any one
 * element.
 */
export async function settled() {
  await waitFor(
    () => {
      const busy = document.querySelectorAll('.skeleton, [aria-busy="true"]');
      if (busy.length > 0) throw new Error('still loading');
    },
    { timeout: 3000 },
  );
}

export { screen, waitFor };
