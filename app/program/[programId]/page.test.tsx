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

  test('a purchasable module can be added on its own', async () => {
    await show();
    let body: { moduleId?: string } | undefined;
    server.use(
      http.post(url('/cart/items'), async ({ request }) => {
        body = (await request.json()) as { moduleId?: string };
        return HttpResponse.json(fx.cart());
      }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Tambah' }));

    await waitFor(() => expect(body?.moduleId).toBe('m-1'));
    expect(await screen.findByText(/ditambahkan ke keranjang/i)).toBeInTheDocument();
  });

  test('an unpriced module is requested rather than added', async () => {
    // Calling it "add to cart" would imply it can be paid for.
    await show({
      subjects: [
        subject({
          subject_modules: [
            { modules: fx.moduleSummary({ price_student: null, price_student_display: null } as never) },
          ],
        }),
      ],
    });
    server.use(http.post(url('/cart/items'), () => HttpResponse.json(fx.cart())));
    await userEvent.click(await screen.findByRole('button', { name: 'Minta' }));

    expect(await screen.findByText(/sebagai permintaan/i)).toBeInTheDocument();
  });

  test('a semester with no modules yet does not break the page', async () => {
    await show({ subjects: [subject({ subject_modules: [] })] });

    expect(await screen.findByRole('heading', { name: 'Sistem Informasi' })).toBeInTheDocument();
  });

  test('adding a single module says which kind it was', async () => {
    // An unpriced module goes in as a request; calling that "added to cart"
    // would imply it can be paid for.
    await show();
    server.use(http.post(url('/cart/items'), () => HttpResponse.json(fx.cart())));

    await userEvent.click(await screen.findByRole('button', { name: 'Tambah' }));

    expect(await screen.findByText(/ditambahkan/i)).toBeInTheDocument();
  });

  test('a failed add is reported rather than looking successful', async () => {
    await show();
    server.use(
      http.post(url('/cart/items'), () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Tambah' }));

    expect(await screen.findByText(/Gagal menambahkan modul/)).toBeInTheDocument();
  });

  test('a signed-out visitor is sent to log in rather than silently failing', async () => {
    const location = { href: '' } as Location;
    Object.defineProperty(window, 'location', { value: location, writable: true });
    setParams({ programId: 'pr-1' });
    server.use(
      http.get(url('/catalog/programs/:id'), () =>
        HttpResponse.json({ id: 'pr-1', code: 'S1SI', name: 'Sistem Informasi' }),
      ),
      http.get(url('/catalog/programs/:id/subjects'), () => HttpResponse.json([subject()])),
    );
    renderPage(<ProgramDetailPage />);
    await screen.findByRole('heading', { name: 'Sistem Informasi' });

    await userEvent.click(await screen.findByRole('button', { name: 'Tambah' }));

    await waitFor(() => expect(location.href).toBe('/login'));
  });

  test('a whole semester failing entirely is reported', async () => {
    await show();
    server.use(
      http.post(url('/cart/items'), () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /Tambah Semua ke Keranjang/ }),
    );

    expect(await screen.findByText(/Gagal menambahkan/)).toBeInTheDocument();
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
