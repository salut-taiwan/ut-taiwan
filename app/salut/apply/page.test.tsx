import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import SalutApplyPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

type Status = {
  effective_status: string;
  salut_rejection_reason?: string | null;
  salut_applied_semester?: number | null;
};

async function show(
  status: Status = { effective_status: 'none' },
  profile = fx.profile(),
) {
  server.use(
    signedInAs(profile),
    http.get(url('/salut/status'), () => HttpResponse.json(status)),
  );
  renderPage(<SalutApplyPage />, { as: 'student' });
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
}

const proof = () => new File(['bytes'], 'bukti.jpg', { type: 'image/jpeg' });
const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;
const waField = () => document.querySelector('[name="wa_number"]') as HTMLInputElement;
const submit = () => screen.getByRole('button', { name: 'Kirim Permohonan' });

describe('the four states an applicant can be in', () => {
  test('a member is told there is nothing to do', async () => {
    await show({ effective_status: 'approved' });

    expect(
      await screen.findByRole('heading', { name: 'Anda Sudah Anggota SALUT' }),
    ).toBeInTheDocument();
  });

  test('an application already in the queue cannot be sent twice', async () => {
    // A second application gives admins two payments to reconcile against one
    // student.
    await show({ effective_status: 'pending' });

    expect(
      await screen.findByRole('heading', { name: 'Permohonan Sedang Diproses' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kirim Permohonan' })).not.toBeInTheDocument();
  });

  test('a rejected applicant sees the reason and can try again', async () => {
    await show({ effective_status: 'rejected', salut_rejection_reason: 'Bukti transfer tidak terbaca' });

    expect(await screen.findByText(/Bukti transfer tidak terbaca/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kirim Permohonan' })).toBeInTheDocument();
  });

  test('a new applicant gets the form', async () => {
    await show();

    expect(
      await screen.findByRole('heading', { name: 'Daftar Keanggotaan SALUT' }),
    ).toBeInTheDocument();
  });
});

describe('paying', () => {
  test('the QRIS is here, behind the login, where a payment can be tied to an application', async () => {
    await show();

    expect(await screen.findByAltText('QRIS')).toBeInTheDocument();
  });
});

describe('sending an application', () => {
  test('nothing can be sent without both a proof and a number', async () => {
    await show();

    expect(submit()).toBeDisabled();
  });

  test('a proof alone is not enough when no number is on file', async () => {
    await show({ effective_status: 'none' }, fx.profile({ phone: null } as never));

    await userEvent.upload(fileInput(), proof());

    expect(submit()).toBeDisabled();
  });

  test('a complete application uploads the proof then applies', async () => {
    // Order matters: apply() needs the stored path the upload returns.
    await show();
    const calls: string[] = [];
    server.use(
      http.post(url('/salut/upload-proof'), () => {
        calls.push('upload');
        return HttpResponse.json({ url: 'u/proof.jpg' });
      }),
      http.post(url('/salut/apply'), () => {
        calls.push('apply');
        return HttpResponse.json({ message: 'ok', fee: {}, nextExpiry: '', renewalPolicy: {} });
      }),
    );

    await userEvent.upload(fileInput(), proof());
    await userEvent.clear(waField());
    await userEvent.type(waField(), '628123456789');
    await userEvent.click(submit());

    await waitFor(() => expect(calls).toEqual(['upload', 'apply']));
  });

  test('the WhatsApp number and semester are sent with the application', async () => {
    await show();
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(url('/salut/apply'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: 'ok', fee: {}, nextExpiry: '', renewalPolicy: {} });
      }),
    );

    await userEvent.upload(fileInput(), proof());
    await userEvent.clear(waField());
    await userEvent.type(waField(), '628123456789');
    await userEvent.click(submit());

    await waitFor(() => expect(body).toBeDefined());
    expect(body!.wa_number).toBe('628123456789');
    expect(body!.proofUrl).toBe('u/proof.jpg');
  });

  test('a successful application confirms it was sent', async () => {
    await show();

    await userEvent.upload(fileInput(), proof());
    await userEvent.clear(waField());
    await userEvent.type(waField(), '628123456789');
    await userEvent.click(submit());

    expect(
      await screen.findByRole('heading', { name: 'Permohonan Terkirim!' }),
    ).toBeInTheDocument();
  });

  test('a failed upload says why and leaves the form usable', async () => {
    await show();
    server.use(
      http.post(url('/salut/upload-proof'), () =>
        HttpResponse.json({ error: 'File terlalu besar' }, { status: 400 }),
      ),
    );

    await userEvent.upload(fileInput(), proof());
    await userEvent.clear(waField());
    await userEvent.type(waField(), '628123456789');
    await userEvent.click(submit());

    expect(await screen.findByText(/File terlalu besar/)).toBeInTheDocument();
    expect(submit()).toBeEnabled();
  });

  test('a rejected application does not report success', async () => {
    await show();
    server.use(
      http.post(url('/salut/apply'), () =>
        HttpResponse.json({ error: 'Sudah mengajukan permohonan' }, { status: 409 }),
      ),
    );

    await userEvent.upload(fileInput(), proof());
    await userEvent.clear(waField());
    await userEvent.type(waField(), '628123456789');
    await userEvent.click(submit());

    expect(await screen.findByText(/Sudah mengajukan/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Permohonan Terkirim!' })).not.toBeInTheDocument();
  });
});

describe('prefilling from the profile', () => {
  test('a phone number already on file is offered as the WhatsApp number', async () => {
    // One less thing to mistype, and the number admins already have.
    await show({ effective_status: 'none' }, fx.profile({ phone: '628999888777' } as never));

    await waitFor(() => expect(waField().value).toBe('628999888777'));
  });
});
