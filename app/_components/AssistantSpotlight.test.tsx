import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssistantSpotlight from './AssistantSpotlight';

const open = vi.fn();
vi.mock('@/components/chat/ChatProvider', () => ({ useChat: () => ({ open }) }));

describe('the assistant spotlight', () => {
  test('it introduces the assistant', () => {
    render(<AssistantSpotlight />);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  test('it opens the chat panel rather than navigating away', async () => {
    // The visitor is mid-page; sending them to /chat would lose their place.
    render(<AssistantSpotlight />);

    const trigger = screen
      .getAllByRole('button')
      .find((b) => /tanya|chat|coba|mulai/i.test(b.textContent ?? ''));
    if (!trigger) throw new Error('no call to action in the spotlight');
    await userEvent.click(trigger);

    expect(open).toHaveBeenCalled();
  });
});
