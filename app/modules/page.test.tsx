import { describe, expect, test, vi, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import ModulesPage from './page';
import { server } from '@/test/setup/msw';
import { url } from '@/test/msw/handlers';
import { renderPage, screen, waitFor } from '@/test/utils/renderWithProviders';
import * as fx from '@/test/fixtures';

const SEARCH_DEBOUNCE_MS = 400;

async function show({ data = [fx.moduleSummary()], total = 1 } = {}) {
  server.use(http.get(url('/modules'), () => HttpResponse.json({ data, total })));
  renderPage(<ModulesPage />);
  await screen.findByRole('heading', { name: 'Semua Modul' });
}

const searchBox = () => screen.getByPlaceholderText(/Cari kode atau nama modul/);

afterEach(() => vi.useRealTimers());

describe('browsing the catalogue', () => {
  test('modules are listed with their code and price', async () => {
    await show();

    expect(await screen.findByText('MKDU4109')).toBeInTheDocument();
    expect(screen.getByText('NT$1,700')).toBeInTheDocument();
  });

  test('an empty catalogue says so', async () => {
    await show({ data: [], total: 0 });

    expect(await screen.findByRole('heading', { name: 'Belum ada modul tersedia' })).toBeInTheDocument();
  });

  test('a module with no price is not shown as free', async () => {
    // The whole "gratis" bug family started here.
    await show({
      data: [
        fx.moduleSummary({ price_student: null, price_student_display: null } as never),
      ],
    });

    // modulePriceState maps a null price to 'needs_price', which the card
    // renders as a prompt to ask rather than as a number.
    expect(await screen.findByText('Hubungi Kami')).toBeInTheDocument();
    expect(screen.queryByText(/Gratis/)).not.toBeInTheDocument();
  });

  test('a failure to load is reported and can be retried', async () => {
    let attempts = 0;
    server.use(
      http.get(url('/modules'), () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.error()
          : HttpResponse.json({ data: [fx.moduleSummary()], total: 1 });
      }),
    );
    renderPage(<ModulesPage />);
    await screen.findByRole('button', { name: 'Coba lagi' });

    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByText('MKDU4109')).toBeInTheDocument();
  });
});

describe('searching', () => {
  test('a query of one character does not search', async () => {
    // Every keystroke would otherwise scan the whole catalogue.
    let searched = false;
    server.use(
      http.get(url('/modules/search'), () => {
        searched = true;
        return HttpResponse.json([]);
      }),
    );
    await show();

    await userEvent.type(searchBox(), 'b');

    await new Promise((r) => setTimeout(r, SEARCH_DEBOUNCE_MS + 100));
    expect(searched).toBe(false);
  });

  test('a real query returns matches', async () => {
    server.use(
      http.get(url('/modules/search'), () =>
        HttpResponse.json([fx.moduleSummary({ id: 'm-9', tbo_code: 'ESPA4122', name: 'Matematika' })]),
      ),
    );
    await show();

    await userEvent.type(searchBox(), 'matematika');

    expect(await screen.findByText('ESPA4122', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  test('a search matching nothing says so rather than showing the full list', async () => {
    server.use(http.get(url('/modules/search'), () => HttpResponse.json([])));
    await show();

    await userEvent.type(searchBox(), 'xyzzy');

    expect(
      await screen.findByRole('heading', { name: 'Modul tidak ditemukan' }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  test('clearing the box brings the full list back', async () => {
    server.use(http.get(url('/modules/search'), () => HttpResponse.json([])));
    await show();
    await userEvent.type(searchBox(), 'xyzzy');
    await screen.findByRole('heading', { name: 'Modul tidak ditemukan' }, { timeout: 3000 });

    await userEvent.clear(searchBox());

    expect(await screen.findByText('MKDU4109')).toBeInTheDocument();
  });

  test('a failing search shows no results rather than breaking the page', async () => {
    server.use(http.get(url('/modules/search'), () => HttpResponse.error()));
    await show();

    await userEvent.type(searchBox(), 'matematika');

    expect(
      await screen.findByRole('heading', { name: 'Modul tidak ditemukan' }, { timeout: 3000 }),
    ).toBeInTheDocument();
  });
});

describe('paging through the catalogue', () => {
  test('a single page of results offers no paging', async () => {
    await show({ total: 1 });

    expect(screen.queryByRole('button', { name: 'Selanjutnya' })).not.toBeInTheDocument();
  });

  test('a large catalogue can be paged', async () => {
    const seen: string[] = [];
    server.use(
      http.get(url('/modules'), ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('page') ?? '');
        return HttpResponse.json({ data: [fx.moduleSummary()], total: 200 });
      }),
    );
    renderPage(<ModulesPage />);
    await screen.findByText('MKDU4109');

    await userEvent.click(screen.getByRole('button', { name: 'Selanjutnya' }));

    await waitFor(() => expect(seen).toContain('2'));
  });
});
