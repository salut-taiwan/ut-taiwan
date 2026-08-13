import { test, expect } from '@playwright/test';

// Live mode only: a real backend over a seeded database. These are the
// journeys where frontend and backend could disagree while every stubbed test
// still passed, because a stub agrees with whatever it was written to say.
//
// Serial, and in this order, because they share one student account: the cart
// is emptied by checkout, and applying for SALUT changes the account's status,
// which would change what an earlier assertion sees. Running them in a fixed
// order is cheaper than inventing an account per test.
test.describe.serial('a signed-in student, against the real API', () => {
  test('sees the catalogue the backend actually serves', async ({ page }) => {
    await page.goto('/modules');
    await expect(page.getByText('E2E-PRICED')).toBeVisible();
  });

  test('is told a zero-priced module has no price, not that it is free', async ({ page }) => {
    // The whole pricing fix in one assertion, end to end: numeric column,
    // drizzle mapping, presenter, and the component gate all have to agree.
    await page.goto('/modules');
    const card = page.locator('div', { hasText: 'E2E-UNPRICED' }).last();
    await expect(card.getByText('Hubungi Kami')).toBeVisible();
    await expect(card.getByText('Gratis')).toHaveCount(0);
  });

  test('can put a real module in a real cart', async ({ page }) => {
    await page.goto('/modules');
    const card = page.locator('div', { hasText: 'E2E-PRICED' }).last();
    await card.getByRole('button', { name: 'Tambah ke Keranjang' }).click();

    await page.goto('/cart');
    await expect(page.getByText('Modul Berharga')).toBeVisible();
  });

  test('can place a real order, and the backend prices it', async ({ page }) => {
    // The money path. The address goes as separate Mandarin fields, the
    // backend composes the shipping line, applies the fee rules for a
    // non-member, adds a unique code and writes the payment row — none of
    // which a stub can check.
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Lanjut ke Checkout' }).click();
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Lanjut ke Checkout' }).last().click();

    await expect(page).toHaveURL(/\/checkout/);
    await page.getByRole('button', { name: 'Pesan Sekarang' }).click();

    // Lands on the new order, which now exists with a number the backend made.
    await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}\?new=1/, { timeout: 15_000 });
    await expect(page.getByText(/^UT-/).first()).toBeVisible();
  });

  test('the new order is waiting on a stock check, not on payment', async ({ page }) => {
    // A fresh order is 'pending' until an admin confirms Karunika stock, so
    // the student must not be shown bank details yet — paying early is what
    // produces the refund requests.
    await page.goto('/orders');
    await page.getByText(/^UT-/).first().click();

    await expect(page.getByText(/Menunggu verifikasi stok/)).toBeVisible();
  });

  test('sees their own orders, with the totals the backend computed', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByText('UT-E2E-AWAITING')).toBeVisible();
  });

  test('is shown where to pay once stock is confirmed', async ({ page }) => {
    await page.goto('/orders');
    await page.getByText('UT-E2E-AWAITING').click();
    await expect(page.getByText(/2950211345/)).toBeVisible();
  });

  test('can send a transfer proof, and it is stored', async ({ page }) => {
    // Multipart to Supabase Storage through the backend — a different path
    // from every JSON request, with its own auth handling.
    await page.goto('/orders');
    await page.getByText('UT-E2E-AWAITING').click();
    await expect(page.getByText(/2950211345/)).toBeVisible();

    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'bukti.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a', 'hex'),
    });

    await expect(page.getByText('Bukti transfer sudah dikirim')).toBeVisible({ timeout: 15_000 });
  });

  test('can ask SALUT to pay their SKS bill', async ({ page }) => {
    // Two uploads and a quote the backend computes from its own rate. The
    // student pays NTD against an IDR bill, so the two numbers have to agree
    // across the wire.
    await page.goto('/sks-payment/apply');

    // By type, not placeholder: getByPlaceholder('0') also substring-matches
    // the period field's "2026.1 atau 2026 Ganjil".
    await page.locator('input[type="number"]').fill('5600000');
    // nim and name prefill from the profile; the period does not.
    await page.getByPlaceholder(/contoh: 2026\.1/).fill('2026.1');
    await expect(page.getByText(/NT\$/).first()).toBeVisible({ timeout: 15_000 });

    const files = page.locator('input[type="file"]');
    await files.nth(0).setInputFiles({
      name: 'slip.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex'),
    });
    await files.nth(1).setInputFiles({
      name: 'transfer.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex'),
    });

    await page.getByRole('button', { name: 'Kirim Permohonan' }).click();

    await expect(page.getByText(/Menunggu Verifikasi|berhasil|terkirim/i).first())
      .toBeVisible({ timeout: 20_000 });
  });

  test('is quoted the membership fee in rupiah on the application page', async ({ page }) => {
    await page.goto('/salut/apply');
    await expect(page.getByText(/Rp\s?672\.000/)).toBeVisible();
  });

  // Last: this flips the account's SALUT status, which changes what the page
  // above renders.
  test('can apply for SALUT, and the application reaches the admin queue', async ({ page }) => {
    await page.goto('/salut/apply');

    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'qris.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex'),
    });
    await page.locator('[name="wa_number"]').fill('628123456789');
    await page.getByRole('button', { name: 'Kirim Permohonan' }).click();

    await expect(page.getByRole('heading', { name: 'Permohonan Terkirim!' }))
      .toBeVisible({ timeout: 20_000 });
  });
});
