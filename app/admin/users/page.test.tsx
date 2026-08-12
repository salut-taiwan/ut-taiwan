import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import AdminUsersPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { within } from '@testing-library/react';
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
    // The programme filter is populated from the catalogue.
    http.get(url('/catalog/programs'), () =>
      HttpResponse.json([{ id: 'pr-1', code: 'S1SI', name: 'Sistem Informasi' }]),
    ),
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

  test('a refused change is reported rather than looking applied', async () => {
    await show();
    server.use(
      http.patch(url('/users/admin/:id/salut'), () =>
        HttpResponse.json({ error: 'Mahasiswa belum terverifikasi' }, { status: 400 }),
      ),
    );

    await userEvent.click(screen.getByTitle('Klik untuk tandai sebagai SALUT'));

    await waitFor(() =>
      expect(vi.mocked(globalThis.alert)).toHaveBeenCalledWith(
        expect.stringContaining('belum terverifikasi'),
      ),
    );
  });
});

describe('working on several students at once', () => {
  const two = () => [student(), student({ id: 'u-10', name: 'Andi Wijaya' })];

  test('nothing is offered until rows are selected', async () => {
    await show(two());

    expect(screen.queryByRole('button', { name: 'Tandai SALUT' })).not.toBeInTheDocument();
  });

  test('selecting all selects every row on the page', async () => {
    await show(two());

    const [selectAll] = screen.getAllByRole('checkbox');
    await userEvent.click(selectAll);

    expect(screen.getByText(/2 mahasiswa dipilih/)).toBeInTheDocument();
  });

  test('selecting all again clears the selection', async () => {
    await show(two());
    const [selectAll] = screen.getAllByRole('checkbox');
    await userEvent.click(selectAll);

    await userEvent.click(selectAll);

    expect(screen.queryByText(/mahasiswa dipilih/)).not.toBeInTheDocument();
  });

  test('a single row can be picked out on its own', async () => {
    await show(two());

    const [, firstRow] = screen.getAllByRole('checkbox');
    await userEvent.click(firstRow);

    expect(screen.getByText(/1 mahasiswa dipilih/)).toBeInTheDocument();
  });

  test('clicking a selected row again deselects it', async () => {
    await show(two());
    const [, firstRow] = screen.getAllByRole('checkbox');
    await userEvent.click(firstRow);

    await userEvent.click(firstRow);

    expect(screen.queryByText(/mahasiswa dipilih/)).not.toBeInTheDocument();
  });

  test('the whole selection is granted membership in one request', async () => {
    // One request, not one per student — the backend caps the batch and this
    // is the only place that contract is exercised.
    await show(two());
    let body: { userIds?: string[]; is_salut?: boolean } | undefined;
    server.use(
      http.patch(url('/users/admin/salut/bulk'), async ({ request }) => {
        body = (await request.json()) as { userIds?: string[]; is_salut?: boolean };
        return HttpResponse.json({ updated: 2 });
      }),
    );

    const [selectAll] = screen.getAllByRole('checkbox');
    await userEvent.click(selectAll);
    await userEvent.click(screen.getByRole('button', { name: 'Tandai SALUT' }));

    await waitFor(() => expect(body?.userIds?.sort()).toEqual(['u-10', 'u-9']));
    expect(body?.is_salut).toBe(true);
  });

  test('the selection can be revoked in bulk too', async () => {
    await show(two());
    let body: { is_salut?: boolean } | undefined;
    server.use(
      http.patch(url('/users/admin/salut/bulk'), async ({ request }) => {
        body = (await request.json()) as { is_salut?: boolean };
        return HttpResponse.json({ updated: 2 });
      }),
    );

    const [selectAll] = screen.getAllByRole('checkbox');
    await userEvent.click(selectAll);
    await userEvent.click(screen.getByRole('button', { name: 'Cabut SALUT' }));

    await waitFor(() => expect(body?.is_salut).toBe(false));
  });

  test('a failed bulk change is reported', async () => {
    await show(two());
    server.use(
      http.patch(url('/users/admin/salut/bulk'), () =>
        HttpResponse.json({ error: 'Maksimal 200 mahasiswa' }, { status: 400 }),
      ),
    );

    const [selectAll] = screen.getAllByRole('checkbox');
    await userEvent.click(selectAll);
    await userEvent.click(screen.getByRole('button', { name: 'Tandai SALUT' }));

    await waitFor(() =>
      expect(vi.mocked(globalThis.alert)).toHaveBeenCalledWith(
        expect.stringContaining('Maksimal 200'),
      ),
    );
  });
});

describe('narrowing and resetting', () => {
  test('the programme filter is sent', async () => {
    const queries = await show();

    const select = await screen.findByDisplayValue('Semua program');
    await waitFor(() =>
      expect(within(select as HTMLSelectElement).getByRole('option', { name: /Sistem Informasi/ })).toBeInTheDocument(),
    );
    await userEvent.selectOptions(select, 'pr-1');

    await waitFor(() => expect(queries.some((q) => q.get('program_id') === 'pr-1')).toBe(true));
  });

  test('the semester filter is sent', async () => {
    const queries = await show();

    const select = screen.getByDisplayValue('Semua semester');
    await userEvent.selectOptions(select, '3');

    await waitFor(() => expect(queries.some((q) => q.get('semester') === '3')).toBe(true));
  });

  test('reset is only offered once something is filtered', async () => {
    await show();

    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });

  test('reset clears the search and every filter at once', async () => {
    const queries = await show();
    await userEvent.type(searchBox(), 'rina');
    await waitFor(
      () => expect(queries.some((q) => q.get('search') === 'rina')).toBe(true),
      { timeout: 3000 },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));

    await waitFor(
      () => {
        const last = queries[queries.length - 1];
        expect(last.get('search')).toBeNull();
        expect(last.get('salut_status')).toBeNull();
      },
      { timeout: 3000 },
    );
  });
});

describe('paging', () => {
  test('the page size the admin chose is sent', async () => {
    const queries = await show();

    const sizeSelect = screen.getAllByRole('combobox').find((s) =>
      Array.from((s as HTMLSelectElement).options).some((o) => o.value === '50'),
    );
    if (!sizeSelect) throw new Error('no page-size select');
    await userEvent.selectOptions(sizeSelect, '50');

    await waitFor(() => expect(queries.some((q) => q.get('limit') === '50')).toBe(true));
  });

  test('moving to the next page shifts the offset', async () => {
    const queries = trackQueries([student()]);
    server.use(
      http.get(url('/users/admin/all'), ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ rows: [student()], total: 200, limit: 25, offset: 0 });
      }),
    );
    renderPage(<AdminUsersPage />, { as: 'admin' });
    await screen.findByText('Rina Putri');

    await userEvent.click(screen.getByRole('button', { name: 'Next →' }));

    await waitFor(() => expect(queries.some((q) => q.get('offset') === '25')).toBe(true));
  });
});
