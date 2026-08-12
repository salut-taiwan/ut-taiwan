import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPanel from '@/components/chat/ChatPanel';

const close = vi.fn();
const setExpandedInApp = vi.fn();
const push = vi.fn();
let isOpen = true;

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/components/chat/ChatProvider', () => ({
  useChat: () => ({ isOpen, close, setExpandedInApp }),
}));
vi.mock('@/components/chat/ChatWindow', () => ({
  default: () => (
    <div>
      <button type="button">pertama</button>
      <button type="button">terakhir</button>
    </div>
  ),
}));

beforeEach(() => {
  close.mockReset();
  setExpandedInApp.mockReset();
  push.mockReset();
  isOpen = true;
  // jsdom reports offsetParent as null for everything, which the focus trap
  // reads as "not visible". Make the buttons visible to it.
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get() { return this.parentNode; },
  });
});

describe('the floating chat panel', () => {
  test('a closed panel is not in the page at all', () => {
    isOpen = false;
    render(<ChatPanel />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('an open panel is a labelled dialog', () => {
    render(<ChatPanel />);
    expect(screen.getByRole('dialog', { name: 'Chat Asisten UT Taiwan' })).toBeInTheDocument();
  });

  test('opening moves focus inside the panel, so Tab stays trapped from the start', () => {
    // The first focusable is the header's expand control, not the composer —
    // the trap needs focus inside the dialog, wherever that lands.
    render(<ChatPanel />);
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole('button', { name: 'Buka layar penuh' })).toHaveFocus();
  });

  test('the close button closes it', async () => {
    render(<ChatPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Tutup chat' }));
    expect(close).toHaveBeenCalled();
  });

  test('Escape closes it', async () => {
    render(<ChatPanel />);
    await userEvent.keyboard('{Escape}');
    expect(close).toHaveBeenCalled();
  });

  test('going full screen closes the panel and remembers where it came from', async () => {
    // /chat needs to know it was reached from the panel, so its minimise
    // control can come back here instead of guessing a route.
    render(<ChatPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'Buka layar penuh' }));

    expect(close).toHaveBeenCalled();
    expect(setExpandedInApp).toHaveBeenCalledWith(true);
    expect(push).toHaveBeenCalledWith('/chat');
  });

  test('Tab past the last control wraps to the first, not out to the page behind', async () => {
    render(<ChatPanel />);
    screen.getByRole('button', { name: 'terakhir' }).focus();

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Buka layar penuh' })).toHaveFocus();
  });

  test('Shift+Tab from the first control wraps to the last', async () => {
    render(<ChatPanel />);
    screen.getByRole('button', { name: 'Buka layar penuh' }).focus();

    await userEvent.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'terakhir' })).toHaveFocus();
  });

  test('a closed panel stops listening, so Escape elsewhere does nothing', async () => {
    isOpen = false;
    render(<ChatPanel />);
    await userEvent.keyboard('{Escape}');
    expect(close).not.toHaveBeenCalled();
  });
});
