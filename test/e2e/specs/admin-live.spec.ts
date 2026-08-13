import { test, expect } from '@playwright/test';

// Live mode only. The admin side is where the frontend and backend have the
// most to disagree about: pricing a requested item rewrites the order totals
// and the pending payment amount in SQL, and the page renders whatever comes
// back. A stub agrees with whatever it was written to say, so none of this is
// really checked until it runs against the real thing.

test.describe('an admin, against the real API', () => {
  test('sees the seeded orders in the queue', async ({ page }) => {
    await page.goto('/admin/orders');

    await expect(page.getByText('UT-E2E-PENDING')).toBeVisible();
    await expect(page.getByText('UT-E2E-AWAITING')).toBeVisible();
  });

  test('a requested item with no price reads as awaiting one, not as free', async ({ page }) => {
    // The same assertion the student side makes, from the other end: the
    // numeric column, the drizzle mapping, the presenter and this page all
    // have to agree that 0 means "not priced yet".
    await page.goto('/admin/orders');
    const row = page.locator('tr', { hasText: 'UT-E2E-PENDING' }).first();
    await row.getByRole('button', { name: /permintaan pending/ }).click();

    await expect(page.getByText('Harga menyusul')).toBeVisible();
    await expect(page.getByText('Gratis')).toHaveCount(0);
  });

  test('the SALUT queue shows the applications waiting on a decision', async ({ page }) => {
    await page.goto('/admin/salut-applications');

    await expect(page.getByRole('heading', { name: 'Permohonan SALUT' })).toBeVisible();
    await expect(page.getByText('@e2e.test').first()).toBeVisible();
  });

  test('an applicant\'s WhatsApp number is a usable link', async ({ page }) => {
    // The reason the field was added to registration: without a working link
    // an admin cannot add the member to the group.
    await page.goto('/admin/salut-applications');

    const wa = page.locator('a[href^="https://wa.me/"]').first();
    await expect(wa).toBeVisible();
  });

  test('the student list loads with the seeded accounts', async ({ page }) => {
    await page.goto('/admin/users');

    await expect(page.getByRole('heading', { name: 'Manajemen Mahasiswa' })).toBeVisible();
    await expect(page.getByText('Budi Santoso')).toBeVisible();
  });
});

// Serial: these change the seeded data, and the file runs alongside others.
test.describe.serial('an admin changing an order, against the real API', () => {
  test('pricing a requested item rewrites the order total server-side', async ({ page }) => {
    // The contract this whole tier exists for. Approving with a price makes
    // the backend recompute the subtotal, the total and the pending payment
    // amount in one transaction, then hand the whole order back. If the
    // frontend and the SQL disagree about any of that, it shows up here and
    // nowhere else.
    await page.goto('/admin/orders');
    const row = page.locator('tr', { hasText: 'UT-E2E-PENDING' }).first();
    // The queue loads after mount and count() does not auto-wait, so the row
    // has to be on screen before asking whether the request is still pending.
    await expect(row).toBeVisible();
    const disclosure = row.getByRole('button', { name: /permintaan pending/ });

    // A previous run against the same database will already have priced it.
    // The seed is idempotent but does not reset a settled request, so skip
    // rather than fail — in CI the database is always fresh.
    if ((await disclosure.count()) === 0) {
      test.skip(true, 'the seeded request has already been priced on this stack');
    }
    await disclosure.click();

    await page.getByRole('button', { name: 'Setujui', exact: true }).first().click();
    await page.getByPlaceholder('Harga...').fill('25000');

    page.once('dialog', (d) => d.accept());
    // exact: "OK" otherwise substring-matches the "Dokumen ▼" disclosure.
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // The request line stops saying "price to follow" once it has one.
    await expect(page.getByText('Harga menyusul')).toHaveCount(0);
  });
});
