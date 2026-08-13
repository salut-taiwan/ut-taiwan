import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import CartPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { CartDTO } from '@/types';

function withCart(value: CartDTO) {
  server.use(http.get(url('/cart'), () => HttpResponse.json(value)));
}

async function show(value: CartDTO = fx.cart()) {
  withCart(value);
  renderPage(<CartPage />, { as: 'student' });
  await screen.findByRole('heading', { name: 'Keranjang Belanja' });
}

const checkout = () => screen.getByRole('button', { name: 'Lanjut ke Checkout' });

describe('an empty cart', () => {
  test('the student is pointed at their programme rather than a blank page', async () => {
    withCart(fx.emptyCart());
    renderPage(<CartPage />, { as: 'student' });

    expect(await screen.findByRole('heading', { name: 'Keranjang Kosong' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pilih Program Studi' })).toHaveAttribute(
      'href',
      '/program',
    );
  });
});

describe('what is in the cart', () => {
  test('a module shows its code, name and price', async () => {
    await show();

    expect(screen.getByText('MKDU4109')).toBeInTheDocument();
    expect(screen.getByText('Bahasa Inggris I')).toBeInTheDocument();
    expect(screen.getByText(/NT\$1,700 \/ eks/)).toBeInTheDocument();
  });

  test('merchandise shows its product name and variant instead of a module code', async () => {
    await show(
      fx.cart({
        items: [
          fx.cartItem({
            itemType: 'merch',
            moduleId: undefined,
            tboCode: undefined,
            moduleName: undefined,
            skuId: 'sku-1',
            productNameSnapshot: 'Almamater UT',
            variantLabel: 'M / Hitam',
          }),
        ],
      }),
    );

    expect(screen.getByText('Almamater UT')).toBeInTheDocument();
    expect(screen.getByText('M / Hitam')).toBeInTheDocument();
  });

  test('a module with no price yet says so instead of showing zero', async () => {
    // "Rp0" would read as free, which is the bug this whole area exists to
    // avoid.
    await show(
      fx.cart({
        items: [fx.cartItem({ isRequest: true, isPricePending: true, priceSnapshotDisplay: null })],
      }),
    );

    expect(screen.getAllByText('Harga menyusul').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NT\$0/)).not.toBeInTheDocument();
  });

  test('a request is labelled so the student knows it is not confirmed', async () => {
    await show(fx.cart({ items: [fx.cartItem({ isRequest: true })] }));

    expect(screen.getByText('Permintaan')).toBeInTheDocument();
  });
});

describe('changing the cart', () => {
  test('the quantity can be increased', async () => {
    await show();
    let sent: unknown;
    server.use(
      http.put(url('/cart/items/:id'), async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(fx.cart({ items: [fx.cartItem({ quantity: 2 })] }));
      }),
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Tambah jumlah Bahasa Inggris I' }),
    );

    await waitFor(() => expect(sent).toEqual({ quantity: 2 }));
  });

  test('an item can be removed', async () => {
    await show();
    let removed = false;
    server.use(
      http.delete(url('/cart/items/:id'), () => {
        removed = true;
        return HttpResponse.json(fx.emptyCart());
      }),
      http.get(url('/cart'), () => HttpResponse.json(removed ? fx.emptyCart() : fx.cart())),
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Hapus Bahasa Inggris I dari keranjang' }),
    );

    await waitFor(() => expect(removed).toBe(true));
  });

  test('emptying the cart asks first', async () => {
    // It is destructive and unrecoverable; a stray click must not clear it.
    vi.mocked(globalThis.confirm).mockReturnValueOnce(false);
    await show();
    let cleared = false;
    server.use(
      http.delete(url('/cart'), () => {
        cleared = true;
        return HttpResponse.json(fx.emptyCart());
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Kosongkan Keranjang' }));

    expect(cleared).toBe(false);
  });

  test('confirming actually empties it', async () => {
    await show();
    let cleared = false;
    server.use(
      http.delete(url('/cart'), () => {
        cleared = true;
        return HttpResponse.json(fx.emptyCart());
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Kosongkan Keranjang' }));

    await waitFor(() => expect(cleared).toBe(true));
  });

  test('a failed clear tells the student rather than looking like it worked', async () => {
    await show();
    server.use(
      http.delete(url('/cart'), () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Kosongkan Keranjang' }));

    expect(await screen.findByText(/Gagal mengosongkan keranjang/)).toBeInTheDocument();
  });
});

describe('an item that went out of stock after it was added', () => {
  const stale = () =>
    fx.cart({
      hasStaleItems: true,
      items: [fx.cartItem({ isStale: true, isAvailable: false })],
    });

  test('the student is told, rather than finding out at checkout', async () => {
    await show(stale());

    expect(screen.getByText('Stok habis sejak ditambahkan')).toBeInTheDocument();
  });

  test('checkout is blocked until it is dealt with', async () => {
    await show(stale());

    expect(checkout()).toBeDisabled();
    expect(screen.getByText(/Selesaikan item yang tidak tersedia/)).toBeInTheDocument();
  });

  test('it can be turned into a request instead of being lost', async () => {
    await show(stale());
    let converted = false;
    server.use(
      http.patch(url('/cart/items/:id/convert-to-request'), () => {
        converted = true;
        return HttpResponse.json(fx.cart({ items: [fx.cartItem({ isRequest: true })] }));
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ubah ke Permintaan' }));

    await waitFor(() => expect(converted).toBe(true));
    expect(await screen.findByText('Item diubah menjadi permintaan')).toBeInTheDocument();
  });

  test('a healthy cart can go to checkout', async () => {
    await show();

    expect(checkout()).toBeEnabled();
  });
});

describe('the terms of business', () => {
  test('checkout goes through the terms first, not straight to payment', async () => {
    await show();

    await userEvent.click(checkout());

    expect(await screen.findByRole('heading', { name: 'Ketentuan Pemesanan Buku' })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  test('the student cannot continue without agreeing', async () => {
    await show();
    await userEvent.click(checkout());

    const [, confirmButton] = screen.getAllByRole('button', { name: 'Lanjut ke Checkout' });
    expect(confirmButton).toBeDisabled();
  });

  test('agreeing lets them through to checkout', async () => {
    await show();
    await userEvent.click(checkout());

    await userEvent.click(screen.getByRole('checkbox'));
    const [, confirmButton] = screen.getAllByRole('button', { name: 'Lanjut ke Checkout' });
    await userEvent.click(confirmButton);

    expect(push).toHaveBeenCalledWith('/checkout');
  });

  test('the terms say the address must be in Mandarin', async () => {
    // Karunika ships from Taiwan; a Latin-script address is undeliverable, and
    // this is the only place the student is told before they type one.
    await show();

    await userEvent.click(checkout());

    expect(screen.getByText(/wajib ditulis dalam bahasa Mandarin/)).toBeInTheDocument();
  });

  test('Escape closes the terms dialog', async () => {
    // It could only be dismissed by clicking the backdrop or Batal, both
    // mouse-first. A keyboard user who opened it had to hunt for the button.
    await show();
    await userEvent.click(checkout());
    expect(screen.getByRole('heading', { name: 'Ketentuan Pemesanan Buku' })).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(
      screen.queryByRole('heading', { name: 'Ketentuan Pemesanan Buku' }),
    ).not.toBeInTheDocument();
  });

  test('closing the dialog forgets that they agreed', async () => {
    // Otherwise reopening it shows a pre-ticked box they never re-read.
    await show();
    await userEvent.click(checkout());
    await userEvent.click(screen.getByRole('checkbox'));

    await userEvent.click(screen.getByRole('button', { name: 'Batal' }));
    await userEvent.click(checkout());

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});

describe('asking for a module that is not in the catalogue', () => {
  const codeField = () => screen.getByPlaceholderText(/Kode TBO/);

  test('a code with no name is enough to add one', async () => {
    await show();

    await userEvent.type(codeField(), 'EKMA4111');
    await userEvent.click(screen.getByRole('button', { name: '+ Tambah' }));

    expect(
      screen.getByRole('button', { name: 'Hapus permintaan EKMA4111' }),
    ).toBeInTheDocument();
  });

  test('nothing can be added without a code', async () => {
    await show();

    expect(screen.getByRole('button', { name: '+ Tambah' })).toBeDisabled();
  });

  test('a request carries through to checkout, so the page can submit it', async () => {
    // It only exists in this component's state; sessionStorage is the handoff.
    await show();
    await userEvent.type(codeField(), 'EKMA4111');
    await userEvent.type(screen.getByPlaceholderText(/Nama modul/), 'Pengantar Bisnis');
    await userEvent.click(screen.getByRole('button', { name: '+ Tambah' }));

    await userEvent.click(checkout());
    await userEvent.click(screen.getByRole('checkbox'));
    const [, confirmButton] = screen.getAllByRole('button', { name: 'Lanjut ke Checkout' });
    await userEvent.click(confirmButton);

    expect(JSON.parse(sessionStorage.getItem('cart_custom_items')!)).toEqual([
      { code: 'EKMA4111', name: 'Pengantar Bisnis' },
    ]);
  });

  test('a custom item can be taken back off again', async () => {
    await show();
    await userEvent.type(codeField(), 'EKMA4111');
    await userEvent.click(screen.getByRole('button', { name: '+ Tambah' }));

    await userEvent.click(screen.getByRole('button', { name: 'Hapus permintaan EKMA4111' }));

    expect(
      screen.queryByRole('button', { name: 'Hapus permintaan EKMA4111' }),
    ).not.toBeInTheDocument();
  });

  test('the code field is capped so a paste cannot overflow it', async () => {
    await show();

    await userEvent.click(codeField());
    await userEvent.paste('X'.repeat(60));

    expect((codeField() as HTMLInputElement).value).toHaveLength(30);
  });
});

describe('a visitor who is not signed in', () => {
  test('they are sent to log in', async () => {
    const location = { href: '' } as Location;
    Object.defineProperty(window, 'location', { value: location, writable: true });

    renderPage(<CartPage />);

    await waitFor(() => expect(location.href).toBe('/login'));
  });
});
