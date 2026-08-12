import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import LoginPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { push, setSearchParams } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';

const email = () => screen.getByLabelText('Email');
const password = () => screen.getByLabelText('Password');
const submit = () => screen.getByRole('button', { name: 'Masuk' });

async function signInWith(user: string, pass = 'rahasia') {
  await userEvent.type(email(), user);
  await userEvent.type(password(), pass);
  await userEvent.click(submit());
}

describe('signing in', () => {
  test('a student lands on their programme after signing in', async () => {
    renderPage(<LoginPage />);

    await signInWith('budi@example.com');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/program'));
  });

  test('the session is stored so a refresh keeps them signed in', async () => {
    renderPage(<LoginPage />);

    await signInWith('budi@example.com');

    await waitFor(() => expect(localStorage.getItem('ut_token')).toBe('tok-1'));
    expect(localStorage.getItem('ut_refresh_token')).toBe('ref-1');
  });

  test('wrong credentials are reported and nothing is stored', async () => {
    server.use(
      http.post(url('/auth/login'), () =>
        HttpResponse.json({ error: 'Email atau password salah' }, { status: 401 }),
      ),
    );
    renderPage(<LoginPage />);

    await signInWith('budi@example.com', 'salah');

    expect(await screen.findByRole('alert')).toHaveTextContent(/salah/i);
    expect(push).not.toHaveBeenCalled();
    expect(localStorage.getItem('ut_token')).toBeNull();
  });

  test('the submit button is disabled while the request is in flight', async () => {
    server.use(
      http.post(url('/auth/login'), async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ token: 't', refreshToken: 'r', expiresAt: 1, user: {} });
      }),
    );
    renderPage(<LoginPage />);

    await userEvent.type(email(), 'budi@example.com');
    await userEvent.type(password(), 'rahasia');
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => expect(screen.getByRole('button', { name: /Masuk\.\.\./ })).toBeDisabled());
  });

  test('a second attempt clears the previous error', async () => {
    server.use(
      http.post(url('/auth/login'), () => HttpResponse.json({ error: 'Salah' }, { status: 401 })),
    );
    renderPage(<LoginPage />);
    await signInWith('budi@example.com', 'salah');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    server.use(http.post(url('/auth/login'), () => HttpResponse.json({
      token: 'tok-1', refreshToken: 'ref-1', expiresAt: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u-1' },
    })));
    await userEvent.click(submit());

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});

describe('an account that has not been verified', () => {
  const unverified = () =>
    server.use(
      http.post(url('/auth/login'), () =>
        HttpResponse.json({ error: 'Email belum diverifikasi' }, { status: 403 }),
      ),
    );

  test('the student is offered a fresh verification email', async () => {
    // Without this they are stuck: the first email may be hours old or lost.
    unverified();
    renderPage(<LoginPage />);

    await signInWith('budi@example.com');

    expect(
      await screen.findByRole('button', { name: 'Kirim ulang email verifikasi' }),
    ).toBeInTheDocument();
  });

  test('resending confirms it was sent', async () => {
    unverified();
    renderPage(<LoginPage />);
    await signInWith('budi@example.com');

    await userEvent.click(await screen.findByRole('button', { name: 'Kirim ulang email verifikasi' }));

    expect(await screen.findByText(/telah dikirim ulang/)).toBeInTheDocument();
  });

  test('the offer disappears once taken, so it cannot be spammed', async () => {
    unverified();
    renderPage(<LoginPage />);
    await signInWith('budi@example.com');
    await userEvent.click(await screen.findByRole('button', { name: 'Kirim ulang email verifikasi' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Kirim ulang email verifikasi' }),
      ).not.toBeInTheDocument(),
    );
  });

  test('a failed resend does not claim success', async () => {
    unverified();
    server.use(
      http.post(url('/auth/resend-verification'), () =>
        HttpResponse.json({ error: 'Tunggu 60 detik' }, { status: 400 }),
      ),
    );
    renderPage(<LoginPage />);
    await signInWith('budi@example.com');

    await userEvent.click(await screen.findByRole('button', { name: 'Kirim ulang email verifikasi' }));

    await waitFor(() => expect(screen.queryByText(/telah dikirim ulang/)).not.toBeInTheDocument());
  });

  test('an ordinary wrong password offers no resend', async () => {
    server.use(
      http.post(url('/auth/login'), () => HttpResponse.json({ error: 'Salah' }, { status: 401 })),
    );
    renderPage(<LoginPage />);

    await signInWith('budi@example.com', 'salah');

    await screen.findByRole('alert');
    expect(
      screen.queryByRole('button', { name: 'Kirim ulang email verifikasi' }),
    ).not.toBeInTheDocument();
  });
});

describe('arriving from a verification link', () => {
  test('the student is told it worked', async () => {
    setSearchParams('verified=true');

    renderPage(<LoginPage />);

    expect(await screen.findByText(/berhasil diverifikasi/)).toBeInTheDocument();
  });

  test('an ordinary visit shows no such banner', async () => {
    renderPage(<LoginPage />);

    await screen.findByLabelText('Email');
    expect(screen.queryByText(/berhasil diverifikasi/)).not.toBeInTheDocument();
  });
});

describe('the password field', () => {
  test('it is hidden by default', async () => {
    renderPage(<LoginPage />);

    expect(password()).toHaveAttribute('type', 'password');
  });

  test('it can be revealed and hidden again', async () => {
    renderPage(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Tampilkan password' }));
    expect(password()).toHaveAttribute('type', 'text');

    await userEvent.click(screen.getByRole('button', { name: 'Sembunyikan password' }));
    expect(password()).toHaveAttribute('type', 'password');
  });
});

describe('getting to the rest of the site', () => {
  test('a visitor with no account is pointed at registration', async () => {
    renderPage(<LoginPage />);

    expect(screen.getByRole('link', { name: 'Daftar sekarang' })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
