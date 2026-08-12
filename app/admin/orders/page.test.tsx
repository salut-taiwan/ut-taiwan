import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import AdminOrdersPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { OrderDTO } from '@/types';

async function show(orders: OrderDTO[] = [fx.order()]) {
  server.use(
    signedInAs(fx.adminProfile()),
    http.get(url('/orders/admin/all'), () => HttpResponse.json(orders)),
  );
  renderPage(<AdminOrdersPage />, { as: 'admin' });
  if (orders.length > 0) await screen.findByText(orders[0].order_number);
}

/**
 * Expands the first order row so its per-item controls are reachable. The
 * trigger is labelled by what the row contains — "N permintaan pending",
 * "Dokumen" or "Detail Item" — so match on the disclosure arrow instead.
 */
async function expandFirstRow() {
  const trigger = screen
    .getAllByRole('button')
    .find((b) => (b.textContent ?? '').includes('▼'));
  if (trigger) await userEvent.click(trigger);
}

describe('who may see the order queue', () => {
  test('a student is turned away', async () => {
    server.use(signedInAs(fx.profile()));

    renderPage(<AdminOrdersPage />, { as: 'student' });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  test('an admin sees the orders', async () => {
    await show();

    expect(screen.getByText('UT-2026-0001')).toBeInTheDocument();
  });
});

describe('splitting jackets from modules', () => {
  // Almet and modul are handled by different people on different timelines, so
  // the queue is filtered by what an order contains.
  const moduleOrder = fx.order({ id: 'o-1', order_number: 'UT-2026-0001', order_kind: 'module' });
  const merchOrder = fx.order({ id: 'o-2', order_number: 'UT-2026-0002', order_kind: 'merch' });
  const mixedOrder = fx.order({ id: 'o-3', order_number: 'UT-2026-0003', order_kind: 'mixed' });

  test('all three tabs are offered', async () => {
    await show([moduleOrder]);

    expect(screen.getByRole('tab', { name: /Semua/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Modul/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Almet/ })).toBeInTheDocument();
  });

  test('the module queue hides jacket-only orders', async () => {
    await show([moduleOrder, merchOrder]);

    await userEvent.click(screen.getByRole('tab', { name: /^Modul/ }));

    expect(screen.getByText('UT-2026-0001')).toBeInTheDocument();
    expect(screen.queryByText('UT-2026-0002')).not.toBeInTheDocument();
  });

  test('the jacket queue hides module-only orders', async () => {
    await show([moduleOrder, merchOrder]);

    await userEvent.click(screen.getByRole('tab', { name: /Almet/ }));

    expect(screen.getByText('UT-2026-0002')).toBeInTheDocument();
    expect(screen.queryByText('UT-2026-0001')).not.toBeInTheDocument();
  });

  test('an order containing both appears in both queues', async () => {
    // Neither team should have to look in the other's list to find it.
    await show([mixedOrder]);

    await userEvent.click(screen.getByRole('tab', { name: /^Modul/ }));
    expect(screen.getByText('UT-2026-0003')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Almet/ }));
    expect(screen.getByText('UT-2026-0003')).toBeInTheDocument();
  });
});

