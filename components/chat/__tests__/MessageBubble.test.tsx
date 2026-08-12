import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from '@/components/chat/MessageBubble';
import TypingIndicator from '@/components/chat/TypingIndicator';

describe('MessageBubble', () => {
  test('what the student typed is shown exactly as typed', () => {
    // User text is never run through markdown: asterisks in a question should
    // stay visible rather than silently turning into emphasis.
    render(<MessageBubble message={{ id: 'm-1', role: 'user', content: '**berapa** biaya?' }} />);
    expect(screen.getByText('**berapa** biaya?')).toBeInTheDocument();
  });

  test('a student message carries no assistant avatar', () => {
    const { container } = render(<MessageBubble message={{ id: 'm-1', role: 'user', content: 'halo' }} />);
    expect(container.querySelector('img')).toBeNull();
  });

  test('an assistant reply is rendered as markdown', () => {
    const { container } = render(
      <MessageBubble message={{ id: 'm-1', role: 'assistant', content: '**tebal**' }} />,
    );
    expect(container.querySelector('strong')).toHaveTextContent('tebal');
  });

  test('an assistant reply with nothing yet shows that it is thinking', () => {
    // An empty bubble would read as a broken answer.
    render(<MessageBubble message={{ id: 'm-1', role: 'assistant', content: '' }} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('once there is content the thinking indicator goes away', () => {
    render(<MessageBubble message={{ id: 'm-1', role: 'assistant', content: 'Biayanya Rp 952.000' }} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('TypingIndicator', () => {
  test('it announces itself to a screen reader rather than being silent dots', () => {
    render(<TypingIndicator />);
    const status = screen.getByRole('status');
    expect(status).toHaveAccessibleName();
  });

  test('it draws three dots', () => {
    const { container } = render(<TypingIndicator />);
    expect(container.querySelectorAll('span').length).toBeGreaterThanOrEqual(3);
  });
});
