import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import SksApplyPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

const QUOTE_DEBOUNCE_MS = 500;

async function show(profile = fx.profile()) {
  server.use(signedInAs(profile));
  renderPage(<SksApplyPage />, { as: 'student' });
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
}

const amountField = () => screen.getByPlaceholderText('0');
const periodField = () => screen.getByPlaceholderText(/contoh: 2026\.1/);
const fileInputs = () =>
  Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
const submit = () => screen.getByRole('button', { name: 'Kirim Permohonan' });

const slip = () => new File(['pdf'], 'slip.pdf', { type: 'application/pdf' });
const proof = () => new File(['img'], 'bukti.png', { type: 'image/png' });

describe('quoting the rupiah amount in NTD', () => {
  test('a typed amount is quoted', async () => {
    await show();

    await userEvent.type(amountField(), '5600000');

    // The estimate is rendered in both the compact and full layouts.
    expect((await screen.findAllByText('NT$10,000', {}, { timeout: 3000 })).length).toBeGreaterThan(0);
  });

  test('the quote comes from the backend rather than a rate in the page', async () => {
    // The rate moves; a hard-coded one would quietly under- or over-charge.
    let asked: number | undefined;
    await show();
    server.use(
      http.post(url('/sks-payment/quote'), async ({ request }) => {
        asked = ((await request.json()) as { idr_amount: number }).idr_amount;
        return HttpResponse.json({
          idr_amount: 5600000,
          ntd_amount: 10000,
          rate_idr_per_ntd: 560,
          idr_amount_display: 'Rp5.600.000',
          ntd_amount_display: 'NT$10,000',
        });
      }),
    );

    await userEvent.type(amountField(), '5600000');

    await waitFor(() => expect(asked).toBe(5600000), { timeout: 3000 });
  });

  test('typing does not fire a request per keystroke', async () => {
    let calls = 0;
    await show();
    server.use(
      http.post(url('/sks-payment/quote'), () => {
        calls += 1;
        return HttpResponse.json({
          idr_amount: 1,
          ntd_amount: 1,
          rate_idr_per_ntd: 560,
          idr_amount_display: 'Rp1',
          ntd_amount_display: 'NT$1',
        });
      }),
    );

    await userEvent.type(amountField(), '5600000');
    await new Promise((r) => setTimeout(r, QUOTE_DEBOUNCE_MS + 300));

    expect(calls).toBeLessThan(4);
  });

  test('clearing the amount clears the quote', async () => {
    await show();
    await userEvent.type(amountField(), '5600000');
    await screen.findAllByText('NT$10,000', {}, { timeout: 3000 });

    await userEvent.clear(amountField());

    await waitFor(() => expect(screen.queryAllByText('NT$10,000')).toHaveLength(0));
  });

  test('a failed quote does not leave a stale number on screen', async () => {
    // Submitting against a stale quote is how a student transfers the wrong
    // amount.
    await show();
    server.use(http.post(url('/sks-payment/quote'), () => HttpResponse.error()));

    await userEvent.type(amountField(), '5600000');
    await new Promise((r) => setTimeout(r, QUOTE_DEBOUNCE_MS + 300));

    expect(screen.queryAllByText('NT$10,000')).toHaveLength(0);
  });
});

describe('sending the request', () => {
  async function fillEverything() {
    await userEvent.type(amountField(), '5600000');
    await userEvent.clear(periodField());
    await userEvent.type(periodField(), '2026.1');
    const [slipInput, proofInput] = fileInputs();
    if (slipInput) await userEvent.upload(slipInput, slip());
    if (proofInput) await userEvent.upload(proofInput, proof());
    await screen.findAllByText('NT$10,000', {}, { timeout: 3000 });
  }

  test('nothing can be submitted until every field and both files are present', async () => {
    // canSubmit is the only gate a student can reach; handleSubmit's own
    // checks are defensive duplicates behind it (marked as such in the page).
    await show();

    await userEvent.type(amountField(), '5600000');
    expect(submit()).toBeDisabled();

    const [slipInput] = fileInputs();
    await userEvent.upload(slipInput, slip());
    expect(submit()).toBeDisabled();
  });

  test('a complete request uploads both files then submits', async () => {
    await show();
    const calls: string[] = [];
    server.use(
      http.post(url('/sks-payment/upload-slip'), () => {
        calls.push('slip');
        return HttpResponse.json({ url: 'u/slip.pdf' });
      }),
      http.post(url('/sks-payment/upload-proof'), () => {
        calls.push('proof');
        return HttpResponse.json({ url: 'u/proof.png' });
      }),
      http.post(url('/sks-payment'), () => {
        calls.push('submit');
        return HttpResponse.json(fx.sksPayment());
      }),
    );

    await fillEverything();
    await userEvent.click(submit());

    await waitFor(() => expect(calls).toEqual(['slip', 'proof', 'submit']), { timeout: 3000 });
  });

  test('the stored file paths are what get submitted, not the files themselves', async () => {
    await show();
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(url('/sks-payment'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(fx.sksPayment());
      }),
    );

    await fillEverything();
    await userEvent.click(submit());

    await waitFor(() => expect(body).toBeDefined(), { timeout: 3000 });
    expect(body!.ut_slip_url).toBe('u/slip.pdf');
    expect(body!.transfer_proof_url).toBe('u/proof.png');
    expect(body!.idr_amount).toBe(5600000);
  });

  test('a refused submission says why', async () => {
    await show();
    server.use(
      http.post(url('/sks-payment'), () =>
        HttpResponse.json({ error: 'Periode semester tidak valid' }, { status: 400 }),
      ),
    );

    await fillEverything();
    await userEvent.click(submit());

    expect(await screen.findByText(/tidak valid/, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});

describe('prefilling from the profile', () => {
  test('the name and NIM already on file are used', async () => {
    // Retyping them is where the mismatches with UT's records come from.
    await show();

    await waitFor(() => expect(screen.getByDisplayValue('Budi Santoso')).toBeInTheDocument());
    expect(screen.getByDisplayValue('041234567')).toBeInTheDocument();
  });
});
