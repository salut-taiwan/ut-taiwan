import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import AdminSksPaymentsPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { within } from '@testing-library/react';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { AdminSksPaymentDTO } from '@/types';

const row = (over: Partial<AdminSksPaymentDTO> = {}): AdminSksPaymentDTO =>
  ({ ...fx.sksPayment(), email: 'budi@example.com', ...over }) as AdminSksPaymentDTO;

async function show(rows: AdminSksPaymentDTO[] = [row()]) {
  server.use(
    signedInAs(fx.adminProfile()),
    http.get(url('/sks-payment/admin/all'), () => HttpResponse.json(rows)),
  );
  renderPage(<AdminSksPaymentsPage />, { as: 'admin' });
  await screen.findByRole('heading', { name: 'Pembayaran SKS' });
  if (rows.length > 0) await screen.findByText(rows[0].name);
}

describe('who may verify SKS payments', () => {
  test('a student is turned away', async () => {
    server.use(signedInAs(fx.profile()));

    renderPage(<AdminSksPaymentsPage />, { as: 'student' });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });
});

describe('what an admin needs to verify', () => {
  test('the applicant, both amounts and their email are shown', async () => {
    // The admin reconciles an NTD transfer against an IDR bill, then pays UT.
    await show();

    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Rp5.600.000')).toBeInTheDocument();
    expect(screen.getByText('NT$10,000')).toBeInTheDocument();
    // The email shares a line with the period and date.
    expect(screen.getByText(/budi@example\.com/)).toBeInTheDocument();
  });

  test('both uploaded files open through signed URLs', async () => {
    await show();
    const open = vi.fn();
    vi.stubGlobal('open', open);

    const viewers = screen.getAllByRole('button', { name: /Slip|Bukti|Lihat/i });
    await userEvent.click(viewers[0]);

    await waitFor(() => expect(open).toHaveBeenCalled());
    expect(open.mock.calls[0][0]).toMatch(/^https:\/\/s\//);
  });
});

describe('deciding', () => {
  test('marking it done calls through', async () => {
    await show();
    let completed: string | undefined;
    server.use(
      http.patch(url('/sks-payment/admin/:id/complete'), ({ params }) => {
        completed = params.id as string;
        return HttpResponse.json(fx.sksPayment({ status: 'completed' }));
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tandai Selesai' }));

    await waitFor(() => expect(completed).toBe('s-1'));
  });

  test('a second admin clicking done is told it is already handled', async () => {
    // The backend refuses a non-pending row; the admin must see that rather
    // than assume it worked.
    await show();
    server.use(
      http.patch(url('/sks-payment/admin/:id/complete'), () =>
        HttpResponse.json({ error: 'Sudah diproses' }, { status: 409 }),
      ),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tandai Selesai' }));

    expect(await screen.findByText(/Sudah diproses/)).toBeInTheDocument();
  });

  test('rejecting needs a reason', async () => {
    await show();
    let rejected = false;
    server.use(
      http.patch(url('/sks-payment/admin/:id/reject'), () => {
        rejected = true;
        return HttpResponse.json(fx.sksPayment({ status: 'rejected' }));
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tolak' }));

    expect(rejected).toBe(false);
  });

  test('the reason is sent with the rejection', async () => {
    await show();
    let body: { reason?: string } | undefined;
    server.use(
      http.patch(url('/sks-payment/admin/:id/reject'), async ({ request }) => {
        body = (await request.json()) as { reason?: string };
        return HttpResponse.json(fx.sksPayment({ status: 'rejected' }));
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tolak' }));
    await userEvent.type(screen.getByRole('textbox'), 'Nominal tidak sesuai');
    // Both the row and the dialog have a "Tolak"; the dialog's is the one that
    // commits, so scope to the dialog rather than picking by enabled state.
    const dialog = screen.getByRole('heading', { name: 'Tolak Permohonan' }).closest('div')!;
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));

    await waitFor(() => expect(body?.reason).toBe('Nominal tidak sesuai'));
  });
});

describe('the two queues', () => {
  test('the full history can be shown as well as the pending ones', async () => {
    const asked: string[] = [];
    server.use(
      signedInAs(fx.adminProfile()),
      http.get(url('/sks-payment/admin/all'), ({ request }) => {
        asked.push(new URL(request.url).searchParams.get('status') ?? 'pending');
        return HttpResponse.json([row()]);
      }),
    );
    renderPage(<AdminSksPaymentsPage />, { as: 'admin' });
    await screen.findByRole('heading', { name: 'Pembayaran SKS' });

    await userEvent.click(screen.getByRole('button', { name: /^Semua/ }));

    await waitFor(() => expect(asked).toContain('all'));
  });
});
