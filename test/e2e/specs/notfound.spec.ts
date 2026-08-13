import { test, expect } from '@playwright/test';

// The app had no not-found.tsx, so every bad URL — and every notFound() call,
// which the product page raises for an id that does not exist — landed on
// Next's default screen: unstyled, in English, with no way back.
test.describe('a URL that does not exist', () => {
  test('shows the site 404 rather than a framework default', async ({ page }) => {
    await page.goto('/tidak-ada-halaman-ini');

    await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
  });

  test('offers a way back into the site', async ({ page }) => {
    await page.goto('/tidak-ada-halaman-ini');

    await page.getByRole('link', { name: 'Kembali ke Beranda' }).click();

    await expect(page).toHaveURL(/\/$/);
  });
});
