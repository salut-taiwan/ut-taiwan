import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatWindow from '@/components/chat/ChatWindow';
import { MAX_MESSAGE_LENGTH } from '@/lib/chat/types';
import type { ChatMessage, ConnectionStatus } from '@/lib/chat/types';

const send = vi.fn();
const retry = vi.fn();

let auth: { user: unknown; isLoading: boolean };
let chat: { messages: ChatMessage[]; status: ConnectionStatus; isStreaming: boolean };

vi.mock('@/lib/auth', () => ({ useAuth: () => auth }));
vi.mock('@/components/chat/ChatProvider', () => ({
  useChat: () => ({ ...chat, send, retry }),
}));

const msg = (id: string, content: string, role: 'user' | 'assistant' = 'user'): ChatMessage =>
  ({ id, role, content }) as ChatMessage;

beforeEach(() => {
  send.mockReset();
  retry.mockReset();
  auth = { user: { id: 'u-1', name: 'Rina' }, isLoading: false };
  chat = { messages: [], status: 'open', isStreaming: false };
});

const show = (variant: 'panel' | 'page' = 'panel') => render(<ChatWindow variant={variant} />);
const composer = () => screen.getByLabelText('Tulis pesan');
const sendButton = () => screen.getByRole('button', { name: 'Kirim pesan' });

