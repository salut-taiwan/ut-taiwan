import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import AdminPackagesPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { renderPage, screen } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

const pkg = (over = {}) => ({
  id: 'pk-1',
  name: 'Paket Semester 1',
  semester: 1,
  is_active: true,
  programs: { code: 'S1SI', name: 'Sistem Informasi' },
  moduleCount: 6,
  ...over,
});

async function show(rows: unknown[] = [pkg()]) {
  server.use(
    signedInAs(fx.adminProfile()),
    http.get(url('/packages'), () =>
      HttpResponse.json({ rows, total: rows.length, limit: 200, offset: 0 }),
    ),
  );
  renderPage(<AdminPackagesPage />, { as: 'admin' });
  await screen.findByRole('heading', { name: 'Manajemen Paket' });
}

describe('managing module packages', () => {
  test('the packages are listed', async () => {
    await show();

    expect(await screen.findByText('Paket Semester 1')).toBeInTheDocument();
  });

  test('rebuilding the module links reports what it linked', async () => {
    await show();
    server.use(
      http.post(url('/packages/sync'), () => HttpResponse.json({ linked: 42, packages: 7 })),
    );

    await userEvent.click(screen.getByRole('button', { name: /Sync|Sinkron/i }));

    expect(await screen.findByText(/42|7/)).toBeInTheDocument();
  });

  test('a failed rebuild says so rather than looking successful', async () => {
    // It deletes every link before rebuilding, so a silent failure would leave
    // packages empty.
    await show();
    server.use(
      http.post(url('/packages/sync'), () =>
        HttpResponse.json({ error: 'Gagal sinkronisasi' }, { status: 500 }),
      ),
    );

    await userEvent.click(screen.getByRole('button', { name: /Sync|Sinkron/i }));

    expect(await screen.findByText(/Gagal/)).toBeInTheDocument();
  });

  test('an empty catalogue does not break the page', async () => {
    await show([]);

    expect(screen.getByRole('heading', { name: 'Manajemen Paket' })).toBeInTheDocument();
  });
});
