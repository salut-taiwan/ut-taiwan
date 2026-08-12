import { test, expect } from '../fixtures';
import {
  modulePriced, moduleUnpriced, moduleOutOfStock, studentProfile, signIn,
} from '../support/apiStubs';

// What someone can do before they have an account, and what the catalogue
// promises them about price and availability.

test.describe('a visitor without an account', () => {
  test('can browse the module catalogue', async ({ page, api }) => {
    await api({ modules: [modulePriced] });

    await page.goto('/modules');

    await expect(page.getByText('MKDU4109')).toBeVisible();
    await expect(page.getByText('Rp 50.000')).toBeVisible();
  });

  test('is sent to log in when they try to add something to a cart', async ({ page, api }) => {
    await api({ modules: [modulePriced] });
    await page.goto('/modules');

    await page.getByRole('button', { name: /tambah ke keranjang/i }).first().click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('is asked to log in before reaching the cart', async ({ page, api }) => {
    await api();
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/login/);
  });

  test('sees the membership fee in the currency they will actually transfer', async ({ page, api }) => {
    await api();

    await page.goto('/salut');

    await expect(page.getByText('Rp 952.000')).toBeVisible();
    await expect(page.getByText('Rp 672.000')).toBeVisible();
  });

  test('cannot see the QRIS or a bank account on the public SALUT page', async ({ page, api }) => {
    // Students were transferring without logging in or filing an application,
    // which left the payment untraceable. Payment details now live behind the
    // login on the application page.
    await api();

    await page.goto('/salut');

    await expect(page.getByRole('img', { name: /qris/i })).toHaveCount(0);
    await expect(page.getByText('2950211345')).toHaveCount(0);
    await expect(page.getByText(/setelah Anda login/i)).toBeVisible();
  });

  test('is told where to go to pay', async ({ page, api }) => {
    await api();
    await page.goto('/salut');
    await expect(page.getByRole('link', { name: /halaman pendaftaran/i })).toBeVisible();
  });
});

test.describe('the catalogue is honest about price and stock', () => {
  test('a module with no price yet is not offered as free', async ({ page, api }) => {
    // A zero price means nobody has entered one, not that the book costs
    // nothing. Showing "Gratis" here would promise something we cannot honour.
    await api({ modules: [moduleUnpriced] });

    await page.goto('/modules');

    await expect(page.getByText('Hubungi Kami')).toBeVisible();
    await expect(page.getByText('Gratis')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Minta Buku Ini' })).toBeVisible();
  });

  test('an out-of-stock module keeps its price but must be requested', async ({ page, api }) => {
    await api({ modules: [moduleOutOfStock] });

    await page.goto('/modules');

    await expect(page.getByText('Rp 50.000')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Minta Buku Ini' })).toBeVisible();
  });

  test('a priced, in-stock module can be bought outright', async ({ page, api }) => {
    await api({ modules: [modulePriced] });

    await page.goto('/modules');

    await expect(page.getByRole('button', { name: 'Tambah ke Keranjang' })).toBeVisible();
  });
});

test.describe('signing in', () => {
  test('a wrong password is reported without ending anyone\'s session', async ({ page, api }) => {
    await api({
      extra: {
        '**/api/auth/login': route => route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Email atau password salah' }),
        }),
      },
    });

    await page.goto('/login');
    await page.getByLabel(/email/i).fill('budi@example.com');
    // Scoped to the textbox: the show/hide toggle also matches "password".
    await page.getByRole('textbox', { name: /password/i }).fill('salah');
    await page.getByRole('button', { name: /masuk/i }).click();

    await expect(page.getByText('Email atau password salah')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('a signed-in student is greeted by name', async ({ page, api }) => {
    await signIn(page);
    await api({ me: studentProfile });

    await page.goto('/');

    await expect(page.getByText('BS')).toBeVisible();
  });
});
