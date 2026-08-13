import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import OrderDetailPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { push, setParams, setSearchParams } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { OrderDTO } from '@/types';

async function show(value: OrderDTO | 'missing' = fx.order()) {
  setParams({ orderId: 'o-1' });
  server.use(
    http.get(url('/orders/:id'), () =>
      value === 'missing'
        ? HttpResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
        : HttpResponse.json(value),
    ),
  );
  renderPage(<OrderDetailPage />, { as: 'student' });
  if (value !== 'missing') await screen.findByRole('heading', { name: 'UT-2026-0001' });
}

const awaitingPayment = (over: Partial<OrderDTO> = {}) =>
  fx.order({
    status: 'awaiting_payment',
    payments: [
      fx.payment({
        show_payment_instructions: true,
        bank_name: 'BCA',
        bank_account: '1234567890',
        bank_holder: 'UT Taiwan',
        amount_display: 'NT$2,000',
      }),
    ],
    ...over,
  });

describe('an order that does not exist', () => {
  test('the student is told rather than shown a blank page', async () => {
    await show('missing');

    expect(await screen.findByRole('heading', { name: 'Pesanan tidak ditemukan' })).toBeInTheDocument();
  });
});

describe('what the order says', () => {
  test('its number and status are shown', async () => {
    await show();

    expect(screen.getByRole('heading', { name: 'UT-2026-0001' })).toBeInTheDocument();
    expect(screen.getAllByText('Menunggu Pembayaran').length).toBeGreaterThan(0);
  });

  test('the items are listed with the prices the backend calculated', async () => {
    await show();

    expect(screen.getByText('Bahasa Inggris I')).toBeInTheDocument();
    expect(screen.getAllByText('NT$1,700').length).toBeGreaterThan(0);
  });

  test('the shipping address is shown as the backend composed it', async () => {
    // The page must not reassemble the Mandarin address itself.
    await show();

    // shipping_address_lines, rendered one line at a time — the page never
    // reassembles the Mandarin address itself.
    expect(screen.getByText('No 1, Sec 4, Roosevelt Rd')).toBeInTheDocument();
  });

  test('an item still waiting on a price does not show a number', async () => {
    await show(
      fx.order({
        order_items: [
          fx.orderItem({
            is_request: true,
            request_status: 'pending',
            display_status: 'pending_request',
            price_visible: false,
            unit_price_display: undefined,
            subtotal_display: undefined,
          }),
        ],
      }),
    );

    expect(screen.queryByText('NT$0')).not.toBeInTheDocument();
  });
});

describe('paying for it', () => {
  test('the bank details are shown once the order is ready to pay', async () => {
    await show(awaitingPayment());

    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('UT Taiwan')).toBeInTheDocument();
  });

  test('the exact amount to transfer is shown', async () => {
    // Admins reconcile by exact amount; a rounded transfer cannot be matched.
    await show(awaitingPayment());

    expect(screen.getAllByText('NT$2,000').length).toBeGreaterThan(0);
  });

  test('the unique code is shown when there is one', async () => {
    await show(
      awaitingPayment({
        payments: [
          fx.payment({
            show_payment_instructions: true,
            bank_account: '1234567890',
            unique_code: 137,
            unique_code_display: 'NT$137',
          }),
        ],
      }),
    );

    expect(screen.getAllByText('+NT$137').length).toBeGreaterThan(0);
  });

  test('a free order shows no unique code at all', async () => {
    // A zero-total order gets code 0; showing "+NT$0" would be nonsense.
    await show(
      awaitingPayment({
        payments: [
          fx.payment({
            show_payment_instructions: true,
            bank_account: '1234567890',
            unique_code: 0,
            unique_code_display: 'NT$0',
          }),
        ],
      }),
    );

    expect(screen.queryByText(/Kode unik/)).not.toBeInTheDocument();
  });

  test('the account number can be copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await show(awaitingPayment());

    await userEvent.click(screen.getByTitle('Salin nomor rekening'));

    expect(writeText).toHaveBeenCalledWith('1234567890');
  });

  test('QRIS is offered as well as a transfer', async () => {
    await show(awaitingPayment());

    expect(screen.getByAltText('QRIS UT Taiwan')).toBeInTheDocument();
  });

  test('an order still being stock-checked shows no bank details yet', async () => {
    // Paying before stock is confirmed is what causes the refund requests.
    await show(
      fx.order({
        status: 'pending',
        payments: [fx.payment({ show_payment_instructions: false })],
      }),
    );

    expect(screen.getByText(/Menunggu verifikasi stok/)).toBeInTheDocument();
    expect(screen.queryByText('1234567890')).not.toBeInTheDocument();
  });
});

