import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import ProductPage, { generateMetadata } from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { notFound } from '@/test/utils/routerMock';
import { renderPage } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

const params = Promise.resolve({ productId: 'pr-1' });

function withProduct(product: unknown) {
  server.use(
    http.get(url('/products/:id'), () =>
      product === null
        ? HttpResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
        : HttpResponse.json(product as never),
    ),
  );
}

describe('a product page', () => {
  test('it renders the product', async () => {
    withProduct(fx.product());

    // ProductDetail is a client component: it needs the app's providers.
    renderPage(await ProductPage({ params }));

    expect(screen.getByText('Almamater UT')).toBeInTheDocument();
  });

  test('a product that does not exist is a 404, not an empty page', async () => {
    // notFound() renders the app's 404; returning an empty shell would be
    // indexed by search engines as a real page.
    withProduct(null);

    await ProductPage({ params }).catch(() => {});

    expect(notFound).toHaveBeenCalled();
  });

  test('a backend that cannot be reached is a 404 too', async () => {
    server.use(http.get(url('/products/:id'), () => HttpResponse.error()));

    await ProductPage({ params }).catch(() => {});

    expect(notFound).toHaveBeenCalled();
  });
});

describe('what search engines and shares see', () => {
  test('the title carries the product name', async () => {
    withProduct(fx.product());

    const meta = await generateMetadata({ params });

    expect(meta.title).toBe('Almamater UT | Toko UT Taiwan');
  });

  test('the description is the product description, trimmed', async () => {
    withProduct(fx.product({ description: 'x'.repeat(300) } as never));

    const meta = await generateMetadata({ params });

    expect(String(meta.description)).toHaveLength(155);
  });

  test('a product with no description still gets one', async () => {
    withProduct(fx.product({ description: null } as never));

    const meta = await generateMetadata({ params });

    expect(String(meta.description)).toMatch(/Almamater UT/);
  });

  test('a missing product is titled as such rather than left blank', async () => {
    withProduct(null);

    const meta = await generateMetadata({ params });

    expect(meta.title).toBe('Produk tidak ditemukan');
  });
});