describe('who may chat', () => {
  test('while the session is still loading nothing is offered yet', () => {
    // Rendering the signed-out prompt first would flash "Masuk" at someone who
    // is in fact signed in.
    auth = { user: null, isLoading: true };
    show();
    expect(screen.queryByLabelText('Tulis pesan')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Masuk' })).not.toBeInTheDocument();
  });

  test('a signed-out visitor is sent to log in and comes back to the chat', () => {
    auth = { user: null, isLoading: false };
    show();
    expect(screen.getByRole('link', { name: 'Masuk' })).toHaveAttribute(
      'href',
      '/login?redirect=/chat',
    );
    expect(screen.queryByLabelText('Tulis pesan')).not.toBeInTheDocument();
  });

  test('a signed-in student gets the composer', () => {
    show();
    expect(composer()).toBeInTheDocument();
  });
});

describe('an empty conversation', () => {
  test('starter questions are offered instead of a blank window', () => {
    show();
    expect(screen.getByRole('button', { name: 'Berapa biaya kuliah di UT?' })).toBeInTheDocument();
  });

  test('tapping a starter question asks it straight away', async () => {
    show();
    await userEvent.click(screen.getByRole('button', { name: 'Apa itu layanan SALUT?' }));
    expect(send).toHaveBeenCalledWith('Apa itu layanan SALUT?');
  });

  test('once there are messages the starters step aside', () => {
    chat.messages = [msg('m-1', 'halo')];
    show();
    expect(screen.queryByRole('button', { name: 'Berapa biaya kuliah di UT?' })).not.toBeInTheDocument();
    expect(screen.getByText('halo')).toBeInTheDocument();
  });
});

describe('sending a message', () => {
  test('typing and pressing Enter sends it and clears the box', async () => {
    show();
    await userEvent.type(composer(), 'berapa biaya?{Enter}');

    expect(send).toHaveBeenCalledWith('berapa biaya?');
    expect(composer()).toHaveValue('');
  });

  test('Shift+Enter writes a new line instead of sending', async () => {
    show();
    await userEvent.type(composer(), 'baris satu{Shift>}{Enter}{/Shift}baris dua');

    expect(send).not.toHaveBeenCalled();
    expect(composer()).toHaveValue('baris satu\nbaris dua');
  });

  test('the send button submits the form too', async () => {
    show();
    await userEvent.type(composer(), 'halo');
    await userEvent.click(sendButton());
    expect(send).toHaveBeenCalledWith('halo');
  });

  test('whitespace is trimmed off before sending', async () => {
    show();
    await userEvent.type(composer(), '   halo   {Enter}');
    expect(send).toHaveBeenCalledWith('halo');
  });

  test('a message of only spaces cannot be sent', async () => {
    show();
    await userEvent.type(composer(), '    ');

    expect(sendButton()).toBeDisabled();
    await userEvent.type(composer(), '{Enter}');
    expect(send).not.toHaveBeenCalled();
  });

  test('nothing can be sent while the assistant is still replying', async () => {
    // Two questions in flight would interleave into one answer.
    chat.isStreaming = true;
    show();
    await userEvent.type(composer(), 'satu lagi');

    expect(sendButton()).toBeDisabled();
    await userEvent.type(composer(), '{Enter}');
    expect(send).not.toHaveBeenCalled();
  });

  test('pasting an over-long message is trimmed to what the backend accepts', async () => {
    // The backend closes the socket on an over-long frame, so the cap has to
    // hold here rather than being discovered as a dropped connection.
    show();
    await userEvent.click(composer());
    await userEvent.paste('x'.repeat(MAX_MESSAGE_LENGTH + 25));

    expect((composer() as HTMLTextAreaElement).value).toHaveLength(MAX_MESSAGE_LENGTH);
  });
});

describe('the connection is in trouble', () => {
  test('a dropped connection offers a retry', async () => {
    chat.status = 'closed';
    show();

    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(retry).toHaveBeenCalled();
  });

  test('an expired session says to reload rather than offering a pointless retry', () => {
    chat.status = 'expired';
    show();

    expect(screen.getByText(/Sesi berakhir/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument();
  });

  test('a healthy connection shows no banner at all', () => {
    show();
    expect(screen.queryByText(/Koneksi terputus/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sesi berakhir/)).not.toBeInTheDocument();
  });
});

describe('the two variants', () => {
  test('the full page explains the keyboard shortcut', () => {
    show('page');
    expect(screen.getByText(/Shift \+ Enter/)).toBeInTheDocument();
  });

  test('the floating panel leaves it out, since there is no room', () => {
    show('panel');
    expect(screen.queryByText(/Shift \+ Enter/)).not.toBeInTheDocument();
  });
});

describe('reading older messages', () => {
  test('scrolling up stops new messages from yanking the view back down', () => {
    chat.messages = [msg('m-1', 'satu')];
    const { container, rerender } = show();
    const log = container.querySelector('[aria-live="polite"]') as HTMLDivElement;

    Object.defineProperty(log, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(log, 'clientHeight', { value: 200, configurable: true });
    log.scrollTop = 0; // scrolled right up to the top
    log.dispatchEvent(new Event('scroll'));

    chat.messages = [msg('m-1', 'satu'), msg('m-2', 'dua', 'assistant')];
    rerender(<ChatWindow variant="panel" />);

    expect(log.scrollTop).toBe(0);
  });

  test('staying at the bottom keeps following the reply as it streams', () => {
    chat.messages = [msg('m-1', 'satu')];
    const { container, rerender } = show();
    const log = container.querySelector('[aria-live="polite"]') as HTMLDivElement;

    Object.defineProperty(log, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(log, 'clientHeight', { value: 200, configurable: true });
    log.scrollTop = 790; // within the near-bottom threshold
    log.dispatchEvent(new Event('scroll'));

    chat.messages = [msg('m-1', 'satu'), msg('m-2', 'dua', 'assistant')];
    rerender(<ChatWindow variant="panel" />);

    expect(log.scrollTop).toBe(1000);
  });

  test('sending a message brings the view back to the bottom', async () => {
    chat.messages = [msg('m-1', 'satu')];
    const { container, rerender } = show();
    const log = container.querySelector('[aria-live="polite"]') as HTMLDivElement;

    Object.defineProperty(log, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(log, 'clientHeight', { value: 200, configurable: true });
    log.scrollTop = 0;
    log.dispatchEvent(new Event('scroll'));

    await userEvent.type(composer(), 'pertanyaan baru{Enter}');
    chat.messages = [msg('m-1', 'satu'), msg('m-2', 'pertanyaan baru')];
    rerender(<ChatWindow variant="panel" />);

    expect(log.scrollTop).toBe(1000);
  });
});
