import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatLauncherLazy from '@/components/chat/ChatLauncherLazy';

vi.mock('@/components/chat/ChatLauncher', () => ({
  default: () => <div data-testid="launcher" />,
}));

describe('the deferred chat launcher', () => {
  test('the launcher still arrives once the page has hydrated', async () => {
    // It is loaded with ssr:false to keep Framer Motion and react-markdown out
    // of the first paint — but deferred must not mean never.
    render(<ChatLauncherLazy />);
    expect(await screen.findByTestId('launcher')).toBeInTheDocument();
  });
});
