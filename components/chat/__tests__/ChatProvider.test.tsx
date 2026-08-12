import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatProvider, useChat } from '@/components/chat/ChatProvider';

const showToast = vi.fn();
let socketOptions: { onError?: (code: string, message: string) => void } = {};

vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast }) }));
vi.mock('@/lib/chat/useChatSocket', () => ({
  useChatSocket: (options: typeof socketOptions) => {
    socketOptions = options;
    return {
      messages: [{ id: 'm-1', role: 'user', content: 'halo' }],
      status: 'open',
      isStreaming: false,
      send: vi.fn(),
      retry: vi.fn(),
      reset: vi.fn(),
    };
  },
}));

function Probe() {
  const chat = useChat();
  return (
    <div>
      <span data-testid="open">{String(chat.isOpen)}</span>
      <span data-testid="expanded">{String(chat.expandedInApp)}</span>
      <span data-testid="messages">{chat.messages.length}</span>
      <span data-testid="status">{chat.status}</span>
      <button onClick={chat.open}>buka</button>
      <button onClick={chat.close}>tutup</button>
      <button onClick={chat.toggle}>alih</button>
      <button onClick={() => chat.setExpandedInApp(true)}>tandai</button>
    </div>
  );
}

const renderChat = () => render(<ChatProvider><Probe /></ChatProvider>);

beforeEach(() => { showToast.mockReset(); socketOptions = {}; });

describe('the shared chat session', () => {
  test('the panel starts closed', () => {
    renderChat();
    expect(screen.getByTestId('open')).toHaveTextContent('false');
  });

  test('it can be opened, closed and toggled', async () => {
    renderChat();

    await userEvent.click(screen.getByRole('button', { name: 'buka' }));
    expect(screen.getByTestId('open')).toHaveTextContent('true');

    await userEvent.click(screen.getByRole('button', { name: 'tutup' }));
    expect(screen.getByTestId('open')).toHaveTextContent('false');

    await userEvent.click(screen.getByRole('button', { name: 'alih' }));
    expect(screen.getByTestId('open')).toHaveTextContent('true');
  });

  test('the conversation itself is exposed, so panel and page show the same one', () => {
    // One socket for the whole app: expanding the floating panel into /chat
    // must not start a second conversation.
    renderChat();
    expect(screen.getByTestId('messages')).toHaveTextContent('1');
    expect(screen.getByTestId('status')).toHaveTextContent('open');
  });

  test('a backend error is surfaced as a toast rather than swallowed', () => {
    renderChat();

    socketOptions.onError?.('rate_limited', 'Terlalu banyak permintaan');

    expect(showToast).toHaveBeenCalledWith('Terlalu banyak permintaan', 'error');
  });

  test('reaching /chat through the panel is remembered, so minimise can go back', async () => {
    renderChat();
    expect(screen.getByTestId('expanded')).toHaveTextContent('false');

    await userEvent.click(screen.getByRole('button', { name: 'tandai' }));

    expect(screen.getByTestId('expanded')).toHaveTextContent('true');
  });

  test('useChat outside the provider throws, so a mis-mount fails loudly', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/ChatProvider/);
    quiet.mockRestore();
  });
});
