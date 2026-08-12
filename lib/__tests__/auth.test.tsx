import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider, useAuth } from '@/lib/auth';
import { FakeEventSource } from '@/test/utils/fakeEventSource';

const getMe = vi.fn();
const login = vi.fn();
const logout = vi.fn();
const refresh = vi.fn();
let onSessionExpired: (() => void) | null = null;

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      getMe: (...a: unknown[]) => getMe(...a),
      login: (...a: unknown[]) => login(...a),
      logout: (...a: unknown[]) => logout(...a),
      refresh: (...a: unknown[]) => refresh(...a),
    },
  },
  getExpiresAt: () => {
    const v = localStorage.getItem('ut_expires_at');
    return v ? Number(v) : null;
  },
  setOnSessionExpired: (cb: (() => void) | null) => { onSessionExpired = cb; },
}));

const profile = (over = {}) => ({
  id: 'u-1', email: 'budi@example.com', name: 'Budi', role: 'student',
  is_salut: false, is_salut_active: false, salut_status: 'none', is_verified: true,
  ...over,
});

/** Renders the auth state as text so assertions read like the UI would. */
function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="user">{auth.user?.name ?? 'anonymous'}</span>
      <span data-testid="salut">{auth.user?.salut_status ?? '-'}</span>
      <span data-testid="warning">{String(auth.showExpiryWarning)}</span>
      <span data-testid="expired">{String(auth.isSessionExpired)}</span>
      <button onClick={() => auth.login('a@b.c', 'pw').catch(() => {})}>masuk</button>
      <button onClick={() => auth.logout()}>keluar</button>
      <button onClick={() => auth.stayLoggedIn()}>tetap masuk</button>
      <button onClick={() => auth.dismissExpired()}>tutup</button>
    </div>
  );
}

const renderAuth = () => render(<AuthProvider><Probe /></AuthProvider>);
const settled = () => waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

const inSeconds = (msFromNow: number) => String(Math.floor((Date.now() + msFromNow) / 1000));

function storedSession(expiresInMs = 3600_000) {
  localStorage.setItem('ut_token', 'tok-1');
  localStorage.setItem('ut_refresh_token', 'ref-1');
  localStorage.setItem('ut_expires_at', inSeconds(expiresInMs));
}

beforeEach(() => {
  getMe.mockReset().mockResolvedValue(profile());
  login.mockReset();
  logout.mockReset().mockResolvedValue(undefined);
  refresh.mockReset();
  onSessionExpired = null;
});

afterEach(() => { vi.useRealTimers(); });

describe('session restore', () => {
  test('with no stored token the app settles as anonymous without calling the API', async () => {
    renderAuth();
    await settled();
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(getMe).not.toHaveBeenCalled();
  });

  test('a stored token restores the profile', async () => {
    storedSession();
    renderAuth();
    await settled();
    expect(screen.getByTestId('user')).toHaveTextContent('Budi');
  });

  test('a rejected profile lookup clears every stored credential', async () => {
    // Otherwise the app looks signed in but every request 401s.
    storedSession();
    getMe.mockRejectedValue(new Error('401'));
    renderAuth();
    await settled();

    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(localStorage.getItem('ut_token')).toBeNull();
    expect(localStorage.getItem('ut_refresh_token')).toBeNull();
    expect(localStorage.getItem('ut_expires_at')).toBeNull();
  });

  test('missing membership flags default rather than rendering undefined', async () => {
    storedSession();
    getMe.mockResolvedValue({ id: 'u-1', email: 'a@b.c', name: 'Budi', role: 'student' });
    renderAuth();
    await settled();
    expect(screen.getByTestId('salut')).toHaveTextContent('none');
  });
});

describe('expiry timers', () => {
  test('the warning appears five minutes before the token dies, not on load', async () => {
    // expiresAt is in seconds; treating it as milliseconds would fire instantly.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    storedSession(10 * 60_000);
    renderAuth();
    await settled();

    expect(screen.getByTestId('warning')).toHaveTextContent('false');
    await act(async () => { vi.advanceTimersByTime(5 * 60_000 + 100); });
    expect(screen.getByTestId('warning')).toHaveTextContent('true');
  });

  test('a token already inside the warning window warns straight away', async () => {
    storedSession(60_000);
    renderAuth();
    await settled();
    expect(screen.getByTestId('warning')).toHaveTextContent('true');
  });

  test('the session is marked expired when the token runs out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    storedSession(60_000);
    renderAuth();
    await settled();

    await act(async () => { vi.advanceTimersByTime(61_000); });

    expect(screen.getByTestId('expired')).toHaveTextContent('true');
    expect(screen.getByTestId('warning')).toHaveTextContent('false');
  });

  test('an already-expired token schedules nothing — the first 401 handles it', async () => {
    storedSession(-60_000);
    renderAuth();
    await settled();
    expect(screen.getByTestId('warning')).toHaveTextContent('false');
    expect(screen.getByTestId('expired')).toHaveTextContent('false');
  });

  test('a refreshed token clears the warning and reschedules', async () => {
    storedSession(60_000);
    renderAuth();
    await settled();
    expect(screen.getByTestId('warning')).toHaveTextContent('true');

    await act(async () => {
      window.dispatchEvent(new CustomEvent('ut:token-refreshed', {
        detail: { expiresAt: Number(inSeconds(3600_000)) },
      }));
    });

    expect(screen.getByTestId('warning')).toHaveTextContent('false');
  });
});

