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
    phone: '0912345678',
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
