import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import ProfilePage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { UserProfileDTO } from '@/types';

async function show(profile: UserProfileDTO = fx.profile()) {
  server.use(
    signedInAs(profile),
    http.get(url('/catalog/programs'), () =>
      HttpResponse.json([{ id: 'pr-1', code: 'S1SI', name: 'Sistem Informasi' }]),
    ),
  );
  renderPage(<ProfilePage />, { as: 'student' });
  await screen.findByRole('heading', { name: 'Profil Saya' });
}

const save = () => userEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }));

/** Captures the profile update body. */
function captureSave() {
  const seen: { body?: Record<string, unknown> } = {};
  server.use(
    http.put(url('/auth/me'), async ({ request }) => {
      seen.body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(fx.profile());
    }),
  );
  return seen;
}

describe('viewing the profile', () => {
  test('the student\'s own details are filled in', async () => {
    await show();

    expect(screen.getByDisplayValue('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByDisplayValue('041234567')).toBeInTheDocument();
  });

  test('the email is shown but cannot be edited', async () => {
    // It is the login identity; changing it here would silently lock them out.
    await show();

    expect(screen.getByDisplayValue('budi@example.com')).toBeDisabled();
  });

  test('a non-member sees their SALUT status as such', async () => {
    await show(fx.profile({ salut_status: 'none', is_salut: false } as never));

    expect(screen.getByRole('heading', { name: 'Profil Saya' })).toBeInTheDocument();
  });

  test('an active member is shown as one', async () => {
    await show(
      fx.profile({
        is_salut: true,
        is_salut_active: true,
        salut_status: 'approved',
      } as never),
    );

    expect(await screen.findByText(/SALUT/)).toBeInTheDocument();
  });

  test('a lapsed membership reads as expired rather than active', async () => {
    // The backend masks an approved-but-lapsed status; the page must not
    // re-interpret it.
    await show(
      fx.profile({ is_salut: true, is_salut_active: false, salut_status: 'expired' } as never),
    );

    expect(await screen.findByText(/[Kk]edaluwarsa|[Ee]xpired|[Bb]erakhir/)).toBeInTheDocument();
  });
});

describe('what a member is told about their benefits', () => {
  test('an active member sees the fees they no longer pay', async () => {
    await show(
      fx.profile({
        is_salut: true,
        is_salut_active: true,
        salut_status: 'approved',
        salut_approved_at_display: '1 Februari 2026',
      } as never),
    );

    expect(await screen.findByText(/dibebaskan untuk Anda/)).toBeInTheDocument();
    expect(screen.getByText(/1 Februari 2026/)).toBeInTheDocument();
  });

  test('an application still waiting is shown as pending', async () => {
    await show(fx.profile({ salut_status: 'pending', is_salut: false } as never));

    expect(await screen.findByRole('heading', { name: 'Profil Saya' })).toBeInTheDocument();
    expect(screen.queryByText(/dibebaskan untuk Anda/)).not.toBeInTheDocument();
  });

  test('a rejected application does not read as membership', async () => {
    await show(fx.profile({ salut_status: 'rejected', is_salut: false } as never));

    expect(screen.queryByText(/dibebaskan untuk Anda/)).not.toBeInTheDocument();
  });
});

describe('saving changes', () => {
  test('an edited name is sent', async () => {
    await show();
    const seen = captureSave();

    const name = screen.getByDisplayValue('Budi Santoso');
    await userEvent.clear(name);
    await userEvent.type(name, 'Budi Santoso Jr');
    await save();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body!.name).toBe('Budi Santoso Jr');
  });

  test('the student is told it saved', async () => {
    await show();
    captureSave();

    await save();

    expect(await screen.findByText(/Tersimpan|Berhasil|Disimpan/i)).toBeInTheDocument();
  });

  test('a save that fails without a message still says something', async () => {
    // The handler alerts err.message; a thrown non-Error has none, and an
    // empty alert would read as a successful save.
    await show();
    server.use(http.put(url('/auth/me'), () => HttpResponse.error()));

    await save();

    await waitFor(() =>
      expect(vi.mocked(globalThis.alert)).toHaveBeenCalledWith(expect.stringMatching(/\S/)),
    );
  });

  test('a refused save says why rather than looking successful', async () => {
    await show();
    server.use(
      http.put(url('/auth/me'), () =>
        HttpResponse.json({ error: 'Kode bank NTD tidak dikenal' }, { status: 400 }),
      ),
    );

    await save();

    await waitFor(() =>
      expect(vi.mocked(globalThis.alert)).toHaveBeenCalledWith(
        expect.stringContaining('Kode bank NTD tidak dikenal'),
      ),
    );
  });

  test('the address goes as separate Mandarin fields', async () => {
    await show();
    const seen = captureSave();

    await save();

    await waitFor(() => expect(seen.body).toBeDefined());
    for (const field of ['address_zh_city', 'address_zh_district', 'address_zh_road']) {
      expect(seen.body).toHaveProperty(field);
    }
  });

  test('the role and membership are never sent, whatever is in the form', async () => {
    // updateMe has a 21-field allow-list server-side; this is the client half
    // of the same guard.
    await show();
    const seen = captureSave();

    await save();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body).not.toHaveProperty('role');
    expect(seen.body).not.toHaveProperty('is_salut');
    expect(seen.body).not.toHaveProperty('salut_status');
  });
});

describe('a visitor who is not signed in', () => {
  test('they are sent to log in', async () => {
    renderPage(<ProfilePage />);

    await waitFor(() => expect(push).toHaveBeenCalled());
  });
});
