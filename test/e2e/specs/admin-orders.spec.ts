import type { Route } from '@playwright/test';
import { test, expect } from '../fixtures';
import { signIn, adminProfile, studentProfile } from '../support/apiStubs';

// The admin order desk. Every mutation here is gated on a native confirm(),
// and Playwright dismisses dialogs by default — the `dialogs` fixture accepts
// them, so a test that never touches it would silently assert nothing.

const item = (over: Record<string, unknown> = {}) => ({
  id: 'oi-1',
  item_type: 'module',
  module_code: 'MKDU4109',
  module_name: 'Bahasa Inggris',
  quantity: 2,
  unit_price: 50000,
  subtotal: 100000,
  subtotal_display: 'Rp 100.000',
  unit_price_display: 'Rp 50.000',
  is_request: false,
  request_status: null,
  price_visible: true,
  ...over,
});

const order = (over: Record<string, unknown> = {}) => ({
  id: 'o-1',
  order_number: 'UT-2026-10001',
  status: 'pending',
  status_label: 'Menunggu Konfirmasi',
  order_kind: 'module',
  subtotal: 100000,
  subtotal_display: 'Rp 100.000',
  total_amount: 525000,
  total_amount_display: 'Rp 525.000',
  is_salut_order: false,
  created_at: '2026-05-20T00:00:00Z',
  created_at_display: '20 Mei 2026',
  shipping_name: 'Budi Santoso',
  shipping_phone: '+886912345678',
  order_items: [item()],
  payments: [],
  fee_lines: [],
  ...over,
});

async function openAdmin(
  page: Parameters<typeof signIn>[0],
  api: (stubs?: object) => Promise<void>,
  orders: unknown[],
) {
  await signIn(page);
  await api({
    me: adminProfile,
    extra: {
      '**/api/orders/admin/all': (route: Route) => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(orders),
      }),
    },
  });
  await page.goto('/admin/orders');
}

test.describe('reaching the admin desk', () => {
  test('a student is turned away', async ({ page, api }) => {
    await signIn(page);
    await api({ me: studentProfile });

    await page.goto('/admin/orders');

    await expect(page).toHaveURL('/');
  });

  test('an admin sees the orders waiting on them', async ({ page, api }) => {
    await openAdmin(page, api, [order()]);
    await expect(page.getByText('UT-2026-10001')).toBeVisible();
  });
});

test.describe('separating modules from almet', () => {
  // Addressed by tab role: the navbar has its own "Modul" dropdown button.
  const tab = (page: Parameters<typeof signIn>[0], name: string | RegExp) =>
    page.getByRole('tab', { name });

  test('each queue shows only its own work', async ({ page, api }) => {
    await openAdmin(page, api, [
      order({ id: 'o-1', order_number: 'UT-MODUL', order_kind: 'module' }),
      order({ id: 'o-2', order_number: 'UT-ALMET', order_kind: 'merch' }),
    ]);

    await tab(page, /^Modul$/).click();
    await expect(page.getByText('UT-MODUL')).toBeVisible();
    await expect(page.getByText('UT-ALMET')).toHaveCount(0);

    await tab(page, /almet & merch/i).click();
    await expect(page.getByText('UT-ALMET')).toBeVisible();
    await expect(page.getByText('UT-MODUL')).toHaveCount(0);
  });

  test('an order holding both appears in both queues, so neither team loses it', async ({ page, api }) => {
    await openAdmin(page, api, [order({ order_number: 'UT-CAMPURAN', order_kind: 'mixed' })]);

    await tab(page, /^Modul$/).click();
    await expect(page.getByText('UT-CAMPURAN')).toBeVisible();

    await tab(page, /almet & merch/i).click();
    await expect(page.getByText('UT-CAMPURAN')).toBeVisible();
  });

  test('a mixed order is labelled as such', async ({ page, api }) => {
    await openAdmin(page, api, [order({ order_kind: 'mixed' })]);
    await expect(page.getByText('Campuran')).toBeVisible();
  });
});

