import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import AdminModulesPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
import { push } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

/** Opens the create dialog and fills every field the form requires. */
async function fillNewModule({ code = 'EKMA4111', name = 'Pengantar Bisnis' } = {}) {
  await userEvent.click(screen.getByRole('button', { name: '+ Tambah Modul' }));
  await userEvent.type(screen.getByPlaceholderText('ADBI4201'), code);
  await userEvent.type(screen.getByPlaceholderText('Pengantar Bisnis'), name);
  await userEvent.type(screen.getByPlaceholderText('25000'), '25000');
  await userEvent.type(screen.getByPlaceholderText('35000'), '35000');
}

/** The dialog's own submit — the page's "+ Tambah Modul" only opens it. */
const saveButton = () => screen.getByRole('button', { name: 'Simpan Modul' });

async function show(data = [fx.moduleSummary()], total = 1) {
  server.use(
    signedInAs(fx.adminProfile()),
    http.get(url('/modules'), () => HttpResponse.json({ data, total })),
  );
  renderPage(<AdminModulesPage />, { as: 'admin' });
  await screen.findByRole('heading', { name: 'Manajemen Modul' });
  // The table and its paging arrive after the heading.
  if (data.length > 0) await screen.findByText(data[0].tbo_code);
}

describe('the module catalogue an admin sees', () => {
  test('modules are listed', async () => {
    await show();

    expect(await screen.findByText('MKDU4109')).toBeInTheDocument();
  });

  test('a new module can be added', async () => {
    await show();
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(url('/modules'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'm-2' });
      }),
    );

    await fillNewModule();
    await userEvent.click(saveButton());

    await waitFor(() => expect(body?.tbo_code).toBe('EKMA4111'));
    expect(body!.price_student).toBe(25000);
  });

  test('a rejected creation says why', async () => {
    await show();
    server.use(
      http.post(url('/modules'), () =>
        HttpResponse.json({ error: 'Kode TBO sudah ada' }, { status: 409 }),
      ),
    );

    await fillNewModule({ code: 'MKDU4109', name: 'Duplikat' });
    await userEvent.click(saveButton());

    // The page reports a failed creation through a native alert.
    await waitFor(() =>
      expect(vi.mocked(globalThis.alert)).toHaveBeenCalledWith(
        expect.stringContaining('sudah ada'),
      ),
    );
  });

  test('an empty catalogue does not break the page', async () => {
    await show([], 0);

    expect(screen.getByRole('heading', { name: 'Manajemen Modul' })).toBeInTheDocument();
  });

  test('a student is turned away', async () => {
    server.use(signedInAs(fx.profile()));

    renderPage(<AdminModulesPage />, { as: 'student' });

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  test('the optional fields are sent when filled', async () => {
    // edition, author and publisher are optional; sending them blank rather
    // than omitting them would overwrite real data with empty strings.
    await show();
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(url('/modules'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'm-2' });
      }),
    );

    await fillNewModule();
    await userEvent.type(screen.getByPlaceholderText('1'), '2');
    await userEvent.type(screen.getByPlaceholderText('Nama pengarang'), 'Tim UT');
    await userEvent.click(saveButton());

    await waitFor(() => expect(body).toBeDefined());
    expect(body!.edition).toBe('2');
    expect(body!.author).toBe('Tim UT');
  });

  test('optional fields left blank are omitted, not sent empty', async () => {
    await show();
    let body: Record<string, unknown> | undefined;
    server.use(
      http.post(url('/modules'), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'm-2' });
      }),
    );

    await fillNewModule();
    await userEvent.click(saveButton());

    await waitFor(() => expect(body).toBeDefined());
    expect(body!.edition).toBeUndefined();
    expect(body!.author).toBeUndefined();
  });
});

describe('paging the catalogue', () => {
  test('a single page offers no paging', async () => {
    await show([fx.moduleSummary()], 1);

    expect(screen.queryByRole('button', { name: 'Selanjutnya' })).not.toBeInTheDocument();
  });

  test('a large catalogue can be paged', async () => {
    const pages: string[] = [];
    server.use(
      signedInAs(fx.adminProfile()),
      http.get(url('/modules'), ({ request }) => {
        pages.push(new URL(request.url).searchParams.get('page') ?? '');
        return HttpResponse.json({ data: [fx.moduleSummary()], total: 200 });
      }),
    );
    renderPage(<AdminModulesPage />, { as: 'admin' });
    await screen.findByText('MKDU4109');

    await userEvent.click(screen.getByRole('button', { name: 'Selanjutnya' }));

    await waitFor(() => expect(pages).toContain('2'));
  });

  test('the first page cannot go back', async () => {
    await show([fx.moduleSummary()], 200);

    expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled();
  });
});
