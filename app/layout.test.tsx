import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from './layout';

// next/font runs through a build-time loader that does not exist under vitest,
// so stub it to return the variable class names the layout expects.
vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ variable: '--font-display' }),
  Nunito_Sans: () => ({ variable: '--font-body' }),
}));

// The layout mounts every provider plus the chat socket and analytics, none of
// which a structural test is about.
vi.mock('@/components/chat/ChatProvider', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/chat/ChatLauncherLazy', () => ({ default: () => null }));
vi.mock('@vercel/analytics/next', () => ({ Analytics: () => null }));
vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }));

describe('the root layout', () => {
  test('it renders the page inside it', () => {
    // jsdom warns about <html> nested in a container; the assertion is about
    // the children reaching the tree, not the document shape.
    render(<RootLayout><p>halaman</p></RootLayout>, {
      container: document.documentElement,
    });

    expect(screen.getByText('halaman')).toBeInTheDocument();
  });

  test('the page is titled and described for search and sharing', () => {
    expect(metadata.title).toMatch(/Universitas Terbuka Taiwan/);
    expect(String(metadata.description)).toMatch(/mahasiswa/);
  });

  test('the document declares Indonesian, so screen readers pronounce it', () => {
    render(<RootLayout><p>halaman</p></RootLayout>, {
      container: document.documentElement,
    });

    expect(document.querySelector('html')?.getAttribute('lang')).toBe('id');
  });
});