test.describe('resolving a request item', () => {
  const withPendingRequest = () => order({
    order_items: [item({
      id: 'oi-req', is_request: true, request_status: 'pending',
      unit_price: 0, subtotal: 0, module_code: 'REQ0001',
    })],
  });

  test('an unpriced request asks for a price before it can be approved', async ({ page, api }) => {
    await openAdmin(page, api, [withPendingRequest()]);

    await page.getByRole('button', { name: /permintaan pending/i }).click();
    await page.getByRole('button', { name: 'Setujui' }).click();

    await expect(page.getByPlaceholder('Harga...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'OK' })).toBeDisabled();
  });

  test('the price must be a positive number', async ({ page, api }) => {
    await openAdmin(page, api, [withPendingRequest()]);
    await page.getByRole('button', { name: /permintaan pending/i }).click();
    await page.getByRole('button', { name: 'Setujui' }).click();

    await page.getByPlaceholder('Harga...').fill('0');
    await expect(page.getByRole('button', { name: 'OK' })).toBeDisabled();

    await page.getByPlaceholder('Harga...').fill('65000');
    await expect(page.getByRole('button', { name: 'OK' })).toBeEnabled();
  });

  test('stock cannot be confirmed while a request is still open', async ({ page, api }) => {
    // Confirming would email the customer a total that is about to change.
    await openAdmin(page, api, [withPendingRequest()]);

    await expect(page.getByRole('button', { name: /konfirmasi karunika/i })).toBeDisabled();
  });

  test('with nothing outstanding, stock can be confirmed', async ({ page, api }) => {
    await openAdmin(page, api, [order()]);

    await expect(page.getByRole('button', { name: /konfirmasi karunika/i })).toBeEnabled();
  });
});

test.describe('confirmations are asked for, and respected', () => {
  test('declining the prompt leaves the order alone', async ({ page, api, dialogs }) => {
    let called = false;
    await signIn(page);
    await api({
      me: adminProfile,
      extra: {
        '**/api/orders/admin/all': route => route.fulfill({
          status: 200, contentType: 'application/json', body: JSON.stringify([order()]),
        }),
        '**/api/orders/admin/*/confirm-karunika': route => {
          called = true;
          return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        },
      },
    });
    await page.goto('/admin/orders');

    dialogs.declineNext();
    await page.getByRole('button', { name: /konfirmasi karunika/i }).click();
    await page.waitForTimeout(300);

    expect(called).toBe(false);
    expect(dialogs.messages.length).toBe(1);
  });

  test('accepting it advances the order', async ({ page, api, dialogs }) => {
    let called = false;
    await signIn(page);
    await api({
      me: adminProfile,
      extra: {
        '**/api/orders/admin/all': route => route.fulfill({
          status: 200, contentType: 'application/json', body: JSON.stringify([order()]),
        }),
        '**/api/orders/admin/*/confirm-karunika': route => {
          called = true;
          return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify({ message: 'ok', status: 'awaiting_payment' }),
          });
        },
      },
    });
    await page.goto('/admin/orders');

    await page.getByRole('button', { name: /konfirmasi karunika/i }).click();
    await expect.poll(() => called).toBe(true);
    expect(dialogs.messages[0]).toMatch(/karunika/i);
  });
});

test.describe('what the desk shows about money', () => {
  test('a request awaiting a price shows no amount rather than "Gratis"', async ({ page, api }) => {
    // A zero here means nobody has priced it yet. Showing "Gratis" told admins
    // the item was free and left the order stuck.
    await openAdmin(page, api, [order({
      order_items: [item({
        id: 'oi-req', is_request: true, request_status: 'pending',
        unit_price: 0, subtotal: 0, subtotal_display: 'Gratis',
      })],
    })]);

    await page.getByRole('button', { name: /permintaan pending/i }).click();

    await expect(page.getByText('Harga menyusul')).toBeVisible();
    await expect(page.getByText('Gratis')).toHaveCount(0);
  });

  test('an almet line is labelled and priced, not left blank', async ({ page, api }) => {
    await openAdmin(page, api, [order({
      order_kind: 'merch',
      order_items: [item({
        item_type: 'merch', module_code: null, module_name: 'Jas Almamater',
        variant_label: 'L', unit_price: 350000, subtotal: 350000,
        subtotal_display: 'Rp 350.000',
      })],
    })]);

    await page.getByRole('button', { name: /detail item/i }).click();

    await expect(page.getByText('Jas Almamater')).toBeVisible();
    await expect(page.getByText('Rp 350.000')).toBeVisible();
  });
});
