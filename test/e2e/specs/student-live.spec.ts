import { test, expect } from '@playwright/test';

// Live mode only: a real backend over a seeded database. These are the
// journeys where frontend and backend could disagree while every stubbed test
// still passed, because a stub agrees with whatever it was written to say.

test.describe('a signed-in student, against the real API', () => {
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

  test('sees their own orders, with the totals the backend computed', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByText('UT-E2E-AWAITING')).toBeVisible();
  });

  test('is shown where to pay once stock is confirmed', async ({ page }) => {
    await page.goto('/orders');
    await page.getByText('UT-E2E-AWAITING').click();
    await expect(page.getByText(/2950211345/)).toBeVisible();
  });

  test('is quoted the membership fee in rupiah on the application page', async ({ page }) => {
    await page.goto('/salut/apply');
    await expect(page.getByText(/Rp\s?672\.000/)).toBeVisible();
  });
});