describe('sending the transfer proof', () => {
  const file = () => new File(['bytes'], 'bukti.jpg', { type: 'image/jpeg' });

  test('a student can upload one', async () => {
    let uploaded = false;
    await show(awaitingPayment());
    server.use(
      http.post(url('/payments/:orderId/proof'), () => {
        uploaded = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file());

    await waitFor(() => expect(uploaded).toBe(true));
  });

  test('a rejected upload says why', async () => {
    await show(awaitingPayment());
    server.use(
      http.post(url('/payments/:orderId/proof'), () =>
        HttpResponse.json({ error: 'File terlalu besar' }, { status: 400 }),
      ),
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file());

    expect(await screen.findByText(/File terlalu besar/)).toBeInTheDocument();
  });

  test('once sent the student is told, and can replace it', async () => {
    await show(
      awaitingPayment({
        payments: [
          fx.payment({
            show_payment_instructions: true,
            bank_account: '1234567890',
            proof_path: 'u/bukti.jpg',
          }),
        ],
      }),
    );

    expect(screen.getByText('Bukti transfer sudah dikirim')).toBeInTheDocument();
    expect(screen.getByText('Ganti')).toBeInTheDocument();
  });

  test('a sent proof can be viewed', async () => {
    await show(
      awaitingPayment({
        payments: [
          fx.payment({ show_payment_instructions: true, bank_account: '1', proof_path: 'u/b.jpg' }),
        ],
      }),
    );
    const open = vi.fn();
    vi.stubGlobal('open', open);

    await userEvent.click(screen.getByRole('button', { name: 'Lihat' }));

    await waitFor(() => expect(open).toHaveBeenCalled());
  });
});

describe('how each stage of an order looks', () => {
  // The status badge, the progress bar and the payment block all branch on
  // state. A student checks this page repeatedly between paying and receiving,
  // so each stage has to render its own way rather than falling through to a
  // default.
  test('a paid order shows when it was paid', async () => {
    await show(
      fx.order({
        status: 'paid',
        status_label: 'Dibayar',
        progress_percent: 60,
        payments: [
          fx.payment({
            status: 'paid',
            paid_at: '2026-05-21T00:00:00Z',
            paid_at_display: '21 Mei 2026',
            payment_status_label: 'Lunas',
          }),
        ],
        steps: [
          { key: 'pending', label: 'Dibuat', state: 'completed' },
          { key: 'paid', label: 'Dibayar', state: 'completed' },
          { key: 'shipped', label: 'Dikirim', state: 'current' },
          { key: 'done', label: 'Selesai', state: 'pending' },
        ],
      }),
    );

    expect(screen.getByText('21 Mei 2026')).toBeInTheDocument();
  });

  test('a payment deadline is shown while one applies', async () => {
    // The order is cancelled automatically after it passes.
    await show(
      fx.order({
        status: 'awaiting_payment',
        payments: [
          fx.payment({
            show_payment_instructions: true,
            show_payment_deadline: true,
            bank_account: '1234567890',
            expires_at: '2026-05-25T00:00:00Z',
            expires_at_display: '25 Mei 2026',
          }),
        ],
      }),
    );

    expect(screen.getByText('25 Mei 2026')).toBeInTheDocument();
  });

  test('an unknown status still renders a badge rather than an empty gap', async () => {
    // The colour map is keyed by status; a status it does not know must fall
    // back rather than render unstyled.
    await show(fx.order({ status: 'refunded' as never, status_label: 'Dikembalikan' }));

    expect(screen.getByText('Dikembalikan')).toBeInTheDocument();
  });

  test('a cancelled order says so and offers nothing', async () => {
    await show(
      fx.order({
        status: 'cancelled',
        status_label: 'Dibatalkan',
        can_cancel: false,
        progress_percent: 0,
        payments: [fx.payment({ status: 'expired', show_payment_instructions: false })],
      }),
    );

    expect(screen.getAllByText('Dibatalkan').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Batalkan Pesanan/i })).not.toBeInTheDocument();
  });
});