describe('login and logout', () => {
  test('a successful login stores the session and the profile', async () => {
    login.mockResolvedValue({ token: 'tok-9', refreshToken: 'ref-9', expiresAt: Number(inSeconds(3600_000)) });
    renderAuth();
    await settled();

    await userEvent.click(screen.getByRole('button', { name: 'masuk' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Budi'));
    expect(localStorage.getItem('ut_token')).toBe('tok-9');
  });

  test('a login whose profile lookup fails leaves no half-signed-in state', async () => {
    login.mockResolvedValue({ token: 'tok-9', refreshToken: 'ref-9', expiresAt: 1 });
    getMe.mockRejectedValue(new Error('no profile'));
    renderAuth();
    await settled();

    await userEvent.click(screen.getByRole('button', { name: 'masuk' }));

    await waitFor(() => expect(localStorage.getItem('ut_token')).toBeNull());
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
  });

  test('logging out clears the session even if the server call fails', async () => {
    storedSession();
    logout.mockRejectedValue(new Error('offline'));
    renderAuth();
    await settled();

    await userEvent.click(screen.getByRole('button', { name: 'keluar' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'));
    expect(localStorage.getItem('ut_token')).toBeNull();
  });
});

describe('live status updates', () => {
  test('a stream is opened for a signed-in user, carrying the token', async () => {
    storedSession();
    renderAuth();
    await settled();

    await waitFor(() => expect(FakeEventSource.last).toBeDefined());
    expect(FakeEventSource.last!.url).toContain('/sse/status');
    expect(FakeEventSource.last!.url).toContain(encodeURIComponent('tok-1'));
  });

  test('no stream is opened for an anonymous visitor', async () => {
    renderAuth();
    await settled();
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  test('an approval arriving mid-session updates the UI without a reload', async () => {
    storedSession();
    renderAuth();
    await settled();
    await waitFor(() => expect(FakeEventSource.last).toBeDefined());

    await act(async () => {
      FakeEventSource.last!.emit({ is_salut: true, is_salut_active: true, salut_status: 'approved' });
    });

    expect(screen.getByTestId('salut')).toHaveTextContent('approved');
  });

  test('a malformed frame is ignored rather than crashing the app', async () => {
    storedSession();
    renderAuth();
    await settled();
    await waitFor(() => expect(FakeEventSource.last).toBeDefined());

    await act(async () => { FakeEventSource.last!.emit('not json at all'); });

    expect(screen.getByTestId('user')).toHaveTextContent('Budi');
  });
});

describe('the API layer can end the session', () => {
  test('a 401 that survives refresh flips the app into the expired state', async () => {
    storedSession();
    renderAuth();
    await settled();

    await act(async () => { onSessionExpired?.(); });

    expect(screen.getByTestId('expired')).toHaveTextContent('true');
  });
});

describe('useAuth outside a provider', () => {
  test('throws, so a mis-mounted component fails loudly', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow();
    quiet.mockRestore();
  });
});

describe('rescuing a session that is about to expire', () => {
  // A student filling in the checkout address must not lose it because a token
  // aged out while they typed. The warning offers to renew in place.
  const warn = () => userEvent.click(screen.getByRole('button', { name: 'tetap masuk' }));

  test('renewing stores the new credentials and drops the warning', async () => {
    storedSession();
    refresh.mockResolvedValue({
      token: 'tok-2',
      refreshToken: 'ref-2',
      expiresAt: Math.floor((Date.now() + 3600_000) / 1000),
    });
    renderAuth();
    await settled();

    await warn();

    await waitFor(() => expect(localStorage.getItem('ut_token')).toBe('tok-2'));
    expect(localStorage.getItem('ut_refresh_token')).toBe('ref-2');
    expect(screen.getByTestId('warning')).toHaveTextContent('false');
    expect(screen.getByTestId('expired')).toHaveTextContent('false');
  });

  test('a refresh the server rejects ends the session honestly', async () => {
    // Silently doing nothing would leave the student clicking a dead button.
    storedSession();
    refresh.mockRejectedValue(new Error('refresh token revoked'));
    renderAuth();
    await settled();

    await warn();

    await waitFor(() => expect(screen.getByTestId('expired')).toHaveTextContent('true'));
    expect(screen.getByTestId('warning')).toHaveTextContent('false');
  });

  test('with no refresh token there is nothing to renew, so it expires at once', async () => {
    storedSession();
    localStorage.removeItem('ut_refresh_token');
    renderAuth();
    await settled();

    await warn();

    await waitFor(() => expect(screen.getByTestId('expired')).toHaveTextContent('true'));
    expect(refresh).not.toHaveBeenCalled();
  });

  test('dismissing the expiry notice clears it', async () => {
    storedSession();
    refresh.mockRejectedValue(new Error('nope'));
    renderAuth();
    await settled();
    await warn();
    await waitFor(() => expect(screen.getByTestId('expired')).toHaveTextContent('true'));

    await userEvent.click(screen.getByRole('button', { name: 'tutup' }));

    expect(screen.getByTestId('expired')).toHaveTextContent('false');
  });
});
