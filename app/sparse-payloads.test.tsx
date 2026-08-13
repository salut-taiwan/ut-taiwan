import { describe, expect, test } from 'vitest';
import { HttpResponse, http } from 'msw';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { setParams } from '@/test/utils/routerMock';
import { renderPage, screen } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

import CartPage from './cart/page';
import CheckoutPage from './checkout/page';
import OrdersPage from './orders/page';
import OrderDetailPage from './orders/[orderId]/page';
import ProfilePage from './profile/page';
import SksPaymentPage from './sks-payment/page';
import ModuleDetailPage from './modules/[moduleId]/page';

/**
 * Every page, rendered against a payload with all its optional fields absent.
 *
 * A page that reads `x.y.z` where the backend omitted `y` takes the whole
 * route down. That is not hypothetical: the landing page and the SALUT page
 * both did exactly this, guarding `fees?` and then reading two levels deeper.
 *
 * These are cheap and they exercise the `?? fallback` arm of most of the
 * defensive branches in the app at once.
 */

describe('a backend response with every optional field missing', () => {
  test('the cart still renders', async () => {
    server.use(http.get(url('/cart'), () => HttpResponse.json(fx.sparseCart())));

    renderPage(<CartPage />, { as: 'student' });

    expect(await screen.findByRole('heading', { name: 'Keranjang Kosong' })).toBeInTheDocument();
  });

  test('checkout still renders', async () => {
    server.use(
      http.get(url('/cart'), () => HttpResponse.json(fx.cart())),
      signedInAs(fx.sparseProfile()),
    );

    renderPage(<CheckoutPage />, { as: 'student' });

    expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeInTheDocument();
  });

  test('the order list still renders', async () => {
    server.use(http.get(url('/orders'), () => HttpResponse.json([fx.sparseOrder()])));

    renderPage(<OrdersPage />, { as: 'student' });

    expect(await screen.findByText('UT-2026-0001')).toBeInTheDocument();
  });

  test('an order with no items, payments or display fields still renders', async () => {
    setParams({ orderId: 'o-1' });
    server.use(http.get(url('/orders/:id'), () => HttpResponse.json(fx.sparseOrder())));

    renderPage(<OrderDetailPage />, { as: 'student' });

    expect(await screen.findByRole('heading', { name: 'UT-2026-0001' })).toBeInTheDocument();
  });

  test('the profile still renders for an account with nothing filled in', async () => {
    // A student who registered and never completed their details.
    server.use(
      signedInAs(fx.sparseProfile()),
      http.get(url('/catalog/programs'), () => HttpResponse.json([])),
    );

    renderPage(<ProfilePage />, { as: 'student' });

    expect(await screen.findByRole('heading', { name: 'Profil Saya' })).toBeInTheDocument();
  });

  test('the SKS list still renders with no display fields', async () => {
    server.use(
      http.get(url('/sks-payment/mine'), () =>
        HttpResponse.json([
          {
            id: 's-1',
            nim: '1',
            name: 'B',
            semester_period: '2026.1',
            idr_amount: 0,
            ntd_amount: 0,
            rate_idr_per_ntd: 0,
            status: 'pending',
            rejection_reason: null,
            completed_at: null,
            created_at: '2026-05-20T00:00:00Z',
          },
        ]),
      ),
    );

    renderPage(<SksPaymentPage />, { as: 'student' });

    expect(await screen.findByRole('heading', { name: 'Bantuan Bayar SKS' })).toBeInTheDocument();
  });

  test('a module with no edition, author or cover still renders', async () => {
    setParams({ moduleId: 'm-1' });
    server.use(
      http.get(url('/modules/:id'), () =>
        HttpResponse.json({
          id: 'm-1',
          tbo_code: 'MKDU4109',
          name: 'Bahasa Inggris I',
          cover_image_url: null,
          price_student: 0,
          is_available: true,
        }),
      ),
    );

    renderPage(<ModuleDetailPage />, { as: 'student' });

    expect(await screen.findByRole('heading', { name: 'Bahasa Inggris I' })).toBeInTheDocument();
  });
});