describe('cancelling', () => {
  test('a cancellable order offers it', async () => {
    await show(fx.order({ can_cancel: true }));

    expect(screen.getByRole('button', { name: /Batalkan Pesanan/i })).toBeInTheDocument();
  });

  test('an order too far along does not', async () => {
    // Cancelling after Karunika has been paid is not ours to offer.
    await show(fx.order({ status: 'shipped', can_cancel: false }));

    expect(screen.queryByRole('button', { name: /Batalkan Pesanan/i })).not.toBeInTheDocument();
  });

  test('it asks before cancelling', async () => {
    await show(fx.order({ can_cancel: true }));
    let cancelled = false;
    server.use(
      http.post(url('/orders/:id/cancel'), () => {
        cancelled = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: /Batalkan Pesanan/i }));

    expect(screen.getByText('Batalkan pesanan ini?')).toBeInTheDocument();
    expect(cancelled).toBe(false);
  });

  test('confirming cancels it', async () => {
    await show(fx.order({ can_cancel: true }));
    let cancelled = false;
    server.use(
      http.post(url('/orders/:id/cancel'), () => {
        cancelled = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: /Batalkan Pesanan/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Ya, Batalkan' }));

    await waitFor(() => expect(cancelled).toBe(true));
  });

  test('a refused cancellation says why', async () => {
    await show(fx.order({ can_cancel: true }));
    server.use(
      http.post(url('/orders/:id/cancel'), () =>
        HttpResponse.json({ error: 'Pesanan sudah dibayar' }, { status: 409 }),
      ),
    );

    await userEvent.click(screen.getByRole('button', { name: /Batalkan Pesanan/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Ya, Batalkan' }));

    expect(await screen.findByText(/sudah dibayar/)).toBeInTheDocument();
  });
});

describe('confirming the parcel arrived', () => {
  const shipped = () =>
    fx.order({
      status: 'shipped',
      can_cancel: false,
      confirm_deadline_display: '30 Mei 2026',
    });

  test('a shipped order asks the student to confirm receipt', async () => {
    await show(shipped());

    expect(screen.getByRole('heading', { name: 'Paket Sudah Sampai?' })).toBeInTheDocument();
    expect(screen.getByText('30 Mei 2026')).toBeInTheDocument();
  });

  test('confirming is a two-step action', async () => {
    // It closes the order for good; a mis-tap should not end the dispute
    // window.
    await show(shipped());
    let confirmed = false;
    server.use(
      http.post(url('/orders/:id/confirm-delivery'), () => {
        confirmed = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: /Sudah Diterima/i }));
    expect(confirmed).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: /^Ya/ }));
    await waitFor(() => expect(confirmed).toBe(true));
  });

  test('an order that has not shipped is not asked about', async () => {
    await show(fx.order({ status: 'paid' }));

    expect(screen.queryByRole('heading', { name: 'Paket Sudah Sampai?' })).not.toBeInTheDocument();
  });
});

describe('arriving straight from checkout', () => {
  test('the new order is celebrated', async () => {
    setSearchParams('new=1');

    await show();

    expect(await screen.findByText(/Pesanan Berhasil|berhasil dibuat/i)).toBeInTheDocument();
  });

  test('revisiting later shows no such banner', async () => {
    await show();

    expect(screen.queryByText(/Pesanan Berhasil/i)).not.toBeInTheDocument();
  });
});

describe('a visitor who is not signed in', () => {
  test('they are sent to log in', async () => {
    setParams({ orderId: 'o-1' });

    renderPage(<OrderDetailPage />);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  });
});
