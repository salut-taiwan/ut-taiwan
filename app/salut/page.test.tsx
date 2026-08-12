import { describe, expect, test } from 'vitest';
import { HttpResponse, http } from 'msw';
import SalutPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { renderPage, screen } from '@/test/utils/renderWithProviders';

const fees = (over = {}) => ({
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
    renewalPolicy: { notice: null },
  },
  ...over,
});

async function show(config: object = fees()) {
  server.use(http.get(url('/config/fees'), () => HttpResponse.json(config)));
  renderPage(<SalutPage />);
  await screen.findByRole('heading', { level: 1 });
}

describe('the public SALUT page', () => {
  test('it is readable without signing in', async () => {
    await show();

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('the membership fee comes from the backend, in both currencies', async () => {
    // Students think in rupiah and pay in NTD; showing one without the other
    // is what generated the "berapa sih sebenarnya" questions.
    await show();

    expect(await screen.findByText('NT$1,700')).toBeInTheDocument();
    expect(screen.getByText('Rp952.000')).toBeInTheDocument();
  });

  test('the returning-member rate is shown too', async () => {
    await show();

    expect(await screen.findByText('NT$1,200')).toBeInTheDocument();
    expect(screen.getByText('Rp672.000')).toBeInTheDocument();
  });

  test('the QRIS itself is not on this page', async () => {
    // Students were transferring from here without logging in or applying, so
    // admins had no application to match the payment against.
    await show();

    expect(screen.queryByAltText(/QRIS/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ditampilkan di halaman pendaftaran/)).toBeInTheDocument();
  });

  test('no bank account number is offered either', async () => {
    // Same reason: a bank transfer cannot be reconciled through QRIS.
    await show();

    expect(screen.queryByText(/No\. Rekening/i)).not.toBeInTheDocument();
  });

  test('a config that will not load still renders the page', async () => {
    // The fee is not the point of the page; losing it must not take the whole
    // explanation with it. Nor must a payload missing salutMembership.
    await show({ shipping: 300, box: 0, admin: 0 });

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
