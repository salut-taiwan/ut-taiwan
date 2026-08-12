import { describe, expect, test } from 'vitest';
import { HttpResponse, http } from 'msw';
import SksPaymentPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { renderPage, screen } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { SksPaymentDTO } from '@/types';

async function show(rows: SksPaymentDTO[] | 'error' = [fx.sksPayment()]) {
  server.use(
    http.get(url('/sks-payment/mine'), () =>
      rows === 'error' ? HttpResponse.error() : HttpResponse.json(rows),
    ),
  );
  renderPage(<SksPaymentPage />, { as: 'student' });
}

describe('a student\'s SKS payment requests', () => {
  test('each request shows both amounts and its status', async () => {
    // The student pays NTD against an IDR bill; seeing only one is what
    // generates the "kok beda" questions.
    await show();

    expect(await screen.findByText('Rp5.600.000')).toBeInTheDocument();
    expect(screen.getByText('NT$10,000')).toBeInTheDocument();
    expect(screen.getByText('Menunggu Verifikasi')).toBeInTheDocument();
  });

  test('a rejected request shows the reason', async () => {
    // Without it the student resubmits the same wrong thing.
    await show([
      fx.sksPayment({
        status: 'rejected',
        status_label: 'Ditolak',
        rejection_reason: 'Nominal transfer tidak sesuai',
      }),
    ]);

    expect(await screen.findByText(/Nominal transfer tidak sesuai/)).toBeInTheDocument();
  });

  test('a student with no requests is pointed at the form', async () => {
    await show([]);

    expect(await screen.findByRole('heading', { name: 'Belum ada pembayaran' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Ajukan/ })[0]).toHaveAttribute(
      'href',
      '/sks-payment/apply',
    );
  });

  test('a student with requests can still make another', async () => {
    await show();
    await screen.findByText('Rp5.600.000');

    expect(screen.getByRole('link', { name: 'Ajukan Baru' })).toHaveAttribute(
      'href',
      '/sks-payment/apply',
    );
  });

  test('a failure to load is reported rather than left as a loading skeleton', async () => {
    // The error guard has to run before the skeleton guard: a failed load
    // leaves `rows` null, so the other order spins forever.
    await show('error');

    expect(await screen.findByText(/Gagal memuat data/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Muat ulang' })).toBeInTheDocument();
  });

  test('a completed request reads as done', async () => {
    await show([
      fx.sksPayment({ status: 'completed', status_label: 'Selesai', status_tone: 'success' }),
    ]);

    expect(await screen.findByText('Selesai')).toBeInTheDocument();
  });
});
