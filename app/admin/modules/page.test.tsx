import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import AdminModulesPage from './page';
import { server } from '@/test/setup/msw';
import { signedInAs, url } from '@/test/msw/handlers';
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
});
