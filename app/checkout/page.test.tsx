import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import CheckoutPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { within } from '@testing-library/react';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { CartDTO, UserProfileDTO } from '@/types';

/** A student who has not filled in their Mandarin address yet. */
const withoutAddress = () =>
  fx.profile({
    address_zh_city: '',
    address_zh_district: '',
    address_zh_road: '',
    address_zh_number: '',
    postal_code: '',
    shipping_address_lines: [],
  } as Partial<UserProfileDTO>);

const withAddress = (over = {}) =>
  fx.profile({
    address_zh_city: '台北市',
    address_zh_district: '大安區',
    address_zh_road: '基隆路四段',
    address_zh_number: '43號',
    postal_code: '10617',
    shipping_address_lines: ['Budi Santoso', '台北市大安區基隆路四段43號', '10617'],
    ...over,
  } as Partial<UserProfileDTO>);

async function show({
  cart = fx.cart(),
  profile = fx.profile(),
}: { cart?: CartDTO; profile?: UserProfileDTO } = {}) {
  server.use(
    http.get(url('/cart'), () => HttpResponse.json(cart)),
    http.get(url('/auth/me'), () => HttpResponse.json(profile)),
  );
  renderPage(<CheckoutPage />, { as: 'student' });
  await screen.findByRole('heading', { name: 'Checkout' });
}

/** Captures the checkout body the page sends. */
function captureCheckout() {
  const seen: { body?: Record<string, unknown> } = {};
  server.use(
    http.post(url('/orders/checkout'), async ({ request }) => {
      seen.body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ order: fx.order({ id: 'o-9' }) });
    }),
  );
  return seen;
}

const placeOrder = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Pesan Sekarang' }));
};

/** Every field the browser marks required on the "other address" form. */
async function fillAltAddress() {
  await userEvent.type(screen.getByPlaceholderText('台北市'), '高雄市');
  await userEvent.type(screen.getByPlaceholderText('信義區'), '前金區');
  await userEvent.type(screen.getByPlaceholderText('信義路五段'), '中正四路');
  await userEvent.type(screen.getByPlaceholderText('7號'), '211號');
  const [name, postal, phone] = [
    screen.getByLabelText(/Nama Penerima/),
    screen.getByLabelText(/郵遞區號/),
    screen.getByLabelText(/Nomor Telepon/),
  ];
  await userEvent.type(name, 'Budi Santoso');
  await userEvent.type(postal, '80145');
  await userEvent.type(phone, '+886912345678');
}

describe('an empty cart', () => {
  test('there is nothing to check out', async () => {
    server.use(http.get(url('/cart'), () => HttpResponse.json(fx.emptyCart())));
    renderPage(<CheckoutPage />, { as: 'student' });

    expect(await screen.findByRole('heading', { name: 'Keranjang kosong' })).toBeInTheDocument();
  });
});

describe('choosing where it ships', () => {
  test('a student with a saved address gets it preselected', async () => {
    // Retyping a Mandarin address every order is where mistakes come from.
    await show({ profile: withAddress() });

    expect(await screen.findByText('台北市大安區基隆路四段43號')).toBeInTheDocument();
  });

  test('a student with no saved address gets the form instead', async () => {
    await show({ profile: withoutAddress() });

    expect(screen.getByPlaceholderText('台北市')).toBeInTheDocument();
  });

  test('the saved address can be swapped for another one', async () => {
    await show({ profile: withAddress() });

    await userEvent.click(screen.getByRole('button', { name: 'Alamat Lain' }));

    expect(screen.getByPlaceholderText('台北市')).toBeInTheDocument();
  });

  test('and swapped back again', async () => {
    await show({ profile: withAddress() });
    await userEvent.click(screen.getByRole('button', { name: 'Alamat Lain' }));

    await userEvent.click(screen.getByRole('button', { name: 'Alamat Terdaftar' }));

    expect(screen.getByText('台北市大安區基隆路四段43號')).toBeInTheDocument();
  });
});

