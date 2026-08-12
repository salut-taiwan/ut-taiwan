import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import ChatPage from './page';
import { back, push } from '@/test/utils/routerMock';

const open = vi.fn();
const setExpandedInApp = vi.fn();
let expandedInApp = false;

vi.mock('@/components/chat/ChatProvider', () => ({
  useChat: () => ({ open, expandedInApp, setExpandedInApp }),
}));
vi.mock('@/components/chat/ChatWindow', () => ({
  default: ({ variant }: { variant: string }) => <div data-testid="window">{variant}</div>,
}));

const show = () => {
  open.mockClear();
  setExpandedInApp.mockClear();
  return render(<ChatPage />);
};

describe('the full-screen chat', () => {
  test('it fills the page rather than rendering the floating panel', () => {
    expandedInApp = false;
    show();

    expect(screen.getByTestId('window')).toHaveTextContent('page');
  });

  test('arriving from the floating panel, minimising hands the conversation back', async () => {
    // The panel and the page share one session, so minimising must reopen the
    // panel and step back rather than starting a second conversation.
    expandedInApp = true;
    show();

    await userEvent.click(screen.getByRole('button', { name: 'Perkecil chat' }));

    expect(open).toHaveBeenCalled();
    expect(setExpandedInApp).toHaveBeenCalledWith(false);
    expect(back).toHaveBeenCalled();
  });

  test('arriving directly, minimising goes home instead of leaving the site', async () => {
    // router.back() from a direct visit would back out of the app entirely.
    expandedInApp = false;
    show();

    await userEvent.click(screen.getByRole('button', { name: 'Perkecil chat' }));

    expect(push).toHaveBeenCalledWith('/');
    expect(back).not.toHaveBeenCalled();
  });

  test('minimising always reopens the panel, however it was reached', async () => {
    expandedInApp = false;
    show();

    await userEvent.click(screen.getByRole('button', { name: 'Perkecil chat' }));

    expect(open).toHaveBeenCalled();
  });
});
