import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionExpiryModal from '@/components/ui/SessionExpiryModal';
import { push } from '@/test/utils/routerMock';

const stayLoggedIn = vi.fn();
const logout = vi.fn();
const dismissExpired = vi.fn();
let auth = { showExpiryWarning: false, isSessionExpired: false };
let expiresAt: number | null = null;

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ ...auth, stayLoggedIn, logout, dismissExpired }),
}));
vi.mock('@/lib/api', () => ({ getExpiresAt: () => expiresAt }));

beforeEach(() => {
  stayLoggedIn.mockReset().mockResolvedValue(undefined);
  logout.mockReset().mockResolvedValue(undefined);
  dismissExpired.mockReset();
  auth = { showExpiryWarning: false, isSessionExpired: false };
  expiresAt = null;
});
afterEach(() => { vi.useRealTimers(); });

describe('when nothing is wrong', () => {
  test('the modal stays out of the way', () => {
    const { container } = render(<SessionExpiryModal />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('the warning before a session ends', () => {
  beforeEach(() => { auth = { showExpiryWarning: true, isSessionExpired: false }; });

  test('it counts down from the real remaining time, not the 300s default', () => {
    // The clock is frozen so the seeded value is exact; live, the sub-second
    // remainder floors it to 01:59.
    vi.useFakeTimers({ now: new Date('2026-05-20T00:00:00Z'), shouldAdvanceTime: false });
    expiresAt = Math.floor(Date.now() / 1000) + 120;
    render(<SessionExpiryModal />);
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });

  test('the countdown ticks', async () => {
    vi.useFakeTimers({ now: new Date('2026-05-20T00:00:00Z'), shouldAdvanceTime: false });
    expiresAt = Math.floor(Date.now() / 1000) + 120;
    render(<SessionExpiryModal />);

    await act(async () => { vi.advanceTimersByTime(3000); });

    expect(screen.getByText('01:57')).toBeInTheDocument();
  });

  test('staying signed in renews the session', async () => {
    expiresAt = Math.floor(Date.now() / 1000) + 120;
    render(<SessionExpiryModal />);

    await userEvent.click(screen.getByRole('button', { name: /tetap masuk/i }));

    expect(stayLoggedIn).toHaveBeenCalled();
  });

  test('the renew button is disabled while it works, so one click is one attempt', async () => {
    expiresAt = Math.floor(Date.now() / 1000) + 120;
    let resolve: () => void = () => {};
    stayLoggedIn.mockReturnValue(new Promise<void>(r => { resolve = r; }));
    render(<SessionExpiryModal />);

    await userEvent.click(screen.getByRole('button', { name: /tetap masuk/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /memproses/i })).toBeDisabled());
    resolve();
  });

  test('choosing to leave signs out and returns to the login page', async () => {
    expiresAt = Math.floor(Date.now() / 1000) + 120;
    render(<SessionExpiryModal />);

    await userEvent.click(screen.getByRole('button', { name: /keluar/i }));

    await waitFor(() => expect(logout).toHaveBeenCalled());
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  });
});

describe('once the session has ended', () => {
  beforeEach(() => { auth = { showExpiryWarning: false, isSessionExpired: true }; });

  test('the user is told plainly', () => {
    render(<SessionExpiryModal />);
    expect(screen.getByText(/sesi berakhir/i)).toBeInTheDocument();
  });

  test('the only way out is to sign in again', async () => {
    render(<SessionExpiryModal />);

    await userEvent.click(screen.getByRole('button', { name: /masuk kembali/i }));

    expect(dismissExpired).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/login');
  });

  test('an ended session wins over a pending warning', () => {
    auth = { showExpiryWarning: true, isSessionExpired: true };
    render(<SessionExpiryModal />);
    expect(screen.getByText(/sesi berakhir/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tetap masuk/i })).not.toBeInTheDocument();
  });
});