describe('placing the order', () => {
  test('the saved address is what gets sent', async () => {
    await show({ profile: withAddress() });
    const seen = captureCheckout();

    await placeOrder();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body!.shipping_zh_city).toBe('台北市');
    expect(seen.body!.shipping_zh_road).toBe('基隆路四段');
    expect(seen.body!.shipping_postal).toBe('10617');
  });

  test('the address is sent as separate Mandarin fields, not one blob', async () => {
    // The backend composes the shipping line itself; sending a pre-joined
    // string would put the parts in the wrong order for Taiwan Post.
    await show({ profile: withAddress() });
    const seen = captureCheckout();

    await placeOrder();

    await waitFor(() => expect(seen.body).toBeDefined());
    for (const field of [
      'shipping_zh_city',
      'shipping_zh_district',
      'shipping_zh_road',
      'shipping_zh_number',
    ]) {
      expect(seen.body).toHaveProperty(field);
    }
  });

  test('a typed address is sent when the student chooses one', async () => {
    await show({ profile: withoutAddress() });
    const seen = captureCheckout();

    await fillAltAddress();
    await placeOrder();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body!.shipping_zh_city).toBe('高雄市');
    expect(seen.body!.shipping_zh_road).toBe('中正四路');
  });

  test('the student lands on their new order', async () => {
    await show({ profile: withAddress() });
    captureCheckout();

    await placeOrder();

    await waitFor(() => expect(push).toHaveBeenCalledWith('/orders/o-9?new=1'));
  });

  test('a refused checkout says why and stays put', async () => {
    await show({ profile: withAddress() });
    server.use(
      http.post(url('/orders/checkout'), () =>
        HttpResponse.json({ error: 'Modul tidak tersedia: MKDU4109' }, { status: 400 }),
      ),
    );

    await placeOrder();

    expect(await screen.findByText(/Modul tidak tersedia/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  test('notes reach the order', async () => {
    await show({ profile: withAddress() });
    const seen = captureCheckout();

    await userEvent.type(
      screen.getByPlaceholderText('Instruksi khusus untuk pengiriman'),
      'Titip ke satpam',
    );
    await placeOrder();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body!.notes).toBe('Titip ke satpam');
  });
});

describe('modules the student asked for by hand', () => {
  test('a request handed over from the cart is submitted with the order', async () => {
    sessionStorage.setItem(
      'cart_custom_items',
      JSON.stringify([{ code: 'EKMA4111', name: 'Pengantar Bisnis' }]),
    );
    await show({ profile: withAddress() });
    const seen = captureCheckout();

    await placeOrder();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body!.customItems).toEqual([
      { moduleCode: 'EKMA4111', moduleName: 'Pengantar Bisnis' },
    ]);
  });

  test('the handoff is consumed, so a later checkout does not resubmit it', async () => {
    // Otherwise the student orders the same unlisted module twice.
    sessionStorage.setItem('cart_custom_items', JSON.stringify([{ code: 'EKMA4111', name: '' }]));

    await show({ profile: withAddress() });

    await waitFor(() => expect(sessionStorage.getItem('cart_custom_items')).toBeNull());
  });

  test('a request with no name falls back to its code', async () => {
    sessionStorage.setItem('cart_custom_items', JSON.stringify([{ code: 'EKMA4111', name: '' }]));
    await show({ profile: withAddress() });
    const seen = captureCheckout();

    await placeOrder();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body!.customItems).toEqual([
      { moduleCode: 'EKMA4111', moduleName: 'EKMA4111' },
    ]);
  });

  test('corrupt handoff data is ignored rather than crashing the page', async () => {
    sessionStorage.setItem('cart_custom_items', 'not json');

    await show({ profile: withAddress() });

    expect(screen.getByRole('heading', { name: 'Checkout' })).toBeInTheDocument();
  });

  test('another module can be requested from the checkout page itself', async () => {
    // A student who remembers one more module should not have to go back.
    await show({ profile: withAddress() });
    const seen = captureCheckout();

    await userEvent.type(screen.getByPlaceholderText(/Kode TBO/), 'EKMA4111');
    await userEvent.type(screen.getByPlaceholderText(/Nama modul/), 'Pengantar Bisnis');
    await userEvent.click(screen.getByRole('button', { name: '+ Tambah' }));
    await placeOrder();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body!.customItems).toEqual([
      { moduleCode: 'EKMA4111', moduleName: 'Pengantar Bisnis' },
    ]);
  });

  test('a request added here can be taken off again', async () => {
    await show({ profile: withAddress() });
    const seen = captureCheckout();

    await userEvent.type(screen.getByPlaceholderText(/Kode TBO/), 'EKMA4111');
    await userEvent.click(screen.getByRole('button', { name: '+ Tambah' }));
    const row = screen.getByText('EKMA4111').closest('div');
    await userEvent.click(within(row!).getAllByRole('button')[0]);
    await placeOrder();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body!.customItems).toEqual([]);
  });

  test('nothing can be added without a code', async () => {
    await show({ profile: withAddress() });

    expect(screen.getByRole('button', { name: '+ Tambah' })).toBeDisabled();
  });

  test('an ordinary checkout sends no custom items', async () => {
    await show({ profile: withAddress() });
    const seen = captureCheckout();

    await placeOrder();

    await waitFor(() => expect(seen.body).toBeDefined());
    expect(seen.body!.customItems).toEqual([]);
  });
});

describe('what the order will cost', () => {
  test('the fees the backend calculated are shown, not recomputed here', async () => {
    await show({
      cart: fx.cart({
        total_breakdown: fx.totalBreakdown({
          subtotal_display: 'NT$1,700',
          fee_lines: [fx.feeLine({ label: 'Ongkos kirim', amount_display: 'NT$300' })],
          total_display: 'NT$2,000',
        }),
      }),
      profile: withAddress(),
    });

    expect(screen.getByText('NT$2,000')).toBeInTheDocument();
  });

  test('a fee waived for a SALUT member is shown as waived', async () => {
    // The member needs to see the benefit they paid for.
    await show({
      cart: fx.cart({
        total_breakdown: fx.totalBreakdown({
          fee_lines: [
            fx.feeLine({
              key: 'admin',
              label: 'Biaya admin',
              amount: 0,
              amount_display: 'NT$0',
              is_waived: true,
              original_amount_display: 'NT$425',
            }),
          ],
        }),
      }),
      profile: withAddress({ is_salut: true, is_salut_active: true, salut_status: 'approved' }),
    });

    expect(screen.getByText('NT$425')).toBeInTheDocument();
  });
});

describe('a visitor who is not signed in', () => {
  test('they are sent to log in', async () => {
    renderPage(<CheckoutPage />);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  });
});
