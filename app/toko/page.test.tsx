import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import TokoPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import * as fx from '@/test/fixtures';

/** Server components are async; await the element, then render it. */
async function show(
  { rows = [fx.product()], total = 1, params = {} }:
    { rows?: unknown[]; total?: number; params?: Record<string, string> } = {},
) {
  server.use(
    http.get(url('/products'), () =>
      HttpResponse.json({ rows, total, limit: 24, offset: 0 }),
    ),
  );
  const ui = await TokoPage({ searchParams: Promise.resolve(params) });
  return render(ui);
}

describe('the merchandise shop', () => {
  test('products are listed with their price', async () => {
    await show();

    expect(screen.getByText('Almamater UT')).toBeInTheDocument();
    expect(screen.getByText(/NT\$560/)).toBeInTheDocument();
  });

  test('a product links through to its page', async () => {
    await show();

    expect(screen.getByRole('link', { name: /Almamater UT/ })).toHaveAttribute(
      'href',
      '/toko/pr-1',
    );
  });

  test('an empty shop says so rather than showing a blank grid', async () => {
    await show({ rows: [], total: 0 });

    expect(screen.getByText('Produk tidak ditemukan')).toBeInTheDocument();
  });

  test('a backend that cannot be reached degrades to an empty shop, not a crash', async () => {
    // The shop is statically revalidated; a failed revalidate must not take
    // the page down for everyone.
    server.use(http.get(url('/products'), () => HttpResponse.error()));

    const ui = await TokoPage({ searchParams: Promise.resolve({}) });
    render(ui);

    expect(screen.getByText('Produk tidak ditemukan')).toBeInTheDocument();
  });

  test('every category is offered as a filter link', async () => {
    await show();

    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/toko?category=jas-almamater');
    expect(hrefs).toContain('/toko');
  });

  test('the chosen category is carried into the paging links', async () => {
    await show({ params: { category: 'jaket' }, total: 100 });

    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h?.includes('category=jaket') && h?.includes('page=2'))).toBe(true);
  });

  test('a second page is offered when there are more products than fit', async () => {
    await show({ rows: [fx.product()], total: 100 });

    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h?.includes('page=2'))).toBe(true);
  });

  test('a single page of products offers no paging', async () => {
    await show({ total: 1 });

    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h?.includes('page='))).toBe(false);
  });
});
