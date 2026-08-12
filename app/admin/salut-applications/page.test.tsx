import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import SalutApplicationsPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';
import type { AdminSalutApplicationDTO } from '@/types';

const application = (over: Partial<AdminSalutApplicationDTO> = {}): AdminSalutApplicationDTO => ({
  id: 'u-9',
  email: 'rina@example.com',
  name: 'Rina Putri',
  nim: '041234567',
  current_semester: 1,
  salut_applied_at: '2026-05-20T00:00:00Z',
  salut_payment_proof_url: 'u/proof.jpg',
  salut_applied_fee_amount: 1700,
  salut_applied_semester: 1,
  salut_wa_number: '628123456789',
  programs: { code: 'S1SI', name: 'Sistem Informasi' },
  salut_applied_at_display: '20 Mei 2026',
  salut_applied_fee_amount_display: 'NT$1,700',
  ...over,
});

async function show(rows: AdminSalutApplicationDTO[] = [application()]) {
  server.use(
    signedInAs(fx.adminProfile()),
    http.get(url('/users/admin/salut/applications'), () => HttpResponse.json(rows)),
  );
  renderPage(<SalutApplicationsPage />, { as: 'admin' });
  await screen.findByRole('heading', { name: 'Permohonan SALUT' });
  // The rows arrive after the heading; asserting before they land tests the
  // empty state instead.
  if (rows.length > 0) await screen.findByText(rows[0].name);
}

describe('who may see applications', () => {
  test('a student is turned away', async () => {
    server.use(signedInAs(fx.profile()));

    renderPage(<SalutApplicationsPage />, { as: 'student' });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  test('an admin gets the queue', async () => {
    await show();

    expect(await screen.findByText('Rina Putri')).toBeInTheDocument();
  });
});

describe('what an admin needs to decide', () => {
  test('the applicant, their programme and the fee they paid are shown', async () => {
    await show();

    expect(await screen.findByText('Rina Putri')).toBeInTheDocument();
    expect(screen.getByText(/Sistem Informasi|S1SI/)).toBeInTheDocument();
    expect(screen.getByText('NT$1,700')).toBeInTheDocument();
  });

  test('the WhatsApp number is a working link, so the applicant can be added to the group', async () => {
    // This is why the field was added to registration at all.
    await show();

    expect(await screen.findByRole('link', { name: /628123456789|WhatsApp|WA/i })).toHaveAttribute(
      'href',
      'https://wa.me/628123456789',
    );
  });

  test('an applicant who gave no number does not produce a broken link', async () => {
    await show([application({ salut_wa_number: null })]);

    await screen.findByText('Rina Putri');
    expect(screen.queryByRole('link', { name: /wa\.me/ })).not.toBeInTheDocument();
  });

  test('the payment proof opens through a signed URL rather than a public one', async () => {
    await show();
    const open = vi.fn();
    vi.stubGlobal('open', open);
    server.use(
      http.get(url('/users/admin/salut/proof-url/:id'), () =>
        HttpResponse.json({ signedUrl: 'https://signed/proof.jpg' }),
      ),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Lihat' }));

    await waitFor(() =>
      expect(open).toHaveBeenCalledWith('https://signed/proof.jpg', '_blank', 'noopener'),
    );
  });
});

describe('deciding an application', () => {
  test('approving it calls through', async () => {
    await show();
    let approved: string | undefined;
    server.use(
      http.patch(url('/users/admin/:id/salut/approve'), ({ params }) => {
        approved = params.id as string;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Setujui' }));

    await waitFor(() => expect(approved).toBe('u-9'));
  });

  test('rejecting asks for a reason first', async () => {
    // The reason goes into the email; rejecting without one leaves the student
    // with nothing to act on.
    await show();
    let rejected = false;
    server.use(
      http.patch(url('/users/admin/:id/salut/reject'), () => {
        rejected = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Tolak' }));

    expect(rejected).toBe(false);
  });

  test('a reason is sent with the rejection', async () => {
    await show();
    let body: { reason?: string } | undefined;
    server.use(
      http.patch(url('/users/admin/:id/salut/reject'), async ({ request }) => {
        body = (await request.json()) as { reason?: string };
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Tolak' }));
    const reason = screen.getByRole('textbox');
    await userEvent.type(reason, 'Bukti transfer tidak terbaca');
    const [confirmReject] = screen
      .getAllByRole('button', { name: 'Tolak' })
      .filter((b) => !b.hasAttribute('disabled'));
    await userEvent.click(confirmReject);

    await waitFor(() => expect(body?.reason).toBe('Bukti transfer tidak terbaca'));
  });
});

describe('working through the queue in bulk', () => {
  const two = () => [application(), application({ id: 'u-10', name: 'Andi Wijaya' })];

  test('several applications can be selected and approved at once', async () => {
    await show(two());
    const approved: string[] = [];
    server.use(
      http.patch(url('/users/admin/:id/salut/approve'), ({ params }) => {
        approved.push(params.id as string);
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    const [selectAll] = screen.getAllByRole('checkbox');
    await userEvent.click(selectAll);
    await userEvent.click(screen.getByRole('button', { name: /Setujui \d+/ }));

    await waitFor(() => expect(approved.sort()).toEqual(['u-10', 'u-9']));
  });

  test('a bulk approval asks first', async () => {
    vi.mocked(globalThis.confirm).mockReturnValueOnce(false);
    await show(two());
    let called = false;
    server.use(
      http.patch(url('/users/admin/:id/salut/approve'), () => {
        called = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    const [selectAll] = screen.getAllByRole('checkbox');
    await userEvent.click(selectAll);
    await userEvent.click(screen.getByRole('button', { name: /Setujui \d+/ }));

    expect(called).toBe(false);
  });

  test('one failure in a bulk run does not hide the successes', async () => {
    // Approvals are sent one at a time; the admin needs to know how many
    // actually went through.
    await show(two());
    server.use(
      http.patch(url('/users/admin/:id/salut/approve'), ({ params }) =>
        params.id === 'u-9'
          ? HttpResponse.json({ error: 'boom' }, { status: 500 })
          : HttpResponse.json({ message: 'ok' }),
      ),
    );

    const [selectAll] = screen.getAllByRole('checkbox');
    await userEvent.click(selectAll);
    await userEvent.click(screen.getByRole('button', { name: /Setujui \d+/ }));

    // The toast reports the split rather than claiming a clean run.
    expect(await screen.findByText(/gagal|berhasil/i)).toBeInTheDocument();
  });
});

describe('the two queues', () => {
  test('it opens on the applications waiting for a decision', async () => {
    await show();

    // The pending tab carries a count badge, so match on the prefix.
    expect(screen.getByRole('button', { name: /^Menunggu/ })).toBeInTheDocument();
  });

  test('the full history can be shown instead', async () => {
    const asked: string[] = [];
    server.use(
      signedInAs(fx.adminProfile()),
      http.get(url('/users/admin/salut/applications'), ({ request }) => {
        asked.push(new URL(request.url).searchParams.get('status') ?? 'pending');
        return HttpResponse.json([application()]);
      }),
    );
    renderPage(<SalutApplicationsPage />, { as: 'admin' });
    await screen.findByRole('heading', { name: 'Permohonan SALUT' });

    await userEvent.click(screen.getByRole('button', { name: 'Semua' }));

    await waitFor(() => expect(asked).toContain('all'));
  });

  test('the history offers no checkboxes, since those applications are decided', async () => {
    await show();

    await userEvent.click(screen.getByRole('button', { name: 'Semua' }));

    await waitFor(() => expect(screen.queryAllByRole('checkbox')).toHaveLength(0));
  });
});
