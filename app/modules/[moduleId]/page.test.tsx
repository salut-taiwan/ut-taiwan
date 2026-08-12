import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import ModuleDetailPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { setParams } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

async function show(module: unknown = fx.moduleSummary(), { as }: { as?: 'student' } = { as: 'student' }) {
  setParams({ moduleId: 'm-1' });
  server.use(
    http.get(url('/modules/:id'), () =>
      module === null
        ? HttpResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
        : HttpResponse.json(module as never),
    ),
  );
  renderPage(<ModuleDetailPage />, as ? { as } : {});
}

describe('a module page', () => {
  test('it shows the module and its price', async () => {
    await show();

    expect(await screen.findByRole('heading', { name: 'Bahasa Inggris I' })).toBeInTheDocument();
    expect(screen.getAllByText(/NT\$1,700/).length).toBeGreaterThan(0);
  });

  test('a module that does not exist says so', async () => {
    await show(null);

    expect(await screen.findByText('Modul tidak ditemukan')).toBeInTheDocument();
  });

  test('a purchasable module can be added to the cart', async () => {
    await show();
    let added = false;
    server.use(
      http.post(url('/cart/items'), () => {
        added = true;
        return HttpResponse.json(fx.cart());
      }),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Tambah ke Keranjang' }));

    await waitFor(() => expect(added).toBe(true));
    expect(await screen.findByText('Ditambahkan ke Keranjang!')).toBeInTheDocument();
  });

  test('an unpriced module is added as a request instead', async () => {
    // It cannot be bought until an admin prices it, and calling that "add to
    // cart" would imply it can.
    await show(fx.moduleSummary({ price_student: null, price_student_display: null } as never));

    expect(
      await screen.findByRole('button', { name: 'Tambahkan sebagai Permintaan' }),
    ).toBeInTheDocument();
  });

  test('a failed add says why rather than claiming success', async () => {
    await show();
    server.use(
      http.post(url('/cart/items'), () =>
        HttpResponse.json({ error: 'Modul sudah ada di keranjang' }, { status: 409 }),
      ),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Tambah ke Keranjang' }));

    expect(await screen.findByText(/sudah ada di keranjang/)).toBeInTheDocument();
  });
});
