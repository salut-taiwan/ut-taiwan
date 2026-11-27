import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import RegisterPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';

const programs = [{ id: 'pr-1', code: 'S1SI', name: 'Sistem Informasi', faculty_id: 'f-1' }];
// display_label is what the select renders — config/banks.js composes it.
const ntdBanks = [{ code: '822', name: 'CTBC Bank', display_label: '822 - CTBC Bank' }];
const idrBanks = [{ code: 'BCA', name: 'Bank Central Asia', display_label: 'BCA - Bank Central Asia' }];

async function show() {
  server.use(
    http.get(url('/catalog/programs'), () => HttpResponse.json(programs)),
    http.get(url('/config/banks'), ({ request }) => {
      const currency = new URL(request.url).searchParams.get('currency');
      return HttpResponse.json({
        currency,
        banks: currency === 'NTD' ? ntdBanks : idrBanks,
      });
    }),
  );
  renderPage(<RegisterPage />);
  await screen.findByRole('heading', { name: 'Daftar Akun' });
}

/** Fills every field the browser marks required, by input name. */
async function fillForm() {
  const values: Record<string, string> = {
    name: 'Budi Santoso',
    email: 'budi@example.com',
    nim: '041234567',
    phone: '+6281234567890',
    phone_taiwan: '0912345678',
    almamater_size: 'Ukuran khusus 2XL',
    password: 'rahasia123',
    confirmPassword: 'rahasia123',
    birth_place: 'Jakarta',
    birth_date: '2000-01-01',
    address_zh_city: '台北市',
    address_zh_district: '信義區',
    address_zh_road: '信義路五段',
    address_zh_number: '7號',
    postal_code: '110',
  };
  for (const [name, value] of Object.entries(values)) {
    const field = document.querySelector(`[name="${name}"]`) as HTMLInputElement | null;
    if (!field) continue;
    await userEvent.clear(field);
    await userEvent.type(field, value);
  }
  for (const name of ['program_id', 'current_semester']) {
    const select = document.querySelector(`[name="${name}"]`) as HTMLSelectElement | null;
    if (select && select.options.length > 1) {
      await userEvent.selectOptions(select, select.options[1].value);
    }
  }
}

describe('the registration form', () => {
  test('it offers the programmes the backend knows about', async () => {
    await show();

    expect(await screen.findByRole('option', { name: /Sistem Informasi/ })).toBeInTheDocument();
  });

  test('a WhatsApp number is asked for', async () => {
    // Admins cannot add a new member to the SALUT group without one, which is
    // why this field exists at all.
    await show();

    expect(screen.getByLabelText(/Nomor WhatsApp Aktif/)).toBeInTheDocument();
  });

  test('the WhatsApp number is required, not optional', async () => {
    await show();

    expect(screen.getByLabelText(/Nomor WhatsApp Aktif/)).toBeRequired();
  });

  test('the bank lists come from the backend rather than being hard-coded', async () => {
    await show();

    expect(await screen.findByRole('option', { name: /CTBC Bank/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Bank Central Asia/ })).toBeInTheDocument();
  });

  test('a page that cannot reach the catalogue still renders', async () => {
    server.use(
      http.get(url('/catalog/programs'), () => HttpResponse.error()),
      http.get(url('/config/banks'), () => HttpResponse.error()),
    );
    renderPage(<RegisterPage />);

    expect(await screen.findByRole('heading', { name: 'Daftar Akun' })).toBeInTheDocument();
  });
});

describe('submitting it', () => {
  test('a successful registration tells the student to check their email', async () => {
    await show();
    server.use(http.post(url('/auth/register'), () => HttpResponse.json({ message: 'ok' })));
    await fillForm();

    await userEvent.click(screen.getByRole('button', { name: /Daftar/ }));

    expect(
      await screen.findByRole('heading', { name: 'Cek Email Anda' }),
    ).toBeInTheDocument();
  });

  test('a rejected registration says why and keeps the form', async () => {
    await show();
    server.use(
      http.post(url('/auth/register'), () =>
        HttpResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 }),
      ),
    );
    await fillForm();

    await userEvent.click(screen.getByRole('button', { name: /Daftar/ }));

    expect(await screen.findByText(/sudah terdaftar/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Daftar Akun' })).toBeInTheDocument();
  });

  test('the address is sent as separate Mandarin fields', async () => {
    let body: Record<string, unknown> | undefined;
    await show();
    server.use(
      http.post(url('/auth/register'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: 'ok' });
      }),
    );
    await fillForm();

    await userEvent.click(screen.getByRole('button', { name: /Daftar/ }));

    await waitFor(() => expect(body).toBeDefined());
    for (const field of [
      'address_zh_city',
      'address_zh_district',
      'address_zh_road',
      'address_zh_number',
    ]) {
      expect(body).toHaveProperty(field);
    }
  });

  test('the semester is sent as a number, not the string the select holds', async () => {
    // The backend validates 1..9 as an integer; "3" would fail that check.
    let body: Record<string, unknown> | undefined;
    await show();
    server.use(
      http.post(url('/auth/register'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: 'ok' });
      }),
    );
    await fillForm();

    await userEvent.click(screen.getByRole('button', { name: /Daftar/ }));

    await waitFor(() => expect(body).toBeDefined());
    expect(typeof body!.current_semester).toBe('number');
  });

  test('an empty optional bank field is omitted rather than sent blank', async () => {
    // config/banks.js refuses an empty code; sending "" would fail a
    // registration that gave no bank details at all.
    let body: Record<string, unknown> | undefined;
    await show();
    server.use(
      http.post(url('/auth/register'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ message: 'ok' });
      }),
    );
    await fillForm();

    await userEvent.click(screen.getByRole('button', { name: /Daftar/ }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body!.bank_ntd_code).toBeUndefined();
    expect(body!.bank_idr_account).toBeUndefined();
  });
});

