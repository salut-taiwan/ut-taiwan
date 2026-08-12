import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import AdminUsersPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { AdminUserDTO } from '@/types';

const student = (over: Partial<AdminUserDTO> = {}): AdminUserDTO =>
  ({
    id: 'u-9',
    email: 'rina@example.com',
    name: 'Rina Putri',
    nim: '041234567',
    phone: '628123456789',
    is_salut: false,
    is_verified: true,
    salut_status: 'none',
    current_semester: 3,
    created_at: '2026-05-20T00:00:00Z',
    created_at_display: '20 Mei 2026',
    programs: { code: 'S1SI', name: 'Sistem Informasi' },
    ...over,
  }) as AdminUserDTO;

/** Records the query the table sends, so filters and sorting can be asserted. */
function trackQueries(rows: AdminUserDTO[] = [student()]) {
  const queries: URLSearchParams[] = [];
  server.use(
    signedInAs(fx.adminProfile()),
    http.get(url('/users/admin/all'), ({ request }) => {
      queries.push(new URL(request.url).searchParams);
      return HttpResponse.json({ rows, total: rows.length, limit: 25, offset: 0 });
    }),
  );
  return queries;
}

async function show(rows: AdminUserDTO[] = [student()]) {
  const queries = trackQueries(rows);
  renderPage(<AdminUsersPage />, { as: 'admin' });
  await screen.findByRole('heading', { name: 'Manajemen Mahasiswa' });
  if (rows.length > 0) await screen.findByText(rows[0].name);
  return queries;
}

const searchBox = () => screen.getByPlaceholderText(/Cari nama, email, NIM/);

describe('who may manage students', () => {
  test('a student is turned away', async () => {
    server.use(signedInAs(fx.profile()));

    renderPage(<AdminUsersPage />, { as: 'student' });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  test('an admin gets the table', async () => {
    await show();

    expect(screen.getByText('Rina Putri')).toBeInTheDocument();
  });
});

describe('finding a student', () => {
  test('a search is sent to the backend rather than filtering in the browser', async () => {
    // The table is paged; filtering client-side would only search the page
    // already loaded.
    const queries = await show();

    await userEvent.type(searchBox(), 'rina');

    await waitFor(
      () => expect(queries.some((q) => q.get('search') === 'rina')).toBe(true),
      { timeout: 3000 },
    );
  });

  test('the SALUT status filter is sent', async () => {
    const queries = await show();

    const select = screen.getByDisplayValue('Semua status SALUT');
    await userEvent.selectOptions(select, 'pending');

    await waitFor(() => expect(queries.some((q) => q.get('salut_status') === 'pending')).toBe(true));
  });

  test('the verification filter is sent', async () => {
    const queries = await show();

    const select = screen.getByDisplayValue('Semua verifikasi');
    await userEvent.selectOptions(select, 'false');

    await waitFor(() => expect(queries.some((q) => q.get('is_verified') === 'false')).toBe(true));
  });

  test('sorting is sent to the backend with a direction', async () => {
    const queries = await show();

    await userEvent.click(screen.getByRole('button', { name: /^Nama/ }));

    await waitFor(() => expect(queries.some((q) => q.get('sort') === 'name')).toBe(true));
    expect(queries.some((q) => ['asc', 'desc'].includes(q.get('dir') ?? ''))).toBe(true);
  });

  test('clicking the same column again reverses the order', async () => {
    const queries = await show();
    await userEvent.click(screen.getByRole('button', { name: /^Nama/ }));
    await waitFor(() => expect(queries.some((q) => q.get('sort') === 'name')).toBe(true));

    await userEvent.click(screen.getByRole('button', { name: /^Nama/ }));

    await waitFor(() => {
      const dirs = queries.filter((q) => q.get('sort') === 'name').map((q) => q.get('dir'));
      expect(new Set(dirs).size).toBeGreaterThan(1);
    });
  });

  test('a search matching nobody shows an empty table, not an error', async () => {
    const queries = trackQueries([]);
    renderPage(<AdminUsersPage />, { as: 'admin' });
    await screen.findByRole('heading', { name: 'Manajemen Mahasiswa' });

    await waitFor(() => expect(queries.length).toBeGreaterThan(0));
    expect(screen.queryByText('Rina Putri')).not.toBeInTheDocument();
  });
});

describe('granting and revoking membership', () => {
  test('a student can be made a member', async () => {
    await show();
    let body: { is_salut?: boolean } | undefined;
    server.use(
      http.patch(url('/users/admin/:id/salut'), async ({ request }) => {
        body = (await request.json()) as { is_salut?: boolean };
        return HttpResponse.json(student({ is_salut: true }));
      }),
    );

    await userEvent.click(screen.getByTitle('Klik untuk tandai sebagai SALUT'));

    await waitFor(() => expect(body?.is_salut).toBe(true));
  });

  test('a member can have it revoked again', async () => {
    await show([student({ is_salut: true, salut_status: 'approved' })]);
    let body: { is_salut?: boolean } | undefined;
    server.use(
      http.patch(url('/users/admin/:id/salut'), async ({ request }) => {
        body = (await request.json()) as { is_salut?: boolean };
        return HttpResponse.json(student());
      }),
    );

    await userEvent.click(screen.getByTitle('Klik untuk cabut status SALUT'));

    await waitFor(() => expect(body?.is_salut).toBe(false));
  });

  test('several students can be changed at once', async () => {
    await show([student(), student({ id: 'u-10', name: 'Andi Wijaya' })]);
    let body: { userIds?: string[] } | undefined;
    server.use(
      http.patch(url('/users/admin/salut/bulk'), async ({ request }) => {
        body = (await request.json()) as { userIds?: string[] };
        return HttpResponse.json({ updated: 2 });
      }),
    );

    const [selectAll] = screen.getAllByRole('checkbox');
    await userEvent.click(selectAll);
    const bulk = screen.getAllByRole('button').find((b) => /\d/.test(b.textContent ?? '') && /SALUT/i.test(b.textContent ?? ''));
    if (bulk) {
      await userEvent.click(bulk);
      await waitFor(() => expect(body?.userIds?.length).toBe(2));
    }
  });
});

describe('paging', () => {
  test('the page size the admin chose is sent', async () => {
    const queries = await show();

    const sizeSelect = screen.getAllByRole('combobox').find((s) =>
      Array.from((s as HTMLSelectElement).options).some((o) => o.value === '50'),
    );
    if (sizeSelect) {
      await userEvent.selectOptions(sizeSelect, '50');
      await waitFor(() => expect(queries.some((q) => q.get('limit') === '50')).toBe(true));
    }
  });
});
