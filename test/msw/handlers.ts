/**
 * Default answers for every endpoint a page might reach.
 *
 * The point of a default is that a page test only has to describe what makes
 * *its* case interesting — a cart test overrides the cart, not the fee config
 * and the profile. `onUnhandledRequest: 'error'` in the setup means anything
 * missing here fails loudly rather than hanging.
 */

import { http, HttpResponse } from 'msw';
import * as fx from '@/test/fixtures';

const API = 'http://api.test/api';
export const url = (path: string) => `${API}${path}`;

/** Overridden per test via server.use(...). */
export const handlers = [
  // --- session ---
  http.get(url('/auth/me'), () => HttpResponse.json(fx.profile())),
  http.put(url('/auth/me'), () => HttpResponse.json(fx.profile())),
  http.post(url('/auth/login'), () =>
    HttpResponse.json({
      token: 'tok-1',
      refreshToken: 'ref-1',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'u-1', email: 'budi@example.com' },
    }),
  ),
  http.post(url('/auth/register'), () => HttpResponse.json({ message: 'ok' })),
  http.post(url('/auth/logout'), () => HttpResponse.json({ message: 'ok' })),
  http.post(url('/auth/resend-verification'), () => HttpResponse.json({ message: 'ok' })),
  http.post(url('/auth/refresh'), () =>
    HttpResponse.json({
      token: 'tok-2',
      refreshToken: 'ref-2',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    }),
  ),

  // --- catalogue ---
  http.get(url('/catalog/faculties'), () => HttpResponse.json([])),
  http.get(url('/catalog/programs'), () => HttpResponse.json([])),
  http.get(url('/catalog/faculties/:id/programs'), () => HttpResponse.json([])),
  http.get(url('/catalog/programs/:id'), () => HttpResponse.json({ id: 'pr-1', name: 'Sistem Informasi' })),
  http.get(url('/catalog/programs/:id/subjects'), () => HttpResponse.json([])),
  http.get(url('/catalog/subjects/:id'), () => HttpResponse.json({ id: 's-1', name: 'Statistika' })),

  http.get(url('/modules'), () => HttpResponse.json({ data: [fx.moduleSummary()], total: 1 })),
  http.get(url('/modules/search'), () => HttpResponse.json([fx.moduleSummary()])),
  http.get(url('/modules/:id'), () => HttpResponse.json(fx.moduleSummary())),

  http.get(url('/packages'), () => HttpResponse.json({ rows: [], total: 0, limit: 20, offset: 0 })),
  http.get(url('/packages/:id'), () => HttpResponse.json({ id: 'pk-1', name: 'Paket 1', modules: [] })),

  http.get(url('/products'), () => HttpResponse.json({ rows: [fx.product()], total: 1, limit: 20, offset: 0 })),
  http.get(url('/products/:id'), () => HttpResponse.json(fx.product())),
  http.get(url('/products/:id/claim-cta'), () => HttpResponse.json({ claim_cta: null })),

  // --- cart ---
  http.get(url('/cart'), () => HttpResponse.json(fx.emptyCart())),
  http.post(url('/cart/items'), () => HttpResponse.json(fx.cart())),
  http.post(url('/cart/packages'), () => HttpResponse.json(fx.cart())),
  http.post(url('/cart/merch'), () => HttpResponse.json(fx.cart())),
  http.put(url('/cart/items/:id'), () => HttpResponse.json(fx.cart())),
  http.patch(url('/cart/items/:id/convert-to-request'), () => HttpResponse.json(fx.cart())),
  http.delete(url('/cart/items/:id'), () => HttpResponse.json(fx.emptyCart())),
  http.delete(url('/cart'), () => HttpResponse.json(fx.emptyCart())),

  // --- orders ---
  http.post(url('/orders/checkout'), () => HttpResponse.json({ order: fx.order() })),
  http.get(url('/orders'), () => HttpResponse.json([fx.order()])),
  http.get(url('/orders/admin/all'), () => HttpResponse.json([fx.order()])),
  http.get(url('/orders/:id'), () => HttpResponse.json(fx.order())),
  http.post(url('/orders/:id/cancel'), () => HttpResponse.json({ message: 'ok' })),
  http.post(url('/orders/:id/confirm-delivery'), () => HttpResponse.json({ message: 'ok' })),
  http.patch(url('/orders/admin/:id/status'), () => HttpResponse.json({ message: 'ok' })),
  http.post(url('/orders/admin/:id/confirm-karunika'), () => HttpResponse.json({ message: 'ok' })),
  http.patch(url('/orders/admin/:orderId/items/:itemId/request-status'), () =>
    HttpResponse.json({ message: 'ok', status: 'approved', order: fx.order() }),
  ),

  // --- payments ---
  http.get(url('/payments/:orderId'), () => HttpResponse.json(fx.payment())),
  http.post(url('/payments/:orderId/proof'), () => HttpResponse.json({ message: 'ok' })),
  http.get(url('/payments/:orderId/proof'), () => HttpResponse.text('file-bytes')),
  http.post(url('/payments/:orderId/confirm'), () => HttpResponse.json({ message: 'ok' })),
  http.post(url('/payments/:orderId/invoice'), () => HttpResponse.json({ message: 'ok' })),
  http.get(url('/payments/:orderId/invoice'), () => HttpResponse.text('file-bytes')),

  // --- SALUT ---
  http.get(url('/salut/status'), () =>
    HttpResponse.json({ status: 'none', is_active: false, can_apply: true }),
  ),
  http.post(url('/salut/apply'), () =>
    HttpResponse.json({
      message: 'ok',
      fee: { amount: 300, currency: 'NTD', tier: 'new' },
      nextExpiry: '2027-02-01',
      renewalPolicy: {},
    }),
  ),
  http.post(url('/salut/upload-proof'), () => HttpResponse.json({ url: 'u/proof.jpg' })),

  // --- SKS ---
  http.post(url('/sks-payment/quote'), () =>
    HttpResponse.json({
      idr_amount: 5600000,
      ntd_amount: 10000,
      rate_idr_per_ntd: 560,
      idr_amount_display: fx.idr(5600000),
      ntd_amount_display: fx.ntd(10000),
      rate_display: '1 NTD = Rp560',
    }),
  ),
  http.post(url('/sks-payment/upload-slip'), () => HttpResponse.json({ url: 'u/slip.pdf' })),
  http.post(url('/sks-payment/upload-proof'), () => HttpResponse.json({ url: 'u/proof.png' })),
  http.post(url('/sks-payment'), () => HttpResponse.json(fx.sksPayment())),
  http.get(url('/sks-payment/mine'), () => HttpResponse.json([fx.sksPayment()])),
  http.get(url('/sks-payment/admin/all'), () => HttpResponse.json([fx.sksPayment()])),
  http.get(url('/sks-payment/admin/:id/slip-url'), () => HttpResponse.json({ signedUrl: 'https://s/slip' })),
  http.get(url('/sks-payment/admin/:id/proof-url'), () => HttpResponse.json({ signedUrl: 'https://s/proof' })),
  http.patch(url('/sks-payment/admin/:id/complete'), () => HttpResponse.json(fx.sksPayment())),
  http.patch(url('/sks-payment/admin/:id/reject'), () => HttpResponse.json(fx.sksPayment())),

  // --- admin users ---
  http.get(url('/users/admin/all'), () =>
    HttpResponse.json({ rows: [], total: 0, limit: 25, offset: 0 }),
  ),
  http.patch(url('/users/admin/:id/salut'), () => HttpResponse.json(fx.profile())),
  http.patch(url('/users/admin/salut/bulk'), () => HttpResponse.json({ updated: 1 })),
  http.get(url('/users/admin/salut/applications'), () => HttpResponse.json([])),
  http.get(url('/users/admin/salut/proof-url/:id'), () => HttpResponse.json({ signedUrl: 'https://s/p' })),
  http.patch(url('/users/admin/:id/salut/approve'), () => HttpResponse.json({ message: 'ok' })),
  http.patch(url('/users/admin/:id/salut/reject'), () => HttpResponse.json({ message: 'ok' })),

  // --- config and misc ---
  http.get(url('/config/fees'), () =>
    HttpResponse.json({ shipping: 300, box: 0, admin: 0, salut_waives: ['box', 'admin'] }),
  ),
  http.get(url('/config/banks'), () => HttpResponse.json({ currency: 'NTD', banks: [] })),
  http.get(url('/config/chat-widget'), () =>
    HttpResponse.json({ greeting: { enabled: false, text: '', showDelayMs: 1500, autoHideMs: 8000 } }),
  ),
  http.get(url('/panduan'), () => HttpResponse.json([])),
  http.get(url('/scraper/runs'), () => HttpResponse.json([])),
  http.get(url('/scraper/runs/:id'), () => HttpResponse.json({ id: 'r-1', status: 'completed' })),
  http.post(url('/scraper/run'), () => HttpResponse.json({ runId: 'r-1' })),
  http.post(url('/scraper/run-prefixes'), () => HttpResponse.json({ runId: 'r-1' })),
  http.post(url('/packages/sync'), () => HttpResponse.json({ linked: 0, packages: 0 })),

  // The live-status stream. jsdom has no EventSource (base.ts fakes it), but
  // the URL must still resolve if anything reaches for it.
  http.get(url('/sse/status'), () => new HttpResponse(null, { status: 204 })),
];
