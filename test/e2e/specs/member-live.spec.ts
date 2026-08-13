import { test, expect } from '@playwright/test';

// The free almet is claim-gated: one per semester-1 SALUT member, once ever.
// The guard that enforces "once" lives in SQL and was dead code until this
// week — it read `.rows` off a postgres.js Result, which has no such property,
// so it always saw zero prior claims and a member could claim repeatedly.
//
// Unit and system tests cover the SQL now. This is the only place the browser,
// the API and the database all run together for it. Note the rule keys on a
// *paid* order, so exhausting the claim needs a full checkout plus an admin
// confirming payment — that half stays in the system tier.
test.describe.serial('a SALUT member, against the real API', () => {
  async function openFreeAlmet(page: import('@playwright/test').Page) {
    await page.goto('/toko');
    await page.getByRole('link', { name: /Gratis SALUT/ }).click();
    await expect(page.getByRole('heading', { name: /Gratis SALUT/ })).toBeVisible();
  }

  test('cannot claim before choosing a size', async ({ page }) => {
    // A claim is once ever, so an accidental wrong-size claim is
    // unrecoverable. The CTA is a disabled gate until a size is picked.
    await openFreeAlmet(page);

    await expect(page.getByRole('button', { name: /Pilih ukuran/ }))
      .toBeVisible({ timeout: 15_000 });
  });

  test('is offered the claim once a size is chosen', async ({ page }) => {
    // The label comes from the backend's own eligibility check — a
    // semester-1 member who has not claimed before.
    await openFreeAlmet(page);

    await page.getByRole('button', { name: 'M', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Klaim Gratis' })).toBeVisible();
  });

  test('can claim it once', async ({ page }) => {
    await openFreeAlmet(page);
    await page.getByRole('button', { name: 'M', exact: true }).click();

    await page.getByRole('button', { name: 'Klaim Gratis' }).click();

    await page.goto('/cart');
    await expect(page.getByText(/Gratis SALUT/)).toBeVisible({ timeout: 15_000 });
  });

  test('putting it in the cart does not burn the entitlement', async ({ page }) => {
    // "Once ever" is keyed on an order with a *paid* payment, not on a cart
    // item — so a member who abandons a cart keeps their jacket. If this ever
    // starts reading cart rows, this test is what notices.
    await openFreeAlmet(page);

    await expect(page.getByRole('button', { name: 'Sudah Diklaim' })).toHaveCount(0);
    await page.getByRole('button', { name: 'M', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Klaim Gratis' })).toBeVisible();
  });
});
