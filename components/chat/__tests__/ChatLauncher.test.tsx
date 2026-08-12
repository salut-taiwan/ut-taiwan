import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ChatLauncher from '@/components/chat/ChatLauncher';

// Real AnimatePresence keeps an exiting node mounted for the length of its
// animation, which under fake timers never completes. These tests are about
// when the greeting appears and disappears, not how it moves.
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy({} as Record<string, unknown>, {
    get: (_t, tag: string) => {
      const Tag = tag as 'div';
      return ({ children, initial, animate, exit, transition, whileHover, whileTap, ...rest }: Record<string, unknown> & { children?: React.ReactNode }) => (
        <Tag {...rest}>{children}</Tag>
      );
    },
  }),
  useReducedMotion: () => true,
}));

const open = vi.fn();
const getChatWidget = vi.fn();
let isOpen = false;
let pathname = '/';

vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
vi.mock('@/lib/api', () => ({ api: { config: { getChatWidget: () => getChatWidget() } } }));
vi.mock('@/components/chat/ChatPanel', () => ({
  default: () => <div data-testid="panel" />,
}));
vi.mock('@/components/chat/ChatProvider', () => ({
  useChat: () => ({ isOpen, open }),
}));

const GREETING = {
  enabled: true,
  text: 'Ada yang bisa dibantu?',
  showDelayMs: 1500,
  autoHideMs: 8000,
};

const launcher = () => screen.getByRole('button', { name: 'Buka bantuan chat' });
const greeting = () => screen.queryByRole('button', { name: GREETING.text });

// fireEvent rather than userEvent: userEvent awaits its own internal timers,
// which never elapse under the fake clock this file needs for the greeting.
const click = (el: HTMLElement) => act(() => { fireEvent.click(el); });

/**
 * Run past the idle callback, then past the show delay. It has to be two
 * steps: the show timer is only registered once the config fetch resolves, so
 * the microtask queue must drain in between.
 */
async function tickPastIdle() {
  await act(async () => { vi.advanceTimersByTime(1000); });
}
async function tickPastDelay(ms = GREETING.showDelayMs) {
  await act(async () => { vi.advanceTimersByTime(ms); });
}
async function showGreeting() {
  render(<ChatLauncher />);
  await tickPastIdle();
  await tickPastDelay();
}

beforeEach(() => {
  vi.useFakeTimers();
  open.mockReset();
  getChatWidget.mockReset().mockResolvedValue({ greeting: GREETING });
  isOpen = false;
  pathname = '/';
  localStorage.clear();
  sessionStorage.clear();
  // Force the setTimeout fallback path; jsdom has no requestIdleCallback
  // anyway, and this keeps the timing under the fake clock's control.
  // @ts-expect-error deleting an optional browser API
  delete window.requestIdleCallback;
});

afterEach(() => { vi.useRealTimers(); });

describe('the floating launcher', () => {
  test('it is there to be opened', async () => {
    render(<ChatLauncher />);
    expect(launcher()).toBeInTheDocument();
  });

  test('clicking it opens the chat', async () => {
    render(<ChatLauncher />);
    await click(launcher());
    expect(open).toHaveBeenCalled();
  });

  test('while the panel is open the launcher hides, leaving one way to close', () => {
    isOpen = true;
    render(<ChatLauncher />);
    expect(screen.queryByRole('button', { name: 'Buka bantuan chat' })).not.toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });

  test('on /chat the whole widget stays out of the way', () => {
    pathname = '/chat';
    const { container } = render(<ChatLauncher />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('the greeting bubble', () => {
  test('it waits for the configured delay rather than appearing at once', async () => {
    render(<ChatLauncher />);
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(greeting()).not.toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(GREETING.showDelayMs); });
    expect(greeting()).toBeInTheDocument();
  });

  test('the text comes from the backend, so admins can change it without a deploy', async () => {
    getChatWidget.mockResolvedValue({
      greeting: { ...GREETING, text: 'Halo dari admin!' },
    });
    render(<ChatLauncher />);
    await tickPastIdle();
    await tickPastDelay();

    expect(screen.getByRole('button', { name: 'Halo dari admin!' })).toBeInTheDocument();
  });

  test('an unreachable config still greets, using the built-in text', async () => {
    getChatWidget.mockRejectedValue(new Error('network down'));
    render(<ChatLauncher />);
    await tickPastIdle();
    await tickPastDelay();

    expect(screen.getByRole('button', { name: /Aku bisa jawab semua pertanyaan kamu/ })).toBeInTheDocument();
  });

  test('an admin can switch the greeting off entirely', async () => {
    getChatWidget.mockResolvedValue({ greeting: { ...GREETING, enabled: false } });
    render(<ChatLauncher />);
    await tickPastIdle();
    await tickPastDelay(10_000);

    expect(greeting()).not.toBeInTheDocument();
  });

  test('it hides itself after a while so it does not sit over the page', async () => {
    await showGreeting();
    expect(greeting()).toBeInTheDocument();

    await tickPastDelay(GREETING.autoHideMs);
    expect(greeting()).not.toBeInTheDocument();
  });

  test('auto-hiding does not mute it — a later session may greet again', async () => {
    await showGreeting();
    await tickPastDelay(GREETING.autoHideMs);

    expect(localStorage.getItem('chat-greeting-muted')).toBeNull();
  });

  test('clicking the greeting opens the chat and silences it for good', async () => {
    await showGreeting();

    await click(greeting()!);

    expect(open).toHaveBeenCalled();
    expect(localStorage.getItem('chat-greeting-muted')).toBe('1');
  });

  test('dismissing it with ✕ silences it without opening the chat', async () => {
    await showGreeting();

    await click(screen.getByRole('button', { name: 'Tutup sapaan' }));

    expect(open).not.toHaveBeenCalled();
    expect(localStorage.getItem('chat-greeting-muted')).toBe('1');
    expect(greeting()).not.toBeInTheDocument();
  });

  test('once muted it never comes back, and the config is not even fetched', async () => {
    localStorage.setItem('chat-greeting-muted', '1');
    render(<ChatLauncher />);
    await tickPastIdle();
    await tickPastDelay(20_000);

    expect(greeting()).not.toBeInTheDocument();
    expect(getChatWidget).not.toHaveBeenCalled();
  });

  test('it greets at most once per session, not on every page view', async () => {
    sessionStorage.setItem('chat-greeting-shown', '1');
    render(<ChatLauncher />);
    await tickPastIdle();
    await tickPastDelay(20_000);

    expect(greeting()).not.toBeInTheDocument();
    expect(getChatWidget).not.toHaveBeenCalled();
  });

  test('showing it marks the session, so the next page view stays quiet', async () => {
    await showGreeting();
    expect(sessionStorage.getItem('chat-greeting-shown')).toBe('1');
  });

  test('navigating away before the delay elapses cancels the greeting', async () => {
    // Otherwise a timer fires against an unmounted component.
    const { unmount } = render(<ChatLauncher />);
    await tickPastIdle();
    unmount();

    await tickPastDelay(20_000);
    expect(greeting()).not.toBeInTheDocument();
  });

  test('a browser that blocks storage still renders the launcher', async () => {
    // Safari private browsing throws on getItem; the widget must not go down
    // with it.
    const boom = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    render(<ChatLauncher />);
    await tickPastIdle();
    await tickPastDelay(20_000);

    expect(launcher()).toBeInTheDocument();
    expect(greeting()).not.toBeInTheDocument();
    boom.mockRestore();
  });
});
