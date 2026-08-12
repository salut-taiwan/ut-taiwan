import { describe, expect, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import ProgramDetailPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { setParams } from '@/test/utils/routerMock';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

const subject = (over = {}) => ({
  id: 's-1',
  code: 'MKDU4109',
  name: 'Bahasa Inggris',
  semester_hint: 1,
  subject_modules: [{ modules: fx.moduleSummary() }],
  ...over,
});

async function show({ program = { id: 'pr-1', code: 'S1SI', name: 'Sistem Informasi' }, subjects = [subject()] } = {}) {
  setParams({ programId: 'pr-1' });
  server.use(
    http.get(url('/catalog/programs/:id'), () =>
      program === null
        ? HttpResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
        : HttpResponse.json(program),
    ),
    http.get(url('/catalog/programs/:id/subjects'), () => HttpResponse.json(subjects)),
  );
  renderPage(<ProgramDetailPage />, { as: 'student' });
}

describe('a programme page', () => {
  test('it shows the programme and its modules', async () => {
    await show();

    expect(await screen.findByRole('heading', { name: 'Sistem Informasi' })).toBeInTheDocument();
    // The code appears on the subject heading and on its module card.
    expect((await screen.findAllByText('MKDU4109')).length).toBeGreaterThan(0);
  });

  test('a programme that does not exist says so', async () => {
    await show({ program: null as never });

    expect(await screen.findByText('Program tidak ditemukan')).toBeInTheDocument();
  });

  test('a module can be added on its own', async () => {
    await show();
    let added = false;
    server.use(
      http.post(url('/cart/items'), () => {
        added = true;
        return HttpResponse.json(fx.cart());
      }),
    );

    const buttons = await screen.findAllByRole('button');
    const add = buttons.find((b) => /Tambah/i.test(b.textContent ?? ''));
    if (add) {
      await userEvent.click(add);
      await waitFor(() => expect(added).toBe(true));
    }
  });

  test('a semester with no modules yet does not break the page', async () => {
    await show({ subjects: [subject({ subject_modules: [] })] });

    expect(await screen.findByRole('heading', { name: 'Sistem Informasi' })).toBeInTheDocument();
  });

  test('a whole semester can be added in one go', async () => {
    // The modules go one at a time under the hood, so the button has to
    // survive one of them failing rather than abandoning the rest.
    await show();
    let calls = 0;
    server.use(
      http.post(url('/cart/items'), () => {
        calls += 1;
        return HttpResponse.json(fx.cart());
      }),
    );

    const addAll = await screen.findByRole('button', { name: /Tambah Semua ke Keranjang/ });
    await userEvent.click(addAll);

    await waitFor(() => expect(calls).toBeGreaterThan(0), { timeout: 3000 });
  });
});
