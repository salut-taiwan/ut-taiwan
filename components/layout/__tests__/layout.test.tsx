import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MainContainer from '@/components/layout/MainContainer';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import VerifyEmailBanner from '@/components/layout/VerifyEmailBanner';
import { setPathname } from '@/test/utils/routerMock';

const resendVerification = vi.fn();
const showToast = vi.fn();
let currentUser: Record<string, unknown> | null = null;

vi.mock('@/lib/api', () => ({
  api: { auth: { resendVerification: (...a: unknown[]) => resendVerification(...a) } },
}));
vi.mock('@/lib/auth', () => ({ useAuth: () => ({ user: currentUser }) }));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast }) }));

beforeEach(() => {
  resendVerification.mockReset().mockResolvedValue(undefined);
  showToast.mockReset();
  currentUser = null;
});

describe('MainContainer', () => {
  const bleeds = (container: HTMLElement) =>
    container.querySelector('main > div[class*="max-w-7xl"]') === null;

  test('the landing page and the auth pages run edge to edge', () => {
    for (const path of ['/', '/login', '/register']) {
      setPathname(path);
      const { container, unmount } = render(<MainContainer>isi</MainContainer>);
      expect(bleeds(container), `${path} should be full bleed`).toBe(true);
      unmount();
    }
  });

  test('every other page gets the padded container', () => {
    for (const path of ['/toko', '/orders/abc', '/salut']) {
      setPathname(path);
      const { container, unmount } = render(<MainContainer>isi</MainContainer>);
      expect(bleeds(container), `${path} should be contained`).toBe(false);
      unmount();
    }
  });

  test('the match is exact — a trailing slash is a different page', () => {
    setPathname('/login/');
    const { container } = render(<MainContainer>isi</MainContainer>);
    expect(bleeds(container)).toBe(false);
  });

  test('children render either way', () => {
    setPathname('/toko');
    render(<MainContainer><p>isi halaman</p></MainContainer>);
    expect(screen.getByText('isi halaman')).toBeInTheDocument();
  });
});

describe('ConditionalFooter', () => {
  test('the footer is hidden while signing in or registering', () => {
    for (const path of ['/login', '/register']) {
      setPathname(path);
      const { container, unmount } = render(<ConditionalFooter />);
      expect(container.querySelector('footer'), `${path}`).toBeNull();
      unmount();
    }
  });

  test('it appears everywhere else', () => {
    setPathname('/toko');
    const { container } = render(<ConditionalFooter />);
    expect(container.querySelector('footer')).toBeTruthy();
  });

  test('it carries the contact address', () => {
    setPathname('/');
    render(<ConditionalFooter />);
    expect(screen.getByText('pengurus.uttaiwan@gmail.com')).toBeInTheDocument();
  });

  test('external links cannot reach back into this tab', () => {
    setPathname('/');
    const { container } = render(<ConditionalFooter />);
    const external = [...container.querySelectorAll('a[target="_blank"]')];
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });
});

describe('VerifyEmailBanner', () => {
  test('a signed-out visitor is not nagged', () => {
    const { container } = render(<VerifyEmailBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  test('a verified account is not nagged', () => {
    currentUser = { email: 'a@b.c', is_verified: true };
    const { container } = render(<VerifyEmailBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  test('an older profile with no verification flag is not nagged either', () => {
    // The check is strictly `!== false`, so an absent flag stays quiet rather
    // than accusing an established account of being unverified.
    currentUser = { email: 'a@b.c' };
    const { container } = render(<VerifyEmailBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  test('an unverified account is told, and shown their address', () => {
    currentUser = { email: 'budi@example.com', is_verified: false };
    render(<VerifyEmailBanner />);
    expect(screen.getByText(/budi@example.com/)).toBeInTheDocument();
  });

  test('resending reports success', async () => {
    currentUser = { email: 'budi@example.com', is_verified: false };
    render(<VerifyEmailBanner />);

    await userEvent.click(screen.getByRole('button', { name: /kirim/i }));

    expect(resendVerification).toHaveBeenCalledWith('budi@example.com');
    await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/dikirim/i), 'success'));
  });

  test('a failure is reported with the server\'s own message', async () => {
    currentUser = { email: 'budi@example.com', is_verified: false };
    resendVerification.mockRejectedValue(new Error('Terlalu sering, coba lagi nanti'));
    render(<VerifyEmailBanner />);

    await userEvent.click(screen.getByRole('button', { name: /kirim/i }));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Terlalu sering, coba lagi nanti', 'error'));
  });

  test('the button is disabled while sending, so one click sends one email', async () => {
    currentUser = { email: 'budi@example.com', is_verified: false };
    let resolve: () => void = () => {};
    resendVerification.mockReturnValue(new Promise<void>(r => { resolve = r; }));
    render(<VerifyEmailBanner />);

    await userEvent.click(screen.getByRole('button', { name: /kirim/i }));

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
    resolve();
  });
});
