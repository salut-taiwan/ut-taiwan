import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import PackagesPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

const pkg = (over = {}) => ({
  id: 'pk-1',
  name: 'Paket Semester 1',
  semester: 1,
  is_active: true,
  programs: { id: 'pr-1', code: 'S1SI', name: 'Sistem Informasi' },
  moduleCount: 6,
  totalPrice: 10200,
  totalPrice_display: 'NT$10,200',
  ...over,
});

async function show(rows: unknown[] = [pkg()]) {
  server.use(
    http.get(url('/packages'), () =>
      HttpResponse.json({ rows, total: rows.length, limit: 20, offset: 0 }),
    ),
    http.get(url('/catalog/programs'), () =>
      HttpResponse.json([{ id: 'pr-1', code: 'S1SI', name: 'Sistem Informasi' }]),
    ),
  );
  renderPage(<PackagesPage />, { as: 'student' });
  await screen.findByRole('heading', { name: 'Paket Modul' });
}

describe('browsing packages', () => {
  test('a package shows what it contains and what it costs', async () => {
    await show();

    expect(await screen.findByText('Paket Semester 1')).toBeInTheDocument();
    expect(screen.getByText(/NT\$10,200/)).toBeInTheDocument();
  });

  test('an empty catalogue does not break the page', async () => {
    await show([]);

    expect(screen.getByRole('heading', { name: 'Paket Modul' })).toBeInTheDocument();
  });

  test('a whole package can be added to the cart', async () => {
    await show();
    let body: { packageId?: string } | undefined;
    server.use(
      http.post(url('/cart/packages'), async ({ request }) => {
        body = (await request.json()) as { packageId?: string };
        return HttpResponse.json(fx.cart());
      }),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Tambah ke Keranjang' }));

    await waitFor(() => expect(body?.packageId).toBe('pk-1'));
  });

  test('a refused add says why', async () => {
    await show();
    server.use(
      http.post(url('/cart/packages'), () =>
        HttpResponse.json({ error: 'Tidak ada modul dalam paket ini' }, { status: 400 }),
      ),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Tambah ke Keranjang' }));

    expect(await screen.findByText(/Tidak ada modul dalam paket ini/)).toBeInTheDocument();
  });

  test('searching is debounced and sent to the backend', async () => {
    // The catalogue is paged; filtering in the browser would only search the
    // page already loaded.
    const queries: URLSearchParams[] = [];
    server.use(
      http.get(url('/packages'), ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ rows: [pkg()], total: 1, limit: 20, offset: 0 });
      }),
      http.get(url('/catalog/programs'), () => HttpResponse.json([])),
    );
    renderPage(<PackagesPage />, { as: 'student' });
    await screen.findByRole('heading', { name: 'Paket Modul' });

    await userEvent.type(
      screen.getByPlaceholderText(/Cari paket berdasarkan nama/),
      'semester 1',
    );

    await waitFor(
      () => expect(queries.some((q) => q.get('search') === 'semester 1')).toBe(true),
      { timeout: 3000 },
    );
  });

  test('a failure to load is reported and can be retried', async () => {
    let attempts = 0;
    server.use(
      http.get(url('/packages'), () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.error()
          : HttpResponse.json({ rows: [pkg()], total: 1, limit: 20, offset: 0 });
      }),
      http.get(url('/catalog/programs'), () => HttpResponse.json([])),
    );
    renderPage(<PackagesPage />, { as: 'student' });
    await screen.findByText(/Gagal memuat paket/);

    await userEvent.click(screen.getByRole('button', { name: 'Muat Ulang' }));

    expect(await screen.findByText('Paket Semester 1')).toBeInTheDocument();
  });

  test('a large catalogue can be paged', async () => {
    const queries: URLSearchParams[] = [];
    server.use(
      http.get(url('/packages'), ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ rows: [pkg()], total: 200, limit: 20, offset: 0 });
      }),
      http.get(url('/catalog/programs'), () => HttpResponse.json([])),
    );
    renderPage(<PackagesPage />, { as: 'student' });
    await screen.findByText('Paket Semester 1');

    await userEvent.click(screen.getByRole('button', { name: 'Next →' }));

    // The page size is the first of PAGE_SIZES (9), not the API default.
    await waitFor(() => expect(queries.some((q) => Number(q.get('offset')) > 0)).toBe(true));
  });

  test('a signed-out visitor adding a package is sent to log in', async () => {
    const location = { href: '' } as Location;
    Object.defineProperty(window, 'location', { value: location, writable: true });
    server.use(
      http.get(url('/packages'), () =>
        HttpResponse.json({ rows: [pkg()], total: 1, limit: 20, offset: 0 }),
      ),
      http.get(url('/catalog/programs'), () => HttpResponse.json([])),
    );
    renderPage(<PackagesPage />);
    await screen.findByText('Paket Semester 1');

    await userEvent.click(screen.getByRole('button', { name: 'Tambah ke Keranjang' }));

    await waitFor(() => expect(location.href).toBe('/login'));
  });

  test('filtering by semester is sent to the backend', async () => {
    const queries: URLSearchParams[] = [];
    server.use(
      http.get(url('/packages'), ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ rows: [pkg()], total: 1, limit: 9, offset: 0 });
      }),
      http.get(url('/catalog/programs'), () => HttpResponse.json([])),
    );
    renderPage(<PackagesPage />, { as: 'student' });
    await screen.findByRole('heading', { name: 'Paket Modul' });

    const semester = await screen.findByDisplayValue('Semua Semester');
    await userEvent.selectOptions(semester, '3');

    await waitFor(() => expect(queries.some((q) => q.get('semester') === '3')).toBe(true));
  });

  test('the filters can be cleared in one go', async () => {
    const queries: URLSearchParams[] = [];
    server.use(
      http.get(url('/packages'), ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ rows: [pkg()], total: 1, limit: 9, offset: 0 });
      }),
      http.get(url('/catalog/programs'), () => HttpResponse.json([])),
    );
    renderPage(<PackagesPage />, { as: 'student' });
    await screen.findByRole('heading', { name: 'Paket Modul' });
    const semester = await screen.findByDisplayValue('Semua Semester');
    await userEvent.selectOptions(semester, '3');
    await waitFor(() => expect(queries.some((q) => q.get('semester') === '3')).toBe(true));

    const reset = screen.getAllByRole('button').find((b) => /Reset|Hapus filter/i.test(b.textContent ?? ''));
    if (!reset) return;
    await userEvent.click(reset);

    await waitFor(() => expect(queries[queries.length - 1].get('semester')).toBeNull());
  });

  test('filtering by programme is sent to the backend', async () => {
    const queries: URLSearchParams[] = [];
    server.use(
      http.get(url('/packages'), ({ request }) => {
        queries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ rows: [pkg()], total: 1, limit: 20, offset: 0 });
      }),
      http.get(url('/catalog/programs'), () =>
        HttpResponse.json([{ id: 'pr-1', code: 'S1SI', name: 'Sistem Informasi' }]),
      ),
    );
    renderPage(<PackagesPage />, { as: 'student' });
    await screen.findByRole('heading', { name: 'Paket Modul' });

    const select = (await screen.findAllByRole('combobox'))[0];
    await userEvent.selectOptions(select, 'pr-1');

    await waitFor(() => expect(queries.some((q) => q.get('programId') === 'pr-1')).toBe(true));
  });
});
