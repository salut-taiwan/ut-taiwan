import { describe, expect, test } from 'vitest';
import HomePageContent from './HomePageContent';
import { renderPage, screen } from '@/test/utils/renderWithProviders';
import type { FeesConfig } from '@/lib/api';

const fees = (over: Record<string, unknown> = {}) =>
  ({
    shipping: 300,
    box: 0,
    admin: 0,
    salutMembership: {
      new: 1700,
      returning: 1200,
      new_display: 'NT$1,700',
      returning_display: 'NT$1,200',
      new_display_idr: 'Rp952.000',
      returning_display_idr: 'Rp672.000',
      tier_combined_display: 'NT$1,700 (semester 1) atau NT$1,200 (semester 2+)',
      renewalPolicy: { next_renewal_date_display: '1 Februari 2027' },
    },
    ...over,
  }) as unknown as FeesConfig;

const show = (config: FeesConfig | null = fees()) =>
  renderPage(<HomePageContent fees={config} />);

describe('the landing page', () => {
  test('it explains what the site is for', async () => {
    show();

    expect(screen.getByRole('heading', { name: 'Layanan kami' })).toBeInTheDocument();
  });

  test('every faculty is offered as a way in', async () => {
    show();

    expect(screen.getByRole('heading', { name: 'Pilih fakultas' })).toBeInTheDocument();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h?.startsWith('/program'))).toBe(true);
  });

  test('the main destinations are reachable from here', async () => {
    show();

    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    for (const destination of ['/salut', '/toko', '/panduan']) {
      expect(hrefs.some((h) => h?.startsWith(destination))).toBe(true);
    }
  });
});

describe('the SALUT pitch', () => {
  test('the renewal date is shown when the backend supplies one', async () => {
    show();

    expect(screen.getByText(/1 Februari 2027/)).toBeInTheDocument();
  });

  test('the page still renders when the fee config could not be fetched', async () => {
    // getFees() returns null on any failure; the landing page is the first
    // thing a visitor sees and must not depend on it.
    show(null);

    expect(screen.getByRole('heading', { name: 'Layanan kami' })).toBeInTheDocument();
  });

  test('a fee payload missing its membership block does not crash the page', async () => {
    // The chain guards `fees?` but then reads two levels deeper.
    show({ shipping: 300, box: 0, admin: 0 } as unknown as FeesConfig);

    expect(screen.getByRole('heading', { name: 'Layanan kami' })).toBeInTheDocument();
  });
});

describe('the rest of the page', () => {
  test('merchandise is advertised', async () => {
    show();

    expect(
      screen.getByRole('heading', { name: 'Merchandise resmi UT Taiwan' }),
    ).toBeInTheDocument();
  });

  test('how to order is explained', async () => {
    show();

    expect(screen.getByRole('heading', { name: 'Cara pemesanan' })).toBeInTheDocument();
  });

  test('the guides are pointed at', async () => {
    show();

    expect(screen.getByRole('heading', { name: 'Butuh panduan UT?' })).toBeInTheDocument();
  });
});