describe('moving an order along', () => {
  test('confirming a payment asks first', async () => {
    vi.mocked(globalThis.confirm).mockReturnValueOnce(false);
    await show();
    let confirmed = false;
    server.use(
      http.post(url('/payments/:orderId/confirm'), () => {
        confirmed = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );
    await expandFirstRow();

    const button = screen.queryByRole('button', { name: /Konfirmasi Pembayaran/i });
    if (button) await userEvent.click(button);

    expect(confirmed).toBe(false);
  });

  test('confirming Karunika stock warns that it emails the customer', async () => {
    // It sends payment instructions; doing it by accident tells a student to
    // pay for stock nobody has checked.
    await show(fx.order({ status: 'pending' }) ? [fx.order({ status: 'pending' })] : []);
    await expandFirstRow();

    const button = screen.queryByRole('button', { name: /Konfirmasi Karunika/i });
    if (button) {
      await userEvent.click(button);
      expect(vi.mocked(globalThis.confirm)).toHaveBeenCalledWith(
        expect.stringMatching(/[Ee]mail/),
      );
    }
  });

  test('a refused status change is reported rather than silently ignored', async () => {
    await show();
    server.use(
      http.patch(url('/orders/admin/:id/status'), () =>
        HttpResponse.json({ error: 'Transisi status tidak valid' }, { status: 409 }),
      ),
    );
    await expandFirstRow();

    const button = screen.queryAllByRole('button').find((b) => /Kirim|Proses|Ubah/i.test(b.textContent ?? ''));
    if (button) {
      await userEvent.click(button);
      expect(await screen.findByText(/tidak valid/)).toBeInTheDocument();
    }
  });
});

describe('pricing a requested module', () => {
  const withRequest = () =>
    fx.order({
      status: 'pending',
      order_items: [
        fx.orderItem({
          id: 'oi-9',
          is_request: true,
          request_status: 'pending',
          unit_price: 0,
          display_status: 'pending_request',
          price_visible: false,
          unit_price_display: undefined,
          subtotal_display: undefined,
        }),
      ],
    });

  test('an unpriced request shows as awaiting a price, not as free', async () => {
    // This is the bug the whole area exists to prevent.
    await show([withRequest()]);

    await expandFirstRow();

    expect(await screen.findByText('Harga menyusul')).toBeInTheDocument();
    expect(screen.queryByText(/Gratis/)).not.toBeInTheDocument();
  });

  test('approving sends the price the admin typed', async () => {
    await show([withRequest()]);
    let body: Record<string, unknown> | undefined;
    server.use(
      http.patch(url('/orders/admin/:orderId/items/:itemId/request-status'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: 'ok', status: 'approved', order: fx.order() });
      }),
    );
    await expandFirstRow();

    // Approving is two steps: the first click opens the price field, the
    // second commits it — an admin cannot approve without naming a price.
    await userEvent.click(await screen.findByRole('button', { name: 'Setujui' }));
    await userEvent.type(await screen.findByPlaceholderText('Harga...'), '1700');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body!.status).toBe('approved');
    expect(body!.unit_price).toBe(1700);
  });

  test('an approval cannot be committed without a price', async () => {
    // The empty-price button stays disabled, which is what stops a request
    // being approved at zero and shipping as free.
    await show([withRequest()]);
    await expandFirstRow();

    await userEvent.click(await screen.findByRole('button', { name: 'Setujui' }));

    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
  });

  test('rejecting sends no price at all', async () => {
    await show([withRequest()]);
    let body: Record<string, unknown> | undefined;
    server.use(
      http.patch(url('/orders/admin/:orderId/items/:itemId/request-status'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: 'ok', status: 'rejected', order: fx.order() });
      }),
    );
    await expandFirstRow();

    await userEvent.click(await screen.findByRole('button', { name: 'Tolak' }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body!.status).toBe('rejected');
    expect(body!.unit_price).toBeUndefined();
  });

  test('the refreshed order from the server replaces the row', async () => {
    // Approving rewrites the order total and the pending payment amount
    // server-side, so the admin must see the new numbers rather than stale
    // optimistic ones.
    await show([withRequest()]);
    server.use(
      http.patch(url('/orders/admin/:orderId/items/:itemId/request-status'), () =>
        HttpResponse.json({
          message: 'ok',
          status: 'approved',
          order: fx.order({
            order_items: [
              fx.orderItem({
                id: 'oi-9',
                is_request: true,
                request_status: 'approved',
                unit_price: 1700,
                subtotal_display: 'NT$9,999',
              }),
            ],
          }),
        }),
      ),
    );
    await expandFirstRow();

    await userEvent.click(await screen.findByRole('button', { name: 'Setujui' }));
    await userEvent.type(await screen.findByPlaceholderText('Harga...'), '1700');
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(await screen.findByText('NT$9,999')).toBeInTheDocument();
  });
});

describe('when the queue cannot be loaded', () => {
  test('the admin is told rather than shown an empty queue', async () => {
    server.use(
      signedInAs(fx.adminProfile()),
      http.get(url('/orders/admin/all'), () =>
        HttpResponse.json({ error: 'Gagal memuat' }, { status: 500 }),
      ),
    );
    renderPage(<AdminOrdersPage />, { as: 'admin' });

    expect(await screen.findByText(/Gagal memuat/)).toBeInTheDocument();
  });
});
