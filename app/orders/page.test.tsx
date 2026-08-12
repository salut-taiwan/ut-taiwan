import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import OrdersPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { OrderDTO } from '@/types';

async function show(orders: OrderDTO[] = [fx.order()]) {
  server.use(http.get(url('/orders'), () => HttpResponse.json(orders)));
  renderPage(<OrdersPage />, { as: 'student' });
  await screen.findByRole('heading');
}

describe('the order list', () => {
  test('each order shows its number, status and total', async () => {
    await show();

    expect(screen.getByText('UT-2026-0001')).toBeInTheDocument();
    expect(screen.getAllByText('Menunggu Pembayaran').length).toBeGreaterThan(0);
    expect(screen.getByText('NT$2,000')).toBeInTheDocument();
  });

  test('an order links through to its detail page', async () => {
    await show();

    expect(screen.getByRole('link', { name: /UT-2026-0001/ })).toHaveAttribute(
      'href',
      '/orders/o-1',
    );
  });

  test('several orders are all listed', async () => {
    await show([
      fx.order({ id: 'o-1', order_number: 'UT-2026-0001' }),
      fx.order({ id: 'o-2', order_number: 'UT-2026-0002' }),
    ]);

    expect(screen.getByText('UT-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('UT-2026-0002')).toBeInTheDocument();
  });

  test('a student with no orders is pointed at the catalogue', async () => {
    await show([]);

    expect(screen.getByRole('heading', { name: 'Belum ada pesanan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Program Studi|Mulai|Pilih/i })).toHaveAttribute(
      'href',
      '/program',
    );
  });
});

describe('when the list cannot be loaded', () => {
  test('the student is told, rather than shown an empty list', async () => {
    // An empty list would read as "you have no orders", which is a different
    // and alarming thing.
    server.use(http.get(url('/orders'), () => HttpResponse.error()));
    renderPage(<OrdersPage />, { as: 'student' });

    expect(await screen.findByText(/Gagal memuat pesanan/)).toBeInTheDocument();
  });

  test('and can try again', async () => {
    let attempts = 0;
    server.use(
      http.get(url('/orders'), () => {
        attempts += 1;
        return attempts === 1 ? HttpResponse.error() : HttpResponse.json([fx.order()]);
      }),
    );
    renderPage(<OrdersPage />, { as: 'student' });
    await screen.findByText(/Gagal memuat pesanan/);

    await userEvent.click(screen.getByRole('button', { name: 'Muat Ulang' }));

    expect(await screen.findByText('UT-2026-0001')).toBeInTheDocument();
  });
});

describe('a visitor who is not signed in', () => {
  test('they are sent to log in and back here afterwards', async () => {
    renderPage(<OrdersPage />);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/login?redirect=/orders'));
  });
});