describe('Taiwan contact and free-text almamater size', () => {
  test('both new fields are required text inputs', async () => {
    await show();
    expect(screen.getByLabelText(/Nomor Taiwan Aktif/)).toBeRequired();
    expect(screen.getByLabelText(/Ukuran Almamater/)).toBeRequired();
    expect(screen.getByLabelText(/Ukuran Almamater/).tagName).toBe('INPUT');
    expect(screen.getByLabelText(/Ukuran Almamater/)).toHaveAttribute('maxlength', '30');
  });

  test('the introduction invites the student to connect with SALUT services', async () => {
    await show();
    expect(screen.getByText('Bersama SALUT Taiwan')).toBeInTheDocument();
    expect(screen.getByText(/Setiap perjalanan studi dimulai dari satu langkah/)).toBeInTheDocument();
    expect(screen.queryByText(/hingga keanggotaan SALUT/)).not.toBeInTheDocument();
  });

  test('submitting keeps WhatsApp separate and sends the normalized Taiwan phone and free-text size', async () => {
    let body: Record<string, unknown> | undefined;
    await show();
    server.use(http.post(url('/auth/register'), async ({ request }) => {
      body = await request.json() as Record<string, unknown>;
      return HttpResponse.json({ message: 'ok' });
    }));
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /Daftar/ }));
    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({
      profile_fields_version: 1,
      phone: '+6281234567890',
      phone_taiwan: '+886912345678',
      almamater_size: 'Ukuran khusus 2XL',
    });
  });

  test('an invalid Taiwan number prevents registration and explains how to correct it', async () => {
    let sent = false;
    await show();
    server.use(http.post(url('/auth/register'), () => { sent = true; return HttpResponse.json({}); }));
    await fillForm();
    const field = screen.getByLabelText(/Nomor Taiwan Aktif/);
    await userEvent.clear(field);
    await userEvent.type(field, '+6281234567890');
    await userEvent.click(screen.getByRole('button', { name: /Daftar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nomor seluler Taiwan/);
    expect(sent).toBe(false);
  });

  test('mismatched passwords cannot create an account', async () => {
    let sent = false;
    await show();
    server.use(http.post(url('/auth/register'), () => { sent = true; return HttpResponse.json({}); }));
    await fillForm();
    await userEvent.type(screen.getByLabelText('Konfirmasi Password *'), 'x');
    await userEvent.click(screen.getByRole('button', { name: /Daftar/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Konfirmasi password belum sesuai/);
    expect(sent).toBe(false);
  });

  test('an older backend cannot silently discard the new registration fields', async () => {
    server.use(http.get(url('/config/registration'), () => HttpResponse.json({}, { status: 404 })));
    await show();
    expect(await screen.findByRole('status')).toHaveTextContent(/Pendaftaran sedang diperbarui/);
    expect(screen.getByRole('button', { name: 'Daftar Sekarang' })).toBeDisabled();
  });

  test('configuration can be retried without losing typed details', async () => {
    server.use(http.get(url('/config/registration'), () => HttpResponse.json({}, { status: 503 })));
    await show();
    await screen.findByRole('status');
    await userEvent.type(screen.getByLabelText(/Nama Lengkap/), 'Nama Dipertahankan');
    server.use(http.get(url('/config/registration'), () => HttpResponse.json({
      profile_fields_version: 1, required_fields: ['phone_taiwan', 'almamater_size'], almamater_size_max_length: 30,
    })));
    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Daftar Sekarang' })).toBeEnabled());
    expect(screen.getByLabelText(/Nama Lengkap/)).toHaveValue('Nama Dipertahankan');
  });
});
